/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import { JobManager } from './jobs/jobManager.js'
import { PcautoJobManager } from './jobs/pcautoJobManager.js'
import { createSeriesRouter } from './routes/series.js'
import { createJobsRouter } from './routes/jobs.js'
import { createConfigRouter } from './routes/config.js'
import { createPcautoRouter } from './routes/pcauto.js'
import { createKnowledgeRouter } from './routes/knowledge.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

const jobManager = new JobManager(path.join(__dirname, '..', 'data'))
const pcautoJobManager = new PcautoJobManager()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/config', createConfigRouter())
app.use('/api/series', createSeriesRouter(jobManager))
app.use('/api/jobs', createJobsRouter(jobManager))
app.use('/api/pcauto', createPcautoRouter(pcautoJobManager))
app.use('/api/knowledge', createKnowledgeRouter())

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error.message)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
