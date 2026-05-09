import path from 'path'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import fsSync from 'fs'
import { fetchBinary, fetchJson, fetchText } from '../lib/http.js'
import { ensureDir, safeFileName, writeFileAtomic } from '../lib/fs.js'
import type { Job, JobError, JobStage, SeriesSearchItem } from './types.js'

type JobUpdateListener = (job: Job) => void

type CategoryKey = 'exterior' | 'interior' | 'detail' | 'official'

const CATEGORY_DIR: Record<CategoryKey, string> = {
  exterior: '外观图',
  interior: '内饰图',
  detail: '细节图',
  official: '品牌官方图',
}

const VR_DIR = {
  exterior: '外观360VR',
  interior: '内饰360VR',
} as const

function now() {
  return Date.now()
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function clampErrors(errors: JobError[], max = 30) {
  return errors.slice(-max)
}

function normalizeImageUrl(url: string): string {
  let u = url.trim()
  if (u.startsWith('//')) u = `https:${u}`

  const m = u.match(/\/(\d+x\d+|\d+x0)_/)
  if (m) {
    u = u.replace(m[0], '/0x0_')
  }
  return u
}

function normalizeAutohomeImageUrl(url: string): string {
  let u = normalizeImageUrl(url)
  u = u.replace(/_(?:t|s|m|small|thumb)(\.(?:jpg|jpeg|png))(\?|$)/i, '$1$2')
  return u
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLikelyMaterialImageUrl(rawUrl: string): boolean {
  let u = rawUrl.trim()
  if (u.startsWith('//')) u = `https:${u}`
  if (!/^https?:/i.test(u)) return false

  let parsed: URL
  try {
    parsed = new URL(u)
  } catch {
    return false
  }

  const host = parsed.hostname.toLowerCase()
  if (!/^(?:pic|car\d+|img\d+)\.autoimg\.cn$/.test(host)) return false

  const p = parsed.pathname.toLowerCase()
  if (!/\.(?:jpg|jpeg|png)$/.test(p)) return false

  const denyParts = [
    'logo',
    'icon',
    'sprite',
    'banner',
    'advert',
    'ad_',
    '/ad/',
    'btn',
    'button',
    'qrcode',
    'app',
    'wap',
    'wechat',
    'weixin',
    'gif',
  ]
  if (denyParts.some((k) => p.includes(k))) return false

  const allowParts = ['album', 'product', 'cardfs', 'uimg', 'cars', 'spec', 'dealer', 'upload']
  if (!allowParts.some((k) => p.includes(`/${k}/`) || p.includes(`${k}/`))) return false

  return true
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

function isJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
}

function isPng(buf: Buffer): boolean {
  return (
    buf.length > 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
}

function isImageResponse(contentType: string | null, buf: Buffer): boolean {
  const ct = (contentType || '').toLowerCase()
  if (ct.startsWith('image/')) return true
  return isJpeg(buf) || isPng(buf)
}

type ImglistSpecItem = {
  specId: number
  year: number
  name: string
}

type ImglistSpecRawItem = {
  specid: number
  specname: string
  state?: number
  count?: number
}

type ImglistTypeItem = {
  typeId: number
  name: string
  key: CategoryKey | null
}

type ImglistVrInfoItem = {
  vrcover?: string
  vrurl?: string
  type?: number
  sepcid?: number
  specname?: string
}

type ImglistColorItem = {
  id: number
  value: string
  name: string
  piccount?: number
}

type ExtBaseInfo = {
  ext: {
    Id: number
    SeriesId: number
    SeriesName: string
    SpecId: number
    SpecName: string
  }
  color_info: Array<{
    ColorName: string
    ColorValue: string
    Hori?: {
      Normal?: Array<{ Seq: number; Url: string }>
      Preview?: Array<{ Seq: number; Url: string }>
    }
  }>
  image_root?: string
}

function parseNextDataFromHtml(html: string): any | null {
  const idx = html.indexOf('__NEXT_DATA__')
  if (idx < 0) return null
  const gt = html.indexOf('>', idx)
  if (gt < 0) return null
  const end = html.indexOf('</script>', gt)
  if (end < 0) return null
  const raw = html.slice(gt + 1, end).trim()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function mapImglistTypeToCategory(typeName: string): CategoryKey | null {
  if (typeName.includes('外观')) return 'exterior'
  if (typeName.includes('内饰')) return 'interior'
  if (typeName.includes('细节')) return 'detail'
  if (typeName.includes('官图')) return 'official'
  return null
}

function mapPicInfoNameToCategory(name: string): CategoryKey | null {
  if (!name) return null
  if (name.includes('官图') || name.includes('官方')) return 'official'
  if (name.includes('外观')) return 'exterior'
  if (name.includes('内饰')) return 'interior'
  if (name.includes('细节') || name.includes('特点')) return 'detail'
  return null
}

function extractImgDetailLinksFromImglistHtml(html: string, seriesId: number, specId: number, typeId: number): string[] {
  const re = new RegExp(
    `/cars/imgs-${seriesId}-${specId}-${typeId}-[^\\"<>\\s]+?/\\d+\\.html`,
    'g',
  )
  const matches = html.match(re) || []
  return unique(matches).map((p) => `https://www.autohome.com.cn${p.startsWith('/') ? '' : '/'}${p}`)
}

function pickBestImageUrl(urls: string[]): string | null {
  const scored = urls
    .map((u) => {
      const normalized = normalizeAutohomeImageUrl(u)
      if (!isLikelyMaterialImageUrl(normalized)) return null
      let score = 0
      if (normalized.includes('/0x0_')) score += 100
      if (normalized.includes('/1400x') || normalized.includes('1400x1050')) score += 20
      if (normalized.includes('/cardfs/product/')) score += 10
      if (normalized.includes('/cardfs/album/')) score += 10
      if (normalized.startsWith('https://')) score += 3
      if (normalized.startsWith('http://')) score += 1
      return { url: normalized, score }
    })
    .filter(Boolean) as Array<{ url: string; score: number }>

  if (scored.length === 0) return null
  scored.sort((a, b) => b.score - a.score)
  return scored[0].url
}

function toHexColor(v: string): string {
  const raw = (v || '').trim().replace(/^#/, '').toUpperCase()
  if (/^[0-9A-F]{6}$/.test(raw)) return `#${raw}`
  if (/^[0-9A-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
  }
  return '#UNKNOWN'
}

function toHexCombo(v: string): string {
  const raw = String(v || '').trim()
  if (!raw) return '#UNKNOWN'
  const parts = raw
    .split('/')
    .map((p) => toHexColor(p))
    .filter((p) => Boolean(p))
  if (parts.length === 0) return '#UNKNOWN'
  return parts.join('-')
}

function normalizeOutputDir(p: string): string | null {
  const raw = (p || '').trim()
  if (!raw) return null
  if (!path.isAbsolute(raw)) return null
  if (raw.startsWith('\\\\')) return null
  return path.resolve(raw)
}

async function ensureWritableDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
  const testFile = path.join(dir, `.qczj_write_test_${Date.now()}_${Math.random().toString(16).slice(2)}`)
  await fs.writeFile(testFile, 'ok')
  await fs.unlink(testFile)
}

function createLimiter(concurrency: number) {
  let active = 0
  const queue: Array<() => void> = []

  const next = () => {
    const fn = queue.shift()
    if (!fn) return
    fn()
  }

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= concurrency) {
      await new Promise<void>((resolve) => queue.push(resolve))
    }
    active += 1
    try {
      return await fn()
    } finally {
      active -= 1
      next()
    }
  }
}

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name])
  if (!Number.isFinite(v) || v <= 0) return fallback
  return Math.floor(v)
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = String(process.env[name] || '').trim().toLowerCase()
  if (!raw) return fallback
  if (['1', 'true', 'yes', 'y', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(raw)) return false
  return fallback
}

export class JobManager {
  private jobs = new Map<string, Job>()
  private emitter = new EventEmitter()
  private baseDir: string
  private logBuffers = new Map<string, string[]>()
  private logPaths = new Map<string, string>()
  private seriesPicBlocksCache = new Map<number, any[]>()
  private seriesVrInfoCache = new Map<number, ImglistVrInfoItem[]>()

  constructor(baseDir: string) {
    this.baseDir = baseDir
    this.emitter.setMaxListeners(200)
    this.loadExistingJobs().catch(() => {})
  }

  private formatLogLine(jobId: string, level: 'INFO' | 'WARN' | 'ERROR', msg: string) {
    const t = new Date().toISOString()
    const safe = String(msg || '').replace(/\s+/g, ' ').trim()
    return `[${t}] [${jobId}] [${level}] ${safe}\n`
  }

  private async appendJobLog(jobId: string, line: string) {
    const p = this.logPaths.get(jobId)
    if (!p) {
      const buf = this.logBuffers.get(jobId) || []
      buf.push(line)
      if (buf.length > 2000) buf.splice(0, buf.length - 2000)
      this.logBuffers.set(jobId, buf)
      return
    }
    await fs.appendFile(p, line).catch(() => undefined)
  }

  private log(jobId: string, level: 'INFO' | 'WARN' | 'ERROR', msg: string) {
    void this.appendJobLog(jobId, this.formatLogLine(jobId, level, msg))
  }

  private async initJobLog(jobId: string, workDir: string) {
    const logDir = path.join(workDir, '_logs')
    await ensureDir(logDir)
    const logPath = path.join(logDir, 'job.log')
    this.logPaths.set(jobId, logPath)
    const buf = this.logBuffers.get(jobId)
    if (buf?.length) {
      await fs.appendFile(logPath, buf.join('')).catch(() => undefined)
      this.logBuffers.delete(jobId)
    }
    this.log(jobId, 'INFO', `log ready: ${logPath}`)
  }

  private jobDir(jobId: string) {
    return path.join(this.baseDir, 'jobs', jobId)
  }

  private jobStatePath(jobId: string) {
    return path.join(this.jobDir(jobId), 'job.json')
  }

  private async loadExistingJobs() {
    const dir = path.join(this.baseDir, 'jobs')
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const ent of entries) {
        if (!ent.isDirectory()) continue
        const jobId = ent.name
        const p = this.jobStatePath(jobId)
        try {
          const raw = await fs.readFile(p, 'utf8')
          const parsed = JSON.parse(raw) as Job
          if (parsed?.id && parsed.id === jobId) {
            this.jobs.set(jobId, parsed)
          }
        } catch {
          continue
        }
      }
    } catch {
      return
    }
  }

  private async persist(job: Job) {
    await ensureDir(this.jobDir(job.id))
    await fs.writeFile(this.jobStatePath(job.id), JSON.stringify(job), 'utf8')
  }

  get(jobId: string): Job | null {
    return this.jobs.get(jobId) || null
  }

  onUpdate(jobId: string, listener: JobUpdateListener) {
    this.emitter.on(`job:${jobId}`, listener)
  }

  offUpdate(jobId: string, listener: JobUpdateListener) {
    this.emitter.off(`job:${jobId}`, listener)
  }

  create(seriesId: number, opts?: { splitBySpec?: boolean; outputDir?: string }): Job {
    const id = crypto.randomUUID()
    const outputDir = typeof opts?.outputDir === 'string' ? opts.outputDir.trim() : ''
    const job: Job = {
      id,
      seriesId,
      seriesName: '',
      splitBySpec: Boolean(opts?.splitBySpec),
      outputDir: outputDir || undefined,
      status: 'queued',
      stage: 'init',
      progress: { total: 0, done: 0, success: 0, failed: 0 },
      errors: [],
      createdAt: now(),
    }
    this.jobs.set(id, job)
    void this.persist(job).catch(() => undefined)
    this.emit(job)
    this.run(job).catch((e) => {
      const cur = this.get(id)
      if (cur) {
        this.pushError(cur, 'run', String(e))
        this.update(cur, { status: 'failed', stage: 'done', finishedAt: now() })
      }
    })
    return job
  }

  private async resolveWorkDir(jobId: string): Promise<{ root: string; absDir: string } | null> {
    const job = this.get(jobId)
    if (!job) return null
    const base = job.outputDirEffective || path.join(this.baseDir, 'jobs', jobId, 'work')
    const rootName = job.workRoot || ''
    if (rootName) {
      const abs = path.join(base, rootName)
      try {
        const st = await fs.stat(abs)
        if (st.isDirectory()) return { root: rootName, absDir: abs }
      } catch {
        return null
      }
    }

    if (job.outputDirEffective) return null

    try {
      const entries = await fs.readdir(base, { withFileTypes: true })
      const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)
      if (dirs.length === 0) return null
      const picked = dirs.sort()[0]
      return { root: picked, absDir: path.join(base, picked) }
    } catch {
      return null
    }
  }

  async listWorkFiles(jobId: string): Promise<{ root: string; files: Array<{ path: string; size: number }> }> {
    const resolved = await this.resolveWorkDir(jobId)
    if (!resolved) throw new Error('work dir not ready')

    const walk = async (dir: string, prefix: string, out: Array<{ path: string; size: number }>) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const ent of entries) {
        const abs = path.join(dir, ent.name)
        const rel = prefix ? `${prefix}/${ent.name}` : ent.name
        if (ent.isDirectory()) {
          await walk(abs, rel, out)
        } else if (ent.isFile()) {
          const st = await fs.stat(abs)
          out.push({ path: `${resolved.root}/${rel}`.replace(/\\/g, '/'), size: st.size })
        }
      }
    }

    const files: Array<{ path: string; size: number }> = []
    await walk(resolved.absDir, '', files)
    files.sort((a, b) => a.path.localeCompare(b.path))
    return { root: resolved.root, files }
  }

  async openWorkFile(jobId: string, relPath: string): Promise<{ absPath: string; stream: fsSync.ReadStream } | null> {
    const resolved = await this.resolveWorkDir(jobId)
    if (!resolved) return null

    const safeRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '')
    if (!safeRel.startsWith(`${resolved.root}/`)) return null

    const job = this.get(jobId)
    if (!job) return null
    const base = job.outputDirEffective || path.join(this.baseDir, 'jobs', jobId, 'work')

    const abs = path.resolve(path.join(base, safeRel))
    const rootAbs = path.resolve(path.join(base, resolved.root))
    if (!abs.startsWith(rootAbs)) return null

    try {
      const st = await fs.stat(abs)
      if (!st.isFile()) return null
    } catch {
      return null
    }

    return { absPath: abs, stream: fsSync.createReadStream(abs) }
  }

  async searchSeries(query: string): Promise<SeriesSearchItem[]> {
    const q = query.trim()
    if (!q) return []

    if (/^\d+$/.test(q)) {
      const id = Number(q)
      if (!Number.isFinite(id) || id <= 0) return []
      const name = await this.resolveSeriesName(id).catch(() => '')
      return [
        {
          seriesId: id,
          name: name || `车系 ${id}`,
          url: `https://www.autohome.com.cn/${id}/`,
        },
      ]
    }

    const url = `https://sou.autohome.com.cn/zonghe?q=${encodeURIComponent(q)}`

    let playwright: typeof import('playwright') | null = null
    try {
      playwright = await import('playwright')
    } catch {
      return []
    }

    const browser = await playwright.chromium.launch({ headless: true })
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    })
    const page = await context.newPage()

    let ids: number[] = []
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForTimeout(8000)
      const html = await page.content()
      ids = [...html.matchAll(/https?:\/\/www\.autohome\.com\.cn\/(\d+)\//g)].map(
        (m) => Number(m[1]),
      )
    } finally {
      await page.close().catch(() => {})
      await context.close().catch(() => {})
      await browser.close().catch(() => {})
    }

    const limited = unique(ids).filter((n) => Number.isFinite(n) && n > 0).slice(0, 10)
    const results: SeriesSearchItem[] = []
    for (const id of limited) {
      const name = await this.resolveSeriesName(id).catch(() => '')
      results.push({
        seriesId: id,
        name: name || `车系 ${id}`,
        url: `https://www.autohome.com.cn/${id}/`,
      })
    }
    return results
  }

  private emit(job: Job) {
    this.emitter.emit(`job:${job.id}`, job)
  }

  private update(job: Job, patch: Partial<Job>) {
    const base = this.jobs.get(job.id) || job
    const merged: Job = {
      ...base,
      ...patch,
      progress: patch.progress ? patch.progress : base.progress,
      errors: patch.errors ? patch.errors : base.errors,
    }
    this.jobs.set(job.id, merged)
    void this.persist(merged).catch(() => undefined)
    this.emit(merged)
  }

  private pushError(job: Job, at: string, message: string) {
    this.log(job.id, 'ERROR', `${at} ${message}`)
    const errors = clampErrors([...job.errors, { at, message }])
    this.update(job, { errors })
  }

  private setStage(job: Job, stage: JobStage) {
    this.log(job.id, 'INFO', `stage -> ${stage}`)
    this.update(job, { stage })
  }

  private bumpProgress(job: Job, patch: Partial<Job['progress']>) {
    this.update(job, {
      progress: {
        ...job.progress,
        ...patch,
      },
    })
  }

  private async resolveSeriesName(seriesId: number): Promise<string> {
    const url = `https://car.autohome.com.cn/pic/series/${seriesId}.html`
    const { text } = await fetchText(url, { encoding: 'gb18030', timeoutMs: 15000 })
    const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i)
    const title = (titleMatch?.[1] || '').replace(/\s+/g, ' ').trim()
    let name = ''
    const bracket = title.match(/【\s*([^】]+?)\s*】/)
    if (bracket?.[1]) {
      name = bracket[1].replace(/图片/g, '').trim()
    }
    if (!name) {
      const idx = title.indexOf('图片')
      name = (idx > 0 ? title.slice(0, idx) : title).replace(/[【】]/g, '').trim()
    }
    if (!name) {
      console.log(`[WARN] resolveSeriesName(${seriesId}) failed, title="${title}"`)
    }
    return name || `车系_${seriesId}`
  }

  private async collectCategoryLinks(seriesId: number): Promise<Record<CategoryKey, string[]>> {
    const url = `https://car.autohome.com.cn/pic/series/${seriesId}.html`
    const { text } = await fetchText(url, { encoding: 'gb18030', timeoutMs: 20000 })

    const interiorHints = ['内饰', '座椅', '中控', '方向盘', '仪表', '储物', '空调', '车门']
    const exteriorHints = ['外观', '车身', '灯', '轮', '车尾', '车头', '侧面']
    const detailHints = ['细节', '发动机', '底盘', '后备厢', '行李厢', '电机', '充电口']
    const officialHints = ['官方', '海报', '宣传']
    const inBucket = (title: string, hints: string[]) => hints.some((h) => title.includes(h))

    const anchors: Array<{ href: string; label: string }> = []
    const aRe = new RegExp(
      `<a[^>]+href="(/pic/series/${seriesId}-(\\d+)\\.html)[^\"]*"[^>]*>([\\s\\S]*?)<\\/a>`,
      'gi',
    )
    let am: RegExpExecArray | null
    while ((am = aRe.exec(text))) {
      const href = `https://car.autohome.com.cn${am[1]}`
      const label = stripTags(am[3] || '')
      if (!label) continue
      anchors.push({ href, label })
    }

    const buckets: Record<CategoryKey, string[]> = {
      exterior: [],
      interior: [],
      detail: [],
      official: [],
    }

    for (const a of anchors) {
      if (inBucket(a.label, officialHints)) buckets.official.push(a.href)
      else if (inBucket(a.label, exteriorHints)) buckets.exterior.push(a.href)
      else if (inBucket(a.label, interiorHints)) buckets.interior.push(a.href)
      else if (inBucket(a.label, detailHints)) buckets.detail.push(a.href)
    }

    if (Object.values(buckets).some((v) => v.length > 0)) {
      for (const k of Object.keys(buckets) as CategoryKey[]) {
        if (buckets[k].length === 0) buckets[k] = [url]
      }
      return buckets
    }

    const pageUrls = unique(
      [...text.matchAll(new RegExp(`/pic/series/${seriesId}-(\\d+)\\.html`, 'g'))].map(
        (m) => `https://car.autohome.com.cn/pic/series/${seriesId}-${m[1]}.html`,
      ),
    ).slice(0, 60)

    const limit = createLimiter(2)
    await Promise.all(
      pageUrls.map((pUrl) =>
        limit(async () => {
          const { text: html } = await fetchText(pUrl, { encoding: 'gb18030', timeoutMs: 20000, retry: 3 })
          const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i)
          const title = (titleMatch?.[1] || '').replace(/\s+/g, ' ').trim()

          if (inBucket(title, officialHints)) buckets.official.push(pUrl)
          else if (inBucket(title, exteriorHints)) buckets.exterior.push(pUrl)
          else if (inBucket(title, interiorHints)) buckets.interior.push(pUrl)
          else if (inBucket(title, detailHints)) buckets.detail.push(pUrl)
        }),
      ),
    )

    for (const k of Object.keys(buckets) as CategoryKey[]) {
      if (buckets[k].length === 0) buckets[k] = [url]
    }

    return buckets
  }

  private async collectImagesFromPicPages(
    seriesId: number,
    entryUrl: string,
    limits: { maxPages: number; maxImages: number },
  ): Promise<string[]> {
    const seen = new Set<string>()
    const urls: string[] = []

    const subMatch = entryUrl.match(new RegExp(`/pic/series/${seriesId}-(\\d+)\\.html`))
    const scopePrefix = subMatch
      ? `https://car.autohome.com.cn/pic/series/${seriesId}-${subMatch[1]}`
      : null

    const queue: string[] = [entryUrl]
    while (queue.length && seen.size < limits.maxPages && urls.length < limits.maxImages) {
      const cur = queue.shift()!
      if (seen.has(cur)) continue
      seen.add(cur)

      const { text } = await fetchText(cur, { encoding: 'gb18030' })

      const imgRe = /(?:https?:)?\/\/(?:pic|car\d+|img\d+)\.autoimg\.cn\/[^\s"'<>]+?\.(?:jpg|jpeg|png)(?:\?[^\s"'<>]*)?/gi
      for (const m of text.match(imgRe) || []) {
        const normalized = normalizeAutohomeImageUrl(m)
        if (!isLikelyMaterialImageUrl(normalized)) continue
        urls.push(normalized)
        if (urls.length >= limits.maxImages) break
      }

      const hrefRe = /href="([^"]+)"/gi
      let hm: RegExpExecArray | null
      while ((hm = hrefRe.exec(text)) && seen.size + queue.length < limits.maxPages) {
        const href = hm[1]
        const abs = href.startsWith('http')
          ? href
          : href.startsWith('//')
            ? `https:${href}`
            : `https://car.autohome.com.cn${href.startsWith('/') ? '' : '/'}${href}`
        if (!abs.includes(`/pic/series/${seriesId}`)) continue
        if (!abs.endsWith('.html')) continue
        if (scopePrefix && !abs.startsWith(scopePrefix)) continue
        queue.push(abs)
      }
    }

    return unique(urls)
  }

  private async collectImglistSpecsAndTypes(seriesId: number): Promise<{
    specs: ImglistSpecItem[]
    types: ImglistTypeItem[]
  }> {
    const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-x-x-x-x-x-1.html`
    const { text } = await fetchText(url, { encoding: 'utf-8' })
    const next = parseNextDataFromHtml(text)
    const pp = next?.props?.pageProps

    const includeDiscontinued = envBool('INCLUDE_DISCONTINUED', false)

    const specs: ImglistSpecItem[] = []
    const specList = (pp?.specList || []) as Array<{ year: number; list: ImglistSpecRawItem[] }>
    for (const y of specList) {
      for (const s of y.list || []) {
        const specId = Number((s as any).specid)
        if (!Number.isFinite(specId) || specId <= 0) continue
        const state = Number((s as any).state)
        if (!includeDiscontinued) {
          if (Number.isFinite(state) && state !== 20) continue
        }
        const name = String((s as any).specname || '').trim()
        if (!name) continue
        specs.push({ specId, year: Number((y as any).year) || 0, name })
      }
    }

    const types: ImglistTypeItem[] = []
    const typeList = (pp?.typeList || []) as Array<{ id: number; name: string }>
    for (const t of typeList) {
      const typeId = Number((t as any).id)
      if (!Number.isFinite(typeId)) continue
      const name = String((t as any).name || '').trim()
      if (!name) continue
      const key = mapImglistTypeToCategory(name)
      if (!key) continue
      types.push({ typeId, name, key })
    }

    return {
      specs: unique(specs.map((s) => JSON.stringify(s))).map((raw) => JSON.parse(raw) as ImglistSpecItem),
      types: unique(types.map((t) => JSON.stringify(t))).map((raw) => JSON.parse(raw) as ImglistTypeItem),
    }
  }

  private async fetchImglistPageProps(seriesId: number, specId: number | null): Promise<any | null> {
    const specPart = specId && specId > 0 ? String(specId) : 'x'
    const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-1.html`
    const { text } = await fetchText(url, { encoding: 'utf-8', timeoutMs: 20000 })
    const next = parseNextDataFromHtml(text)
    return next?.props?.pageProps || null
  }

  private extractVrInfoFromImglistPageProps(pp: any): {
    specId: number | null
    specName: string
    exteriorUrl: string | null
    interiorPanoUrl: string | null
  } {
    const vrinfo = (pp?.SeriesPicList?.vrinfo || []) as ImglistVrInfoItem[]
    const specId = Number((vrinfo[0] as any)?.sepcid)
    const specName = String((vrinfo[0] as any)?.specname || '').trim()
    let exteriorUrl: string | null = null
    let interiorPanoUrl: string | null = null

    for (const v of vrinfo) {
      const u = String(v?.vrurl || '').trim()
      if (!u) continue
      if (Number(v?.type) === 1 && u.includes('/car/ext/')) exteriorUrl = u
      if (Number(v?.type) === 2 && u.includes('/car/pano/')) interiorPanoUrl = u
    }

    return {
      specId: Number.isFinite(specId) && specId > 0 ? specId : null,
      specName: specName || '未知车型',
      exteriorUrl,
      interiorPanoUrl,
    }
  }

  private extractInteriorColorsFromImglistPageProps(pp: any): ImglistColorItem[] {
    const list = pp?.icolorList?.color
    if (!Array.isArray(list)) return []
    const out: ImglistColorItem[] = []
    for (const it of list as any[]) {
      const id = Number(it?.id)
      if (!Number.isFinite(id) || id <= 0) continue
      const name = String(it?.name || '').trim()
      const value = String(it?.value || '').trim()
      if (!name || !value) continue
      out.push({ id, name, value, piccount: Number(it?.piccount) || 0 })
    }
    return out
  }

  private buildInteriorXmlUrl(panoId: number, intColorId: number): string {
    const i = Number.isFinite(intColorId) && intColorId > 0 ? String(intColorId) : '-1'
    return `https://pano.autohome.com.cn/car/pano/${panoId}.xml?v=20180831&paintingid=-1&intcolorid=${i}&_sd=1`
  }

  private async collectLimitedImagesFromImglistPicInfo(
    seriesId: number,
    specId: number | null,
    maxByKey: Record<CategoryKey, number>,
  ): Promise<Record<CategoryKey, string[]>> {
    const empty: Record<CategoryKey, string[]> = {
      exterior: [],
      interior: [],
      detail: [],
      official: [],
    }

    const getBlocksFromPageProps = (pp: any): any[] => {
      const rawPicinfo = pp?.SeriesPicList?.picinfo
      if (Array.isArray(rawPicinfo)) return rawPicinfo
      if (rawPicinfo && typeof rawPicinfo === 'object') {
        const callist = (rawPicinfo as any).callist
        if (Array.isArray(callist)) return callist
      }
      return []
    }

    const pp = await this.fetchImglistPageProps(seriesId, specId)
    if (!pp) return empty

    const picBlocks = getBlocksFromPageProps(pp)
    if (!picBlocks.length) return empty

    const out: Record<CategoryKey, string[]> = {
      exterior: [],
      interior: [],
      detail: [],
      official: [],
    }

    const fillFromBlocks = (blocks: any[], onlyMissingKeys: Set<CategoryKey> | null) => {
      for (const block of blocks as any[]) {
        const name = String(block?.name || '').trim()
        const key = mapPicInfoNameToCategory(name)
        if (!key) continue
        if (onlyMissingKeys && !onlyMissingKeys.has(key)) continue
        const cap = Math.max(0, Number(maxByKey[key]) || 0)
        if (cap <= 0) continue
        if (out[key].length >= cap) continue

        const list = block?.list
        if (!Array.isArray(list)) continue
        for (const it of list as any[]) {
          if (out[key].length >= cap) break
          if (specId && Number(it?.specid) && Number(it?.specid) !== specId) continue
          const p = String(it?.picpath || '').trim()
          if (!p) continue
          const u = normalizeAutohomeImageUrl(p)
          if (!isLikelyMaterialImageUrl(u)) continue
          out[key].push(u)
        }
      }
    }

    fillFromBlocks(picBlocks, null)

    if (specId) {
      const typeList = (pp?.typeList || []) as Array<{ id: number; name: string }>
      const types: ImglistTypeItem[] = []
      for (const t of typeList) {
        const typeId = Number((t as any).id)
        if (!Number.isFinite(typeId)) continue
        const name = String((t as any).name || '').trim()
        if (!name) continue
        const key = mapImglistTypeToCategory(name)
        if (!key) continue
        types.push({ typeId, name, key })
      }

      const missing = new Set<CategoryKey>()
      for (const k of Object.keys(out) as CategoryKey[]) {
        const cap = Math.max(0, Number(maxByKey[k]) || 0)
        if (cap <= 0) continue
        if (out[k].length === 0) missing.add(k)
      }

      if (missing.size) {
        let cached = this.seriesPicBlocksCache.get(seriesId)
        if (!cached) {
          const ppSeries = await this.fetchImglistPageProps(seriesId, null).catch(() => null)
          cached = ppSeries ? getBlocksFromPageProps(ppSeries) : []
          this.seriesPicBlocksCache.set(seriesId, cached)
        }
        if (cached?.length) fillFromBlocks(cached, missing)
      }

      if (missing.size) {
        for (const k of missing) {
          const typeEntry = types.find((t) => t.key === k)
          if (!typeEntry) continue
          let urls: string[] = []
          if (k === 'official') {
            urls = await this.collectImagesFromImglistSpecType(seriesId, 0, typeEntry.typeId, { maxPages: 3, maxImages: maxByKey.official || 20 }).catch(() => [])
          } else {
            urls = await this.collectImagesFromImglistSpecType(seriesId, specId, typeEntry.typeId, { maxPages: 3, maxImages: 20 }).catch(() => [])
          }
          if (urls.length > 0) {
            out[k] = [...out[k], ...urls]
          }
        }
      }
    }

    for (const k of Object.keys(out) as CategoryKey[]) {
      out[k] = unique(out[k])
      const cap = Math.max(0, Number(maxByKey[k]) || 0)
      if (cap > 0 && out[k].length > cap) {
        out[k] = shuffle(out[k]).slice(0, cap)
      }
    }

    return out
  }

  private async collectImageUrlsFromImgDetail(detailUrl: string): Promise<string[]> {
    const { text } = await fetchText(detailUrl, { encoding: 'gb18030' })
    const imgRe = /https?:\/\/(?:pic|car\d+|img\d+)\.autoimg\.cn\/[^\s"'<>]+?\.(?:jpg|jpeg|png)(?:\?[^\s"'<>]*)?/gi
    let urls: string[] = (text.match(imgRe) || []) as string[]
    if (urls.length === 0) {
      const protoRelRe = /\/\/(?:pic|car\d+|img\d+)\.autoimg\.cn\/[^\s"'<>]+?\.(?:jpg|jpeg|png)(?:\?[^\s"'<>]*)?/gi
      urls = ((text.match(protoRelRe) || []) as string[]).map((u: string) => 'https:' + u)
    }
    return unique(urls)
  }

  private async collectImagesFromImglistSpecType(
    seriesId: number,
    specId: number,
    typeId: number,
    limits: { maxPages: number; maxImages: number },
  ): Promise<string[]> {
    const detailLinks: string[] = []
    const seenListing = new Set<number>()
    for (let pageIdx = 1; pageIdx <= limits.maxPages; pageIdx++) {
      const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specId}-${typeId}-x-x-x-x-${pageIdx}.html`
      const { text } = await fetchText(url, { encoding: 'utf-8' })
      const links = extractImgDetailLinksFromImglistHtml(text, seriesId, specId, typeId)
      if (links.length === 0) {
        if (pageIdx === 1) return []
        break
      }
      if (seenListing.has(links.length)) {
        break
      }
      seenListing.add(links.length)
      detailLinks.push(...links)
      if (detailLinks.length >= limits.maxImages) break
    }

    const limitedDetails = unique(detailLinks).slice(0, limits.maxImages)

    const limit = createLimiter(envInt('DETAIL_CONCURRENCY', 10))
    const out: string[] = []
    await Promise.all(
      limitedDetails.map((dUrl) =>
        limit(async () => {
          const urls = await this.collectImageUrlsFromImgDetail(dUrl).catch(() => [])
          const best = pickBestImageUrl(urls)
          if (best) out.push(best)
        }),
      ),
    )

    return unique(out)
  }

    private async resolveExtIdFromSpecId(specId: number): Promise<number | null> {
    const url = `https://pano.autohome.com.cn/car/ext/${specId}`
    const { text } = await fetchText(url, { encoding: 'utf-8' })
    let extId = 0
    const gcStart = text.indexOf('globalConfig')
    if (gcStart >= 0) {
      const afterGc = text.slice(gcStart)
      const idMatch = afterGc.match(/id\s*:\s*"?(\d+)"?/)
      if (idMatch?.[1]) {
        extId = Number(idMatch[1])
      }
    }
    if (!Number.isFinite(extId) || extId <= 0) return null
    return extId
  }

  private async fetchExtBaseInfo(extId: number): Promise<ExtBaseInfo> {
    const url = `https://pano.autohome.com.cn/api/ext/baseinfo/${extId}?src=m&category=car&deviceId=`
    const { data } = await fetchJson<ExtBaseInfo>(url)
    return data
  }

  private buildExteriorVrItems(
    baseInfo: ExtBaseInfo,
    outDir: string,
  ): Array<{ url: string; outPath: string }> {
    const root = (baseInfo.image_root || '').trim() || 'https://img3.autoimg.cn/pano'
    const items: Array<{ url: string; outPath: string }> = []

    for (const c of baseInfo.color_info || []) {
      const colorName = String(c.ColorName || '').trim() || '默认'
      const colorHex = toHexColor(String(c.ColorValue || ''))
      const folder = safeFileName(`${colorName}_${colorHex}`)
      const dir = path.join(outDir, folder)
      const frames = (c.Hori?.Normal || []).slice().sort((a, b) => (a.Seq ?? 0) - (b.Seq ?? 0))

      for (let i = 0; i < frames.length; i++) {
        const f = frames[i]
        const rel = String(f.Url || '').trim()
        if (!rel) continue
        const full = rel.startsWith('http') ? rel : `${root.replace(/\/$/, '')}/${rel.replace(/^\//, '')}`
        const normalized = normalizeAutohomeImageUrl(full)
        const ext = (normalized.match(/\.(jpg|jpeg|png)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase()
        const name = String(i + 1).padStart(4, '0')
        items.push({
          url: normalized,
          outPath: path.join(dir, `${name}.${ext === 'jpeg' ? 'jpg' : ext}`),
        })
      }
    }

    return items
  }

  private async resolveInteriorPanoXmlUrl(specId: number): Promise<string | null> {
    const url = `https://pano.autohome.com.cn/car/ext/${specId}`
    const { text } = await fetchText(url, { timeoutMs: 15000 })

    const idMatch =
      text.match(/panourl:\s*"https?:\/\/pano\.autohome\.com\.cn\/car\/pano\/(\d+)"/i) ||
      text.match(/panourl:\s*"\/\/pano\.autohome\.com\.cn\/car\/pano\/(\d+)"/i) ||
      text.match(/panourl:\s*\"https?:\\\/\\\/pano\.autohome\.com\.cn\\\/car\\\/pano\\\/(\d+)\"/i) ||
      text.match(/panourl:\s*\"\\\/\\\/pano\.autohome\.com\.cn\\\/car\\\/pano\\\/(\d+)\"/i) ||
      text.match(/\/car\/pano\/(\d+)\.xml/i) ||
      text.match(/\/car\/pano\/(\d+)/i) ||
      text.match(/\\\/car\\\/pano\\\/(\d+)\.xml/i) ||
      text.match(/\\\/car\\\/pano\\\/(\d+)/i)

    const panoId = Number(idMatch?.[1])
    if (!Number.isFinite(panoId) || panoId <= 0) return null

    return `https://pano.autohome.com.cn/car/pano/${panoId}.xml?v=20180831&paintingid=-1&intcolorid=-1&_sd=1`
  }

  private extractInteriorCubeFaceUrlsFromXml(xml: string, intColorId?: number): Array<{ scene: string; url: string }> {
    const tileserverRaw = xml.match(/tileserver=\"([^\"]+)\"/i)?.[1] || ''
    const tileserver = tileserverRaw.startsWith('//')
      ? `https:${tileserverRaw}`
      : tileserverRaw.startsWith('http')
        ? tileserverRaw
        : `https://${tileserverRaw.replace(/^\/+/, '')}`

    const results: Array<{ scene: string; url: string }> = []
    const faces = ['l', 'r', 'u', 'd', 'f', 'b']

    const sceneRe = /<scene[^>]+name=\"([^\"]+)\"[^>]*>[\s\S]*?<\/scene>/gi
    let sm: RegExpExecArray | null
    while ((sm = sceneRe.exec(xml))) {
      const sceneName = sm[1]
      const block = sm[0]

      // Extract colorid from scene block
      const colorIdMatch = block.match(/colorid=\"(\d+)\"/i)
      if (colorIdMatch) {
        const sceneColorId = Number(colorIdMatch[1])
        // Filter: if intColorId is specified and doesn't match, skip this scene
        if (Number.isFinite(intColorId) && intColorId > 0 && sceneColorId !== intColorId) {
          continue
        }
      }

      const urlRe = /url=\"([^\"]*\/vr\/pano_[^\"]+)\"/gi
      let um: RegExpExecArray | null
      while ((um = urlRe.exec(block))) {
        let tpl = um[1]
        tpl = tpl.replace(/%\$tileserver%/gi, tileserver)
        if (tpl.startsWith('//')) tpl = `https:${tpl}`

        const sCount = (tpl.match(/%s/g) || []).length
        if (sCount === 1) {
          for (const f of faces) {
            results.push({ scene: sceneName, url: tpl.replace('%s', f) })
          }
        } else if (sCount === 2) {
          for (const f of faces) {
            const once = tpl.replace('%s', sceneName)
            results.push({ scene: sceneName, url: once.replace('%s', f) })
          }
        }
      }
    }

    const seen = new Set<string>()
    const out: Array<{ scene: string; url: string }> = []
    for (const r of results) {
      if (seen.has(r.url)) continue
      seen.add(r.url)
      out.push(r)
    }
    return out
  }

  private async fetchTextRetry(
    url: string,
    opts: { encoding?: string; headers?: Record<string, string>; timeoutMs?: number },
    attempts = 3,
  ): Promise<string> {
    let lastErr: unknown = null
    for (let i = 1; i <= attempts; i++) {
      try {
        const { text } = await fetchText(url, opts)
        return text
      } catch (e) {
        lastErr = e
        if (i < attempts) {
          await sleep(250 * i)
          continue
        }
      }
    }
    throw lastErr
  }

  private async downloadMany(
    job: Job,
    items: Array<{ url: string; outPath: string }>,
  ): Promise<void> {
    const limit = createLimiter(envInt('DOWNLOAD_CONCURRENCY', 16))

    await Promise.all(
      items.map((item) =>
        limit(async () => {
          let lastErr: unknown = null
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              const { data, contentType } = await fetchBinary(item.url, {
                timeoutMs: envInt('DOWNLOAD_TIMEOUT_MS', 60000),
              })
              if (!isImageResponse(contentType, data)) {
                throw new Error('Not an image response')
              }
              await writeFileAtomic(item.outPath, data)
              const cur = this.get(job.id)
              if (cur) {
                this.bumpProgress(cur, {
                  done: cur.progress.done + 1,
                  success: cur.progress.success + 1,
                })
              }
              return
            } catch (e) {
              lastErr = e
              if (attempt < 3) {
                await sleep(300 * attempt)
                continue
              }
            }
          }

          const cur = this.get(job.id)
          if (cur) {
            this.pushError(cur, 'download', `${item.url} ${String(lastErr)}`)
            this.bumpProgress(cur, {
              done: cur.progress.done + 1,
              failed: cur.progress.failed + 1,
            })
          }
        }),
      ),
    )
  }

  private async run(job: Job): Promise<void> {
    this.log(job.id, 'INFO', `job start seriesId=${job.seriesId} splitBySpec=${Boolean(job.splitBySpec)} outputDir=${job.outputDir || ''}`)
    this.update(job, { status: 'running', startedAt: now(), stage: 'resolve_series' })

    const internalBase = path.join(this.baseDir, 'jobs', job.id, 'work')
    let outBase = job.outputDir ? normalizeOutputDir(job.outputDir) : null
    if (job.outputDir && !outBase) {
      const cur = this.get(job.id)
      if (cur) this.pushError(cur, 'init', `outputDir 非法或不可用：${job.outputDir}`)
    }
    if (outBase) {
      try {
        await ensureWritableDir(outBase)
      } catch (e) {
        const cur = this.get(job.id)
        if (cur) this.pushError(cur, 'init', `outputDir 无权限或不可写：${job.outputDir} (${String(e)})`)
        outBase = null
      }
    }

    let seriesName = ''
    try {
      seriesName = await this.resolveSeriesName(job.seriesId)
      const cur = this.get(job.id)
      if (cur) this.update(cur, { seriesName })
    } catch (e) {
      const cur = this.get(job.id)
      if (cur) this.pushError(cur, 'resolve_series', String(e))
    }

    this.log(job.id, 'INFO', `seriesName=${seriesName || ''}`)

    const initialRoot = safeFileName(seriesName || `车系_${job.seriesId}`)
    let workDir = outBase
      ? path.join(outBase, initialRoot)
      : path.join(internalBase, initialRoot)
    await ensureDir(workDir)

    await this.initJobLog(job.id, workDir).catch(() => undefined)

    const started = this.get(job.id)
    if (started) {
      this.update(started, {
        workRoot: initialRoot,
        outputDirEffective: outBase ? outBase : internalBase,
      })
    }

    const cur1 = this.get(job.id)
    if (!cur1) return
    this.setStage(cur1, 'collect_links')

    const splitBySpec = Boolean(job.splitBySpec)

    const links = splitBySpec
      ? null
      : await this.collectCategoryLinks(job.seriesId).catch((e) => {
          const cur = this.get(job.id)
          if (cur) this.pushError(cur, 'collect_links', String(e))
          return {
            exterior: [] as string[],
            interior: [] as string[],
            detail: [] as string[],
            official: [] as string[],
          } as Record<CategoryKey, string[]>
        })

    const imglistMeta = await this.collectImglistSpecsAndTypes(job.seriesId).catch((e) => {
      const cur = this.get(job.id)
      if (cur) this.pushError(cur, 'collect_links', String(e))
      return { specs: [] as ImglistSpecItem[], types: [] as ImglistTypeItem[] }
    })

    const specMax = Number(process.env.SPEC_MAX) || 0
    const imglistSpecs = imglistMeta
      ? (specMax > 0 ? imglistMeta.specs.slice(0, specMax) : imglistMeta.specs)
      : []

    const cur2 = this.get(job.id)
    if (!cur2) return
    this.setStage(cur2, 'collect_images')

    const maxByKey: Record<CategoryKey, number> = {
      exterior: envInt('IMG_MAX_EXTERIOR', 60),
      interior: envInt('IMG_MAX_INTERIOR', 60),
      detail: envInt('IMG_MAX_DETAIL', 60),
      official: envInt('IMG_MAX_OFFICIAL', 60),
    }

    const limits = {
      maxPages: envInt('IMG_MAX_PAGES', 20),
      maxImages: envInt('IMG_MAX_IMAGES', 300),
    }
    const imageItems: Array<{ url: string; outPath: string }> = []
    const vrItems: Array<{ url: string; outPath: string }> = []
    const plannedCounts: Record<string, number> = {
      exterior: 0,
      interior: 0,
      detail: 0,
      official: 0,
      vr_exterior: 0,
      vr_interior: 0,
      vr_interior_missing_colors: 0,
    }


    const pushImageItems = async (
      baseDir: string,
      grouped: Record<CategoryKey, string[]>,
      caps: Record<CategoryKey, number>,
      specLabel?: string,
    ) => {
      for (const key of Object.keys(grouped) as CategoryKey[]) {
        const cap = Math.max(0, Number(caps[key]) || 0)
        if (cap <= 0) continue
        const urls = grouped[key] || []
        if (!urls.length) {
          const cur = this.get(job.id)
          if (cur) this.pushError(cur, 'collect_images', `缺少图片：${specLabel || ''} ${CATEGORY_DIR[key]}`.trim())
          continue
        }
        const dir = path.join(baseDir, CATEGORY_DIR[key])
        await ensureDir(dir)
        plannedCounts[key] += urls.length
        for (let i = 0; i < urls.length; i++) {
          const u = urls[i]
          const ext = (u.match(/\.(jpg|jpeg|png)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase()
          const name = String(i + 1).padStart(4, '0')
          imageItems.push({
            url: u,
            outPath: path.join(dir, `${name}.${ext === 'jpeg' ? 'jpg' : ext}`),
          })
        }
      }
    }

    if (!splitBySpec && links) {
      // splitBySpec = false: use category links to collect images
      this.log(job.id, 'INFO', `splitBySpec=false, links: exterior=${links.exterior.length} interior=${links.interior.length} detail=${links.detail.length} official=${links.official.length}`)
      const catDirs: Record<CategoryKey, string> = {
        exterior: CATEGORY_DIR.exterior,
        interior: CATEGORY_DIR.interior,
        detail: CATEGORY_DIR.detail,
        official: CATEGORY_DIR.official,
      }
      for (const k of Object.keys(catDirs) as CategoryKey[]) {
        await ensureDir(path.join(workDir, catDirs[k]))
      }

      const catLimits = { maxPages: 3, maxImages: 20 }

      for (const k of Object.keys(links) as CategoryKey[]) {
        const pageUrls = links[k] || []
        this.log(job.id, 'INFO', `category ${k} has ${pageUrls.length} pageUrls: ${pageUrls.slice(0, 2).join(', ')}`)
        if (!pageUrls.length) {
          const cur = this.get(job.id)
          if (cur) this.pushError(cur, 'collect_images', `缺少图片：${CATEGORY_DIR[k]}`)
          continue
        }
        let allUrls: string[] = []
        for (const pageUrl of pageUrls.slice(0, catLimits.maxPages)) {
          const urls = await this.collectImageUrlsFromImgDetail(pageUrl).catch(() => [])
          this.log(job.id, 'INFO', `  page ${pageUrl} -> ${urls.length} urls`)
          allUrls = allUrls.concat(urls)
          if (allUrls.length >= catLimits.maxImages) break
          // Small delay between requests to avoid triggering anti-scraping
          await sleep(200)
        }
        if (allUrls.length === 0) {
          const cur = this.get(job.id)
          if (cur) this.pushError(cur, 'collect_images', `缺少图片：${CATEGORY_DIR[k]}`)
          continue
        }
        const uniqueUrls = unique(allUrls).slice(0, catLimits.maxImages)
        this.log(job.id, 'INFO', `category ${k} collected ${uniqueUrls.length} urls from ${pageUrls.length} pages`)
        const grouped = { [k]: uniqueUrls } as Record<CategoryKey, string[]>
        await pushImageItems(workDir, grouped, maxByKey)
      }

      await ensureDir(path.join(workDir, VR_DIR.exterior))
      await ensureDir(path.join(workDir, VR_DIR.interior))

      // VR collection for splitBySpec=false
      this.log(job.id, 'INFO', 'collecting VR for splitBySpec=false')
      let seriesVrInfo: ImglistVrInfoItem[] = []
      if (this.seriesVrInfoCache.has(job.seriesId)) {
        seriesVrInfo = this.seriesVrInfoCache.get(job.seriesId) || []
      } else {
        try {
          const ppSeries = await this.fetchImglistPageProps(job.seriesId, null)
          if (ppSeries) {
            seriesVrInfo = (ppSeries?.SeriesPicList?.vrinfo || []) as ImglistVrInfoItem[]
            this.seriesVrInfoCache.set(job.seriesId, seriesVrInfo)
          }
        } catch {}
      }

      this.log(job.id, 'INFO', `splitBySpec=false vrinfo count: ${seriesVrInfo.length}`)
      for (const vr of seriesVrInfo) {
        this.log(job.id, 'INFO', `  vr type=${vr.type} sepcid=${vr.sepcid} vrurl=${vr.vrurl}`)
      }
      const exteriorVrSpecIds = new Set<number>()
      const interiorPanoIds = new Set<number>()

      // Collect ALL exterior and interior VR spec IDs from seriesVrInfo
      for (const vr of seriesVrInfo) {
        const vrType = Number(vr.type)
        if (vrType === 1 && vr.vrurl) {
          const m = String(vr.vrurl).replace(/\?.*/, '').match(/\/car\/ext\/(\d+)/i)
          if (m?.[1]) exteriorVrSpecIds.add(Number(m[1]))
        }
        if (vrType === 2 && vr.vrurl) {
          const m = String(vr.vrurl).replace(/\?.*/, '').match(/\/car\/pano\/(\d+)/i)
          if (m?.[1]) interiorPanoIds.add(Number(m[1]))
        }
      }

      // Also get series-level fallback IDs if no spec-specific ones found
      if (exteriorVrSpecIds.size === 0) {
        const extEntry = seriesVrInfo.find((v) => Number(v.type) === 1)
        if (extEntry?.vrurl) {
          const m = String(extEntry.vrurl).replace(/\?.*/, '').match(/\/car\/ext\/(\d+)/i)
          if (m?.[1]) exteriorVrSpecIds.add(Number(m[1]))
        }
      }
      if (interiorPanoIds.size === 0) {
        const panoEntry = seriesVrInfo.find((v) => Number(v.type) === 2)
        if (panoEntry?.vrurl) {
          const m = String(panoEntry.vrurl).replace(/\?.*/, '').match(/\/car\/pano\/(\d+)/i)
          if (m?.[1]) interiorPanoIds.add(Number(m[1]))
        }
      }

      // Exterior VR - collect for ALL spec IDs
      this.log(job.id, 'INFO', `exteriorVrSpecIds count=${exteriorVrSpecIds.size} values=[${[...exteriorVrSpecIds].join(',')}]`)
      for (const extSpecId of exteriorVrSpecIds) {
        this.log(job.id, 'INFO', `  resolving extSpecId=${extSpecId}`)
        const extId = await this.resolveExtIdFromSpecId(extSpecId).catch(() => null)
        this.log(job.id, 'INFO', `  resolved extId=${extId}`)
        if (extId) {
          const baseInfo = await this.fetchExtBaseInfo(extId).catch((e) => {
            this.log(job.id, 'WARN', `collect_vr baseinfo ${extId}: ${String(e).slice(0, 60)}`)
            return null
          })
          if (baseInfo) {
            const outDir = path.join(workDir, VR_DIR.exterior)
            const items = this.buildExteriorVrItems(baseInfo, outDir)
            plannedCounts.vr_exterior += items.length
            vrItems.push(...items)
            this.log(job.id, 'INFO', `vr_exterior items=${items.length} extId=${extId} colors=${(baseInfo.color_info || []).length}`)
          }
        }
        // Small delay between VR requests
        await sleep(100)
      }

      // Interior VR - collect for ALL pano IDs
      for (const panoId of interiorPanoIds) {
        const pp = await this.fetchImglistPageProps(job.seriesId, null)
        const colors = pp ? this.extractInteriorColorsFromImglistPageProps(pp) : []
        if (colors.length === 0) {
          this.log(job.id, 'WARN', `collect_vr interior: no colors found for series ${job.seriesId}, using default`)
        }
        for (const c of colors.length > 0 ? colors : [{ id: -1, name: '默认', value: '#UNKNOWN' }]) {
          const colorFolder = safeFileName(`${c.name}_${toHexCombo(c.value)}`)
          const xmlUrl = this.buildInteriorXmlUrl(panoId, c.id)
          let xmlText = ''
          try {
            xmlText = await this.fetchTextRetry(xmlUrl, { encoding: 'utf-8', timeoutMs: 20000 }, 3)
          } catch (e) {
            this.log(job.id, 'WARN', `collect_vr interior: ${c.name} fetch failed: ${String(e).slice(0, 60)}`)
            plannedCounts.vr_interior_missing_colors += 1
            continue
          }
          if (!xmlText) {
            this.log(job.id, 'WARN', `collect_vr interior: ${c.name} empty xml`)
            plannedCounts.vr_interior_missing_colors += 1
            continue
          }
          const cubeFaces = this.extractInteriorCubeFaceUrlsFromXml(xmlText, c.id)
          if (cubeFaces.length === 0) {
            this.log(job.id, 'WARN', `collect_vr interior: ${c.name} no cube faces`)
            plannedCounts.vr_interior_missing_colors += 1
            continue
          }
          const byScene = new Map<string, string[]>()
          for (const it of cubeFaces) {
            const arr = byScene.get(it.scene) || []
            arr.push(it.url)
            byScene.set(it.scene, arr)
          }
          for (const [scene, urls] of byScene.entries()) {
            const folder = path.join(workDir, VR_DIR.interior, colorFolder, safeFileName(scene))
            const sorted = unique(urls).sort()
            await ensureDir(folder)
            plannedCounts.vr_interior += sorted.length
            for (let i = 0; i < sorted.length; i++) {
              const u = sorted[i]
              const ext = (u.match(/\.(jpg|jpeg|png)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase()
              const name = String(i + 1).padStart(4, '0')
              vrItems.push({ url: u, outPath: path.join(folder, `${name}.${ext === 'jpeg' ? 'jpg' : ext}`) })
            }
          }
        }
      }
    }

    // Fallback to non-splitBySpec if imglistSpecs is empty
    if (splitBySpec && imglistSpecs.length === 0) {
      this.log(job.id, 'INFO', `splitBySpec=true but no specs found, falling back to splitBySpec=false`)
      splitBySpec = false
    }

    if (splitBySpec && imglistMeta) {
      for (const spec of imglistSpecs) {
        const specFolder = safeFileName(`${spec.year || ''}款_${spec.name}`)
        await ensureDir(path.join(workDir, specFolder))
        for (const k of Object.keys(CATEGORY_DIR) as CategoryKey[]) {
          await ensureDir(path.join(workDir, specFolder, CATEGORY_DIR[k]))
        }

        const perSpecCaps: Record<CategoryKey, number> = {
          exterior: maxByKey.exterior,
          interior: maxByKey.interior,
          detail: maxByKey.detail,
          official: maxByKey.official,
        }

        const grouped = await this.collectLimitedImagesFromImglistPicInfo(job.seriesId, spec.specId, perSpecCaps).catch((e) => {
          const cur = this.get(job.id)
          if (cur) this.pushError(cur, 'collect_images', `${spec.specId} ${String(e)}`)
          return { exterior: [], interior: [], detail: [], official: [] } as Record<CategoryKey, string[]>
        })

        this.log(job.id, 'INFO', `images ${spec.specId} ${spec.name} exterior=${grouped.exterior.length} interior=${grouped.interior.length} detail=${grouped.detail.length} official=${grouped.official.length}`)
        await pushImageItems(path.join(workDir, specFolder), grouped, perSpecCaps, spec.name)
      }

      await ensureDir(path.join(workDir, VR_DIR.exterior))
      await ensureDir(path.join(workDir, VR_DIR.interior))

      let seriesVrInfo: ImglistVrInfoItem[] = []
      if (this.seriesVrInfoCache.has(job.seriesId)) {
        seriesVrInfo = this.seriesVrInfoCache.get(job.seriesId) || []
      } else {
        try {
          const ppSeries = await this.fetchImglistPageProps(job.seriesId, null)
          if (ppSeries) {
            seriesVrInfo = (ppSeries?.SeriesPicList?.vrinfo || []) as ImglistVrInfoItem[]
            this.seriesVrInfoCache.set(job.seriesId, seriesVrInfo)
          }
        } catch {
        }
      }

      const firstSpec = imglistSpecs[0]
      let seriesExteriorVrSpecId: number | null = null
      let seriesInteriorPanoId: number | null = null
      if (seriesVrInfo.length) {
        const extEntry = seriesVrInfo.find((v) => Number(v.type) === 1)
        if (extEntry) {
          const m = String(extEntry.vrurl || '').replace(/\?.*/, '').match(/\/car\/ext\/(\d+)/i)
          if (m?.[1]) seriesExteriorVrSpecId = Number(m[1])
        }
        const panoEntry = seriesVrInfo.find((v) => Number(v.type) === 2)
        if (panoEntry) {
          const m = String(panoEntry.vrurl || '').replace(/\?.*/, '').match(/\/car\/pano\/(\d+)/i)
          if (m?.[1]) seriesInteriorPanoId = Number(m[1])
        }
      }

      let exteriorVrSpecId: number | null = null
      if (firstSpec) {
        const matchExt = seriesVrInfo.find((v) => Number(v.sepcid) === firstSpec.specId && Number(v.type) === 1)
        if (matchExt) {
          const m = String(matchExt.vrurl || '').replace(/\?.*/, '').match(/\/car\/ext\/(\d+)/i)
          if (m?.[1]) exteriorVrSpecId = Number(m[1])
        }
      }

      if (exteriorVrSpecId) {
        const extId = await this.resolveExtIdFromSpecId(exteriorVrSpecId).catch(() => null)
        if (extId) {
          const baseInfo = await this.fetchExtBaseInfo(extId).catch((e) => {
            this.log(job.id, 'WARN', `collect_vr baseinfo ${extId}: ${String(e).slice(0, 60)}`)
            return null
          })
          if (baseInfo) {
            const colorCount = (baseInfo.color_info || []).length
            this.log(job.id, 'INFO', `vr baseInfo colors=${colorCount} extId=${extId} spec=${firstSpec?.specId}`)
            const outDir = path.join(workDir, VR_DIR.exterior)
            const items = this.buildExteriorVrItems(baseInfo, outDir)
            plannedCounts.vr_exterior += items.length
            vrItems.push(...items)
            this.log(job.id, 'INFO', `vr_exterior items=${items.length} extId=${extId}`)
          }
        }
      } else if (seriesExteriorVrSpecId) {
        const extId = await this.resolveExtIdFromSpecId(seriesExteriorVrSpecId).catch(() => null)
        if (extId) {
          const baseInfo = await this.fetchExtBaseInfo(extId).catch((e) => {
            this.log(job.id, 'WARN', `collect_vr baseinfo ${extId}: ${String(e).slice(0, 60)}`)
            return null
          })
          if (baseInfo) {
            const colorCount = (baseInfo.color_info || []).length
            this.log(job.id, 'INFO', `vr baseInfo colors=${colorCount} extId=${extId}`)
            const outDir = path.join(workDir, VR_DIR.exterior)
            const items = this.buildExteriorVrItems(baseInfo, outDir)
            plannedCounts.vr_exterior += items.length
            vrItems.push(...items)
            this.log(job.id, 'INFO', `vr_exterior items=${items.length} extId=${extId}`)
          }
        }
      }

      let panoId: number | null = null
      if (firstSpec) {
        const matchPano = seriesVrInfo.find((v) => Number(v.sepcid) === firstSpec.specId && Number(v.type) === 2)
        if (matchPano) {
          const m = String(matchPano.vrurl || '').replace(/\?.*/, '').match(/\/car\/pano\/(\d+)/i)
          if (m?.[1]) panoId = Number(m[1])
        }
      }

      if (!panoId && seriesInteriorPanoId) {
        panoId = seriesInteriorPanoId
      }

      if (!panoId && firstSpec) {
        const xmlUrl = await this.resolveInteriorPanoXmlUrl(firstSpec.specId).catch(() => null)
        if (xmlUrl) {
          const m = xmlUrl.match(/\/car\/pano\/(\d+)/i)
          const id = Number(m?.[1])
          if (Number.isFinite(id) && id > 0) panoId = id
        }
      }

      if (!panoId) {
        this.log(job.id, 'WARN', `collect_vr interior: no panoId found, using firstSpec=${firstSpec?.specId}`)
      }

      let allInteriorColors: Array<{ id: number; name: string; value: string }> = []
      for (const spec of imglistSpecs) {
        try {
          const pp = await this.fetchImglistPageProps(job.seriesId, spec.specId)
          if (pp) {
            const colors = this.extractInteriorColorsFromImglistPageProps(pp).map((c) => ({
              id: c.id,
              name: c.name,
              value: c.value,
            }))
            for (const c of colors) {
              if (!allInteriorColors.some((ac) => ac.id === c.id)) {
                allInteriorColors.push(c)
              }
            }
          }
        } catch {
        }
      }

      if (allInteriorColors.length === 0) {
        this.log(job.id, 'WARN', `collect_vr interior: no colors found for series ${job.seriesId}`)
        allInteriorColors = [{ id: -1, name: '默认', value: '#UNKNOWN' }]
      }

      if (panoId) {
        this.log(job.id, 'INFO', `collect_vr interior panoId=${panoId} colors=${allInteriorColors.length}`)
        for (const c of allInteriorColors) {
          const colorFolder = safeFileName(`${c.name}_${toHexCombo(c.value)}`)
          const xmlUrl = this.buildInteriorXmlUrl(panoId, c.id)
          let xmlText = ''
          try {
            xmlText = await this.fetchTextRetry(xmlUrl, { encoding: 'utf-8', timeoutMs: 20000 }, 3)
          } catch (e) {
            const cur = this.get(job.id)
            if (cur) this.pushError(cur, 'collect_vr', `内饰VR缺少配色：${c.name} (${String(e)})`)
            plannedCounts.vr_interior_missing_colors += 1
            continue
          }
          if (!xmlText) {
            const cur = this.get(job.id)
            if (cur) this.pushError(cur, 'collect_vr', `内饰VR缺少配色：${c.name}`)
            plannedCounts.vr_interior_missing_colors += 1
            continue
          }

          const cubeFaces = this.extractInteriorCubeFaceUrlsFromXml(xmlText, c.id)
          if (cubeFaces.length === 0) {
            const cur = this.get(job.id)
            if (cur) this.pushError(cur, 'collect_vr', `内饰VR空内容：${c.name}`)
            plannedCounts.vr_interior_missing_colors += 1
            continue
          }
          const byScene = new Map<string, string[]>()
          for (const it of cubeFaces) {
            const arr = byScene.get(it.scene) || []
            arr.push(it.url)
            byScene.set(it.scene, arr)
          }

          for (const [scene, urls] of byScene.entries()) {
            const folder = path.join(workDir, VR_DIR.interior, colorFolder, safeFileName(scene))
            const sorted = unique(urls).sort()
            await ensureDir(folder)
            plannedCounts.vr_interior += sorted.length
            for (let i = 0; i < sorted.length; i++) {
              const u = sorted[i]
              const ext = (u.match(/\.(jpg|jpeg|png)(?:\?|$)/i)?.[1] || 'jpg').toLowerCase()
              const name = String(i + 1).padStart(4, '0')
              vrItems.push({
                url: u,
                outPath: path.join(folder, `${name}.${ext === 'jpeg' ? 'jpg' : ext}`),
              })
            }
          }
        }
      } else {
        this.log(job.id, 'WARN', `collect_vr interior: skipped, no panoId found`)
      }
    }

    const cur4 = this.get(job.id)
    if (!cur4) return
    this.setStage(cur4, 'download_images')
    this.update(cur4, {
      progress: {
        total: imageItems.length + vrItems.length,
        done: 0,
        success: 0,
        failed: 0,
      },
    })

    await this.downloadMany(cur4, imageItems)

    const cur5 = this.get(job.id)
    if (!cur5) return
    this.setStage(cur5, 'download_vr')
    await this.downloadMany(cur5, vrItems)

    const done = this.get(job.id)
    if (done) {
      const missing: string[] = []
      if (plannedCounts.exterior === 0) missing.push('外观图')
      if (plannedCounts.interior === 0) missing.push('内饰图')
      if (plannedCounts.detail === 0) missing.push('细节图')
      if (plannedCounts.official === 0) missing.push('官图')
      if (plannedCounts.vr_exterior === 0 && plannedCounts.vr_interior === 0) missing.push('360VR(外观+内饰)')
      if (missing.length) {
        this.pushError(done, 'validate', `以下类型缺失或不完整：${missing.join('、')}`)
      }
      this.update(done, {
        stage: 'done',
        status: missing.length ? 'failed' : 'succeeded',
        finishedAt: now(),
      })
      this.log(job.id, 'INFO', `job done status=${missing.length ? 'failed' : 'succeeded'} total=${done.progress.total} success=${done.progress.success} failed=${done.progress.failed}`)
    }
    return
  }
}
