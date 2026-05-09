import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseNextDataFromHtml(html) {
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

async function test() {
  // Check the job log for actual requests
  const logPath = path.join(__dirname, '..', 'downloads', '车系_110', '_logs', 'job.log')
  try {
    const log = readFileSync(logPath, 'utf8')
    console.log('Job log exists, checking for VR-related entries:')
    const lines = log.split('\n').filter(l => l.includes('vr') || l.includes('VR') || l.includes('ext') || l.includes('pano'))
    for (const l of lines) {
      console.log(l)
    }
  } catch (e) {
    console.log(`No job log found at ${logPath}`)
  }
  
  // Test parseNextDataFromHtml with actual HTML
  console.log('\n=== Testing with mock HTML ===')
  const mockHtml = `<!DOCTYPE html><html><head></head><body>
<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"SeriesPicList":{"vrinfo":[{"type":1,"sepcid":74009,"vrurl":"https://pano.autohome.com.cn/car/ext/74009"},{"type":2,"sepcid":74002,"vrurl":"https://pano.autohome.com.cn/car/pano/74002"}]}}}}</script>
</body></html>`
  
  const result = parseNextDataFromHtml(mockHtml)
  if (result) {
    const vrinfo = result?.props?.pageProps?.SeriesPicList?.vrinfo
    console.log('Parsed successfully!')
    console.log('vrinfo:', JSON.stringify(vrinfo, null, 2))
  } else {
    console.log('FAILED to parse')
  }
  
  // Check if the actual job manager code has issues
  console.log('\n=== Checking key issues ===')
  
  // Issue 1: ext ID URL returns 404
  console.log('Issue 1: https://pano.autohome.com.cn/car/ext/74009 returns 404')
  console.log('  -> Need to find alternative for exterior VR base info')
  
  // Issue 2: vrinfo in spec pages
  console.log('Issue 2: Spec pages have vrinfo with interior VR (type=2) but not exterior VR (type=1)')
  console.log('  -> For interior VR: use vrinfo from spec page')
  console.log('  -> For exterior VR: need alternative source')
  
  // Let's check if there's an API endpoint that provides exterior VR base info
  console.log('\n=== Checking alternative APIs ===')
}

test().catch(console.error)
