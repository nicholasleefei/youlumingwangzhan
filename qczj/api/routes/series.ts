import { Router, type Request, type Response } from 'express'
import type { JobManager } from '../jobs/jobManager.js'

export function createSeriesRouter(jobManager: JobManager) {
  const router = Router()

  router.get('/search', async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim()
    try {
      const items = await jobManager.searchSeries(q)
      res.json({ success: true, data: items })
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) })
    }
  })

  return router
}

