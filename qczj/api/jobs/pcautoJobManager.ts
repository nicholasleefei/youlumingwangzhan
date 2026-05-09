import path from 'path'
import fs from 'fs'
import iconv from 'iconv-lite'
import { ensureDir, safeFileName } from '../lib/fs'
import { fetchText, fetchBinary } from '../lib/http'

interface PcautoJob {
  id: string
  sgId: string
  seriesName: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  progress: number
  total: number
  success: number
  failed: number
  errors: Array<{ stage: string; message: string }>
  createdAt: number
}

const CATEGORIES: Record<string, { name: string; id: string; dir: string }> = {
  '1': { name: '外观', id: '1', dir: '外观图' },
  '2': { name: '内饰', id: '2', dir: '内饰图' },
  '3': { name: '空间', id: '3', dir: '空间图' },
  '4': { name: '细节', id: '4', dir: '细节图' },
  '8': { name: 'VR', id: '8', dir: 'VR全景' },
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export class PcautoJobManager {
  private jobs = new Map<string, PcautoJob>()
  private logBuffers = new Map<string, string[]>()
  private logPaths = new Map<string, string>()
  private abortControllers = new Map<string, AbortController>()

  private log(jobId: string, level: string, msg: string) {
    const line = `[${new Date().toISOString()}] [${jobId}] [${level}] ${msg}\n`
    const buffers = this.logBuffers.get(jobId)
    if (buffers) buffers.push(line)
    console.log(line.trim())
  }

  private async initJobLog(jobId: string, workDir: string) {
    const logDir = path.join(workDir, '_logs')
    await ensureDir(logDir)
    const logPath = path.join(logDir, 'job.log')
    this.logPaths.set(jobId, logPath)
    this.logBuffers.set(jobId, [])
    this.log(jobId, 'INFO', `log ready: ${logPath}`)
  }

  private async flushLog(jobId: string) {
    const buffers = this.logBuffers.get(jobId)
    const logPath = this.logPaths.get(jobId)
    if (buffers && logPath) {
      fs.appendFileSync(logPath, buffers.join(''))
      buffers.length = 0
    }
  }

  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return iconv.decode(buf, 'gbk')
  }

  private extractDataSrcUrls(html: string): string[] {
    const matches = html.match(/data-src="(https?:\/\/img\.pcauto\.com\.cn[^"]+)"/gi) || []
    return unique(matches.map((m) => m.match(/data-src="([^"]+)"/)?.[1]).filter(Boolean) as string[])
  }

  private getOriginalUrl(thumbUrl: string): string {
    return thumbUrl.replace(/_(\d+)x(\d+)\.jpg$/i, '.jpg')
  }

  private extractSybnTag(url: string): string | null {
    const match = url.match(/sybgn(\d+)/i)
    return match ? match[1] : null
  }

  private groupVrImagesByTag(urls: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>()
    for (const url of urls) {
      const tag = this.extractSybnTag(url)
      const key = tag || 'default'
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(url)
    }
    return groups
  }

  private getVrPositionName(tag: string, tagIndex: number, totalGroups: number): string {
    const positionNames = ['驾驶位', '副驾位', '后排']
    return positionNames[tagIndex % positionNames.length] || `位置${tagIndex + 1}`
  }

  private randomSample<T>(arr: T[], count: number): T[] {
    const shuffled = shuffle(arr)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  }

  private async downloadImage(url: string, outPath: string, controller: AbortController): Promise<boolean> {
    try {
      const res = await fetch(url, {
        timeout: 30000,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://price.pcauto.com.cn/',
        },
      })
      if (!res.ok) return false
      const buf = Buffer.from(await res.arrayBuffer())
      await fs.promises.writeFile(outPath, buf)
      return buf.length > 1000
    } catch {
      return false
    }
  }

  async createJob(sgId: string, seriesName: string, outputDir: string): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const job: PcautoJob = {
      id,
      sgId,
      seriesName,
      status: 'pending',
      progress: 0,
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      createdAt: Date.now(),
    }
    this.jobs.set(id, job)

    const workDir = path.join(outputDir, `太平洋_${safeFileName(seriesName)}_${sgId}`)
    await ensureDir(workDir)
    await this.initJobLog(id, workDir)

    this.runJob(id, workDir).catch((e) => {
      this.log(id, 'ERROR', `job error: ${e.message}`)
      job.status = 'failed'
    })

    return id
  }

  private async runJob(jobId: string, workDir: string) {
    const job = this.jobs.get(jobId)!
    job.status = 'running'
    this.log(jobId, 'INFO', `job start sgId=${job.sgId} seriesName=${job.seriesName}`)

    const controller = new AbortController()
    this.abortControllers.set(jobId, controller)

    try {
      const allUrls: Array<{ url: string; outPath: string; category: string }> = []

      for (const [catId, cat] of Object.entries(CATEGORIES)) {
        this.log(jobId, 'INFO', `collecting category: ${cat.name} (${catId})`)

        const catDir = path.join(workDir, cat.dir)
        await ensureDir(catDir)

        let page = 1
        let hasMore = true

        while (hasMore) {
          const pageUrl = `https://price.pcauto.com.cn/cars/imglist/sg${job.sgId}-${catId}-o${page}.html`
          this.log(jobId, 'INFO', `fetching page ${page}: ${pageUrl}`)

          let html = ''
          try {
            html = await this.fetchPage(pageUrl)
          } catch (e) {
            this.log(jobId, 'WARN', `fetch page ${page} failed: ${String(e)}`)
            break
          }

          const urls = this.extractDataSrcUrls(html)
          if (urls.length === 0) {
            hasMore = false
            break
          }

          this.log(jobId, 'INFO', `found ${urls.length} images on page ${page}`)

          // VR分类：全部下载，但限制位置数量
          if (catId === '8' && urls.length > 0) {
            const groups = this.groupVrImagesByTag(urls)
            let groupIndex = 0
            const maxGroups = 3 // 只下载3套VR（驾驶位、副驾位、后排）

            for (const [tag, groupUrls] of groups) {
              if (groupIndex >= maxGroups) {
                this.log(jobId, 'INFO', `VR skip tag=${tag}, max ${maxGroups} groups reached`)
                break
              }

              const positionName = this.getVrPositionName(tag, groupIndex, groups.size)
              const subDir = path.join(catDir, positionName)
              await ensureDir(subDir)

              // VR图片全部下载，不随机
              for (let i = 0; i < groupUrls.length; i++) {
                const thumbUrl = groupUrls[i]
                const originalUrl = this.getOriginalUrl(thumbUrl)
                const filename = `${String(i + 1).padStart(4, '0')}_${path.basename(originalUrl)}`
                const outPath = path.join(subDir, filename)
                allUrls.push({ url: originalUrl, outPath, category: cat.name })
              }

              this.log(jobId, 'INFO', `VR ${positionName} tag=${tag}, ${groupUrls.length} images`)
              groupIndex++
            }
          } else {
            // 非VR分类：随机采样20张
            const sampledUrls = this.randomSample(urls, 20)
            for (let i = 0; i < sampledUrls.length; i++) {
              const thumbUrl = sampledUrls[i]
              const originalUrl = this.getOriginalUrl(thumbUrl)
              const filename = `${String(i + 1).padStart(4, '0')}_${path.basename(originalUrl)}`
              const outPath = path.join(catDir, filename)
              allUrls.push({ url: originalUrl, outPath, category: cat.name })
            }
            this.log(jobId, 'INFO', `sampled ${sampledUrls.length} from ${urls.length} images`)
          }

          page++
          if (page > 50) break
          await new Promise((r) => setTimeout(r, 500))
        }
      }

      job.total = allUrls.length
      this.log(jobId, 'INFO', `total images to download: ${job.total}`)

      for (let i = 0; i < allUrls.length; i++) {
        if (controller.signal.aborted) break

        const item = allUrls[i]
        const success = await this.downloadImage(item.url, item.outPath, controller)

        if (success) {
          job.success++
        } else {
          job.failed++
        }

        job.progress = Math.round(((i + 1) / allUrls.length) * 100)
        await this.flushLog(jobId)

        if (i % 20 === 0) {
          this.log(jobId, 'INFO', `progress: ${job.progress}% (${i + 1}/${job.total})`)
        }
      }

      job.status = 'succeeded'
      this.log(jobId, 'INFO', `job done status=${job.status} success=${job.success} failed=${job.failed}`)
    } catch (e) {
      job.status = 'failed'
      job.errors.push({ stage: 'main', message: String(e) })
      this.log(jobId, 'ERROR', `job failed: ${String(e)}`)
    } finally {
      await this.flushLog(jobId)
      this.abortControllers.delete(jobId)
    }
  }

  get(id: string) {
    return this.jobs.get(id)
  }

  getLogPath(id: string) {
    return this.logPaths.get(id)
  }

  list() {
    return Array.from(this.jobs.values())
  }

  abort(id: string) {
    const controller = this.abortControllers.get(id)
    if (controller) {
      controller.abort()
      this.log(id, 'WARN', 'job aborted')
    }
  }
}
