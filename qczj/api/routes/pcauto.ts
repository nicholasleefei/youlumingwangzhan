import { Router } from 'express'
import path from 'path'
import { PcautoJobManager } from '../jobs/pcautoJobManager.js'

export function createPcautoRouter(pcautoJobManager: PcautoJobManager) {
  const router = Router()

  router.post('/create', async (req, res) => {
    try {
      const { sgId, seriesName } = req.body
      if (!sgId || !seriesName) {
        return res.status(400).json({ success: false, error: '缺少参数' })
      }

      const outputDir = path.join(process.cwd(), 'downloads')
      const jobId = await pcautoJobManager.createJob(sgId, seriesName, outputDir)
      res.json({ success: true, jobId })
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) })
    }
  })

  router.get('/status/:jobId', (req, res) => {
    const job = pcautoJobManager.get(req.params.jobId)
    if (!job) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }
    res.json({
      success: true,
      data: {
        id: job.id,
        sgId: job.sgId,
        seriesName: job.seriesName,
        status: job.status,
        progress: job.progress,
        total: job.total,
        success: job.success,
        failed: job.failed,
        errors: job.errors,
      },
    })
  })

  router.get('/list', (req, res) => {
    const jobs = pcautoJobManager.list()
    res.json({
      success: true,
      data: jobs.map((j) => ({
        id: j.id,
        sgId: j.sgId,
        seriesName: j.seriesName,
        status: j.status,
        progress: j.progress,
        total: j.total,
        success: j.success,
        failed: j.failed,
        createdAt: j.createdAt,
      })),
    })
  })

  router.post('/abort/:jobId', (req, res) => {
    pcautoJobManager.abort(req.params.jobId)
    res.json({ success: true })
  })

  router.get('/log/:jobId', (req, res) => {
    const logPath = pcautoJobManager.getLogPath(req.params.jobId)
    if (!logPath) {
      return res.status(404).json({ success: false, error: '日志不存在' })
    }
    res.sendFile(logPath)
  })

  return router
}
