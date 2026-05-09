import iconv from 'iconv-lite'

export type FetchTextResult = {
  url: string
  finalUrl: string
  encoding: string
  text: string
}

function guessEncodingFromLatin1(htmlLatin1: string): string {
  const m = htmlLatin1.match(/charset\s*=\s*([A-Za-z0-9_-]+)/i)
  const enc = (m?.[1] || '').toLowerCase()
  if (!enc) return 'utf-8'
  if (enc.includes('gb')) return 'gb18030'
  return enc
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function jitter(ms: number) {
  const factor = 0.7 + Math.random() * 0.6
  return Math.floor(ms * factor)
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0',
]

let uaIndex = 0
function getNextUserAgent(): string {
  uaIndex = (uaIndex + 1) % USER_AGENTS.length
  return USER_AGENTS[uaIndex]
}

function isRetryableStatus(status: number): boolean {
  return status === 403 || status === 408 || status === 425 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

function parseRetryAfterMs(v: string | null): number {
  const raw = (v || '').trim()
  if (!raw) return 0
  const sec = Number(raw)
  if (Number.isFinite(sec) && sec > 0) return Math.floor(sec * 1000)
  const dt = Date.parse(raw)
  if (Number.isFinite(dt)) {
    const d = dt - Date.now()
    return d > 0 ? Math.min(d, 60000) : 0
  }
  return 0
}

function isBlockedResponse(text: string, finalUrl: string): boolean {
  if (!text || text.length < 100) return true
  const lower = text.toLowerCase()
  const blockIndicators = [
    '验证码',
    'captcha',
    'security check',
    '请输入验证码',
    '访问过于频繁',
    '请稍后再试',
    '系统繁忙',
  ]
  for (const indicator of blockIndicators) {
    if (lower.includes(indicator.toLowerCase())) return true
  }
  if (finalUrl && (finalUrl.includes('/404') || finalUrl.includes('blocked'))) return true
  return false
}

function defaultHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'user-agent': getNextUserAgent(),
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'connection': 'keep-alive',
    'upgrade-insecure-requests': '1',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'cache-control': 'max-age=0',
    ...(extra || {}),
  }
}

export async function fetchText(
  url: string,
  opts?: { encoding?: string; headers?: Record<string, string>; timeoutMs?: number; retry?: number },
): Promise<FetchTextResult> {
  const retry = Math.max(0, Number(opts?.retry) || 3)
  const headers = defaultHeaders({
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    ...(opts?.headers || {}),
  })

  let lastErr: unknown = null
  for (let attempt = 0; attempt <= retry; attempt++) {
    const controller = new AbortController()
    const timeoutMs = Math.max(0, Number(opts?.timeoutMs) || 30000)
    const timer = timeoutMs
      ? setTimeout(() => {
          controller.abort()
        }, timeoutMs)
      : null

    try {
      const res = await fetch(url, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      })

      const buf = Buffer.from(await res.arrayBuffer())
      const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'))

      let encoding = (opts?.encoding || '').toLowerCase()
      if (!encoding) {
        const latin1 = buf.toString('latin1')
        encoding = guessEncodingFromLatin1(latin1)
      }
      const text = encoding === 'utf-8' ? buf.toString('utf8') : iconv.decode(buf, encoding)

      // Check if blocked
      if (isBlockedResponse(text, res.url)) {
        if (attempt < retry) {
          const delay = retryAfterMs || jitter(1000 * Math.pow(2, attempt + 1))
          await sleep(delay)
          continue
        }
        throw new Error(`HTTP ${res.status} blocked ${res.url}`)
      }

      if (!res.ok) {
        const short = text.slice(0, 180).replace(/\s+/g, ' ').trim()
        const err = new Error(`HTTP ${res.status} ${res.statusText} ${res.url} ${short}`)
        ;(err as any).status = res.status
        ;(err as any).finalUrl = res.url
        if (attempt < retry && isRetryableStatus(res.status)) {
          await sleep(retryAfterMs || jitter(800 * Math.pow(2, attempt)))
          continue
        }
        throw err
      }

      return {
        url,
        finalUrl: res.url,
        encoding,
        text,
      }
    } catch (e) {
      lastErr = e
      if (attempt < retry) {
        await sleep(jitter(800 * Math.pow(2, attempt)))
        continue
      }
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  throw lastErr
}

export async function fetchBinary(
  url: string,
  opts?: { headers?: Record<string, string>; timeoutMs?: number; retry?: number },
): Promise<{ data: Buffer; contentType: string | null; finalUrl: string }>
{
  const retry = Math.max(0, Number(opts?.retry) || 3)
  const headers = defaultHeaders(opts?.headers || {})

  let lastErr: unknown = null
  for (let attempt = 0; attempt <= retry; attempt++) {
    const controller = new AbortController()
    const timeoutMs = Math.max(0, Number(opts?.timeoutMs) || 60000)
    const timer = timeoutMs
      ? setTimeout(() => {
          controller.abort()
        }, timeoutMs)
      : null

    try {
      const res = await fetch(url, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      })

      const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'))
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status} ${res.statusText} ${res.url}`)
        ;(err as any).status = res.status
        ;(err as any).finalUrl = res.url
        if (attempt < retry && isRetryableStatus(res.status)) {
          await sleep(retryAfterMs || jitter(500 * Math.pow(2, attempt)))
          continue
        }
        throw err
      }

      return {
        data: Buffer.from(await res.arrayBuffer()),
        contentType: res.headers.get('content-type'),
        finalUrl: res.url,
      }
    } catch (e) {
      lastErr = e
      if (attempt < retry) {
        await sleep(jitter(500 * Math.pow(2, attempt)))
        continue
      }
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  throw lastErr
}

export async function fetchJson<T>(
  url: string,
  opts?: { headers?: Record<string, string>; timeoutMs?: number; retry?: number },
): Promise<{ data: T; finalUrl: string }>
{
  const retry = Math.max(0, Number(opts?.retry) || 2)
  const headers = defaultHeaders({
    accept: 'application/json,text/plain,*/*',
    ...(opts?.headers || {}),
  })

  let lastErr: unknown = null
  for (let attempt = 0; attempt <= retry; attempt++) {
    const controller = new AbortController()
    const timeoutMs = Math.max(0, Number(opts?.timeoutMs) || 30000)
    const timer = timeoutMs
      ? setTimeout(() => {
          controller.abort()
        }, timeoutMs)
      : null

    try {
      const res = await fetch(url, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      })

      const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'))
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        const short = txt.slice(0, 180).replace(/\s+/g, ' ').trim()
        const err = new Error(`HTTP ${res.status} ${res.statusText} ${res.url} ${short}`)
        ;(err as any).status = res.status
        ;(err as any).finalUrl = res.url
        if (attempt < retry && isRetryableStatus(res.status)) {
          await sleep(retryAfterMs || jitter(400 * Math.pow(2, attempt)))
          continue
        }
        throw err
      }

      const data = (await res.json()) as T
      return { data, finalUrl: res.url }
    } catch (e) {
      lastErr = e
      if (attempt < retry) {
        await sleep(jitter(400 * Math.pow(2, attempt)))
        continue
      }
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  throw lastErr
}
