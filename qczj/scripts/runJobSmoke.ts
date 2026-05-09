import path from 'path'
import { JobManager } from '../api/jobs/jobManager.ts'

async function waitDone(jm: JobManager, jobId: string, timeoutMs: number) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const job = jm.get(jobId)
    if (!job) throw new Error('job not found')
    if (job.status === 'succeeded' || job.status === 'failed') return job
    await new Promise((r) => setTimeout(r, 1500))
  }
  throw new Error('timeout')
}

async function main() {
  process.env.IMG_MAX_EXTERIOR = process.env.IMG_MAX_EXTERIOR || '5'
  process.env.IMG_MAX_INTERIOR = process.env.IMG_MAX_INTERIOR || '5'
  process.env.IMG_MAX_DETAIL = process.env.IMG_MAX_DETAIL || '5'
  process.env.IMG_MAX_OFFICIAL = process.env.IMG_MAX_OFFICIAL || '5'
  process.env.DOWNLOAD_CONCURRENCY = process.env.DOWNLOAD_CONCURRENCY || '16'
  process.env.DOWNLOAD_TIMEOUT_MS = process.env.DOWNLOAD_TIMEOUT_MS || '60000'

  const baseDir = path.join(process.cwd(), '.tmp_run_state')
  const outDir = path.join(process.cwd(), '.tmp_run_out')
  const jm = new JobManager(baseDir)

  const job = jm.create(6643, { splitBySpec: false, outputDir: outDir })
  const done = await waitDone(jm, job.id, 10 * 60 * 1000)
  const listing = await jm.listWorkFiles(job.id)

  const counts = {
    official: listing.files.filter((f) => f.path.includes('/08_品牌官方图/')).length,
    vrExterior: listing.files.filter((f) => f.path.includes('/06_外观360VR/')).length,
    vrInterior: listing.files.filter((f) => f.path.includes('/07_内饰360VR/')).length,
  }

  console.log(
    JSON.stringify(
      {
        status: done.status,
        stage: done.stage,
        progress: done.progress,
        errorCount: done.errors.length,
        errors: done.errors.slice(-5),
        files: listing.files.length,
        counts,
        root: listing.root,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

