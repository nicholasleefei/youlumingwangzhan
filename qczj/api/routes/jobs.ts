import path from 'path'
import { Router, type Request, type Response } from 'express'
import type { JobManager } from '../jobs/jobManager.js'
import type { Job } from '../jobs/types.js'

export function createJobsRouter(jobManager: JobManager) {
  const router = Router()

  router.post('/', async (req: Request, res: Response) => {
    const seriesIdRaw = (req.body?.seriesId ?? req.body?.seriesID ?? req.body?.id) as
      | string
      | number
      | undefined
    const seriesId = Number(seriesIdRaw)

    if (!Number.isFinite(seriesId) || seriesId <= 0) {
      res.status(400).json({ success: false, error: 'seriesId 必须是正整数' })
      return
    }

    const splitBySpec = Boolean(req.body?.splitBySpec)
    const outputDirRaw = (req.body?.outputDir ?? '') as string
    const outputDir = typeof outputDirRaw === 'string' ? outputDirRaw.trim() : ''
    const job = jobManager.create(seriesId, { splitBySpec, outputDir })
    res.json({ success: true, data: { jobId: job.id } })
  })

  router.get('/:jobId', async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId)
    const job = jobManager.get(jobId)
    if (!job) {
      res.status(404).json({ success: false, error: 'job not found' })
      return
    }
    res.json({ success: true, data: job })
  })

  router.get('/:jobId/events', async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId)
    const job = jobManager.get(jobId)
    if (!job) {
      res.status(404).end()
      return
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    const send = (payload: unknown) => {
      res.write(`event: job_update\n`)
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    send(job)

    const listener = (j: Job) => {
      send(j)
      if (j.status === 'succeeded' || j.status === 'failed') {
        cleanup()
      }
    }

    const cleanup = () => {
      jobManager.offUpdate(jobId, listener)
      res.end()
    }

    jobManager.onUpdate(jobId, listener)
    req.on('close', () => cleanup())
  })

  router.get('/:jobId/download', async (req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'zip download disabled' })
  })

  router.get('/:jobId/files', async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId)
    const job = jobManager.get(jobId)
    if (!job) {
      res.status(404).json({ success: false, error: 'job not found' })
      return
    }

    const listing = await jobManager.listWorkFiles(jobId).catch((e) => {
      res.status(500).json({ success: false, error: String(e) })
      return null
    })
    if (!listing) return
    res.json({ success: true, data: listing })
  })

  router.get('/:jobId/file', async (req: Request, res: Response) => {
    const jobId = String(req.params.jobId)
    const relPath = String(req.query.path || '')
    if (!relPath) {
      res.status(400).json({ success: false, error: 'missing path' })
      return
    }

    const streamInfo = await jobManager.openWorkFile(jobId, relPath).catch((e) => {
      res.status(500).json({ success: false, error: String(e) })
      return null
    })
    if (!streamInfo) return

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(streamInfo.absPath)}"`)
    streamInfo.stream.on('error', () => {
      res.status(500).end()
    })
    streamInfo.stream.pipe(res)
  })

  return router
}
