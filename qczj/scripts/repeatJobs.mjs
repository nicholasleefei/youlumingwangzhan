const seriesId = Number(process.argv[2] || '6643')
const runs = Number(process.argv[3] || '5')

const base = 'http://localhost:22000/api'

async function createJob() {
  const r = await fetch(base + '/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ seriesId, splitBySpec: false }),
  })
  const j = await r.json()
  return j?.data?.jobId
}

async function waitJob(id, timeoutMs = 10 * 60 * 1000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const r = await fetch(base + '/jobs/' + id)
    const j = await r.json()
    const job = j?.data
    if (!job) throw new Error('job missing')
    if (job.status === 'succeeded' || job.status === 'failed') return job
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('timeout')
}

async function countFiles(id) {
  const r = await fetch(base + '/jobs/' + id + '/files')
  const j = await r.json()
  const files = j?.data?.files || []
  const list = files.map((f) => f.path)
  const count = (s) => list.filter((p) => p.includes(s)).length
  return {
    files: list.length,
    official: count('/08_品牌官方图/'),
    vrExt: count('/06_外观360VR/'),
    vrInt: count('/07_内饰360VR/'),
  }
}

for (let i = 1; i <= runs; i++) {
  const id = await createJob()
  if (!id) {
    console.log(`[${i}/${runs}] create failed`)
    continue
  }
  const job = await waitJob(id)
  const counts = await countFiles(id).catch(() => null)
  console.log(
    JSON.stringify(
      {
        run: i,
        jobId: id,
        status: job.status,
        stage: job.stage,
        progress: job.progress,
        errorCount: job.errors?.length || 0,
        lastError: (job.errors || []).slice(-1)[0] || null,
        counts,
      },
      null,
      2,
    ),
  )
}

