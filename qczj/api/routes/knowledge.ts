import { Router } from 'express'
import { pipeline, env } from '@huggingface/transformers'

// 配置文件缓存路径和不使用浏览器缓存
env.cacheDir = './.cache/transformers'

// Singleton extractor pattern to load model only once
class PipelineSingleton {
  static task = 'feature-extraction' as const
  static model = 'Xenova/all-MiniLM-L6-v2' // 384 dimensions, ~90MB
  static instance: any = null

  static async getInstance(progress_callback: any = null) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, { progress_callback })
    }
    return this.instance
  }
}

export function createKnowledgeRouter() {
  const router = Router()

  router.post('/embeddings', async (req, res) => {
    try {
      const { text } = req.body
      if (!text) {
        return res.status(400).json({ success: false, error: '缺少文本内容' })
      }

      console.log('Generating embedding locally using transformers.js...')
      const extractor = await PipelineSingleton.getInstance()
      const output = await extractor(text, { pooling: 'mean', normalize: true })
      
      // Output is a Tensor. We convert the float32 array to a regular JS array.
      const embedding = Array.from(output.data)

      res.json({ success: true, embedding })
    } catch (e) {
      console.error('Error generating embedding:', e)
      res.status(500).json({ success: false, error: String(e) })
    }
  })

  return router
}
