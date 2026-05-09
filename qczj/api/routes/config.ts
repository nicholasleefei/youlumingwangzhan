import { Router, type Request, type Response } from 'express'
import path from 'path'

export function createConfigRouter(): Router {
  const router = Router()

  router.get('/', (req: Request, res: Response) => {
    const defaultOutputDir = path.join(process.cwd(), 'downloads')
    res.json({
      success: true,
      data: {
        defaultOutputDir,
      },
    })
  })

  return router
}

