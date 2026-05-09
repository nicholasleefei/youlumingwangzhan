import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function test() {
  const url = `https://www.autohome.com.cn/cars/imglist-x-x-110-x-x-x-x-x-x-1.html`
  
  const res = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'pragma': 'no-cache',
      'cache-control': 'no-cache',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
  })
  
  const buf = Buffer.from(await res.arrayBuffer())
  console.log(`Content-Type: ${res.headers.get('content-type')}`)
  
  const latin1 = buf.toString('latin1')
  const charsetMatch = latin1.match(/charset\s*=\s*([A-Za-z0-9_-]+)/i)
  const detectedEnc = (charsetMatch?.[1] || '').toLowerCase()
  console.log(`Detected charset from latin1: ${detectedEnc}`)
  
  const utf8text = buf.toString('utf8')
  const nextDataMatch = utf8text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
  if (nextDataMatch) {
    console.log(`UTF-8: Found __NEXT_DATA__ (${nextDataMatch[1].length} chars)`)
    try {
      const data = JSON.parse(nextDataMatch[1])
      const spl = data?.props?.pageProps?.SeriesPicList
      console.log(`UTF-8 JSON parse: SUCCESS`)
      console.log(`SeriesPicList keys: ${Object.keys(spl || {})}`)
      console.log(`vrinfo count: ${(spl?.vrinfo || []).length}`)
    } catch (e) {
      console.log(`UTF-8 JSON parse: FAILED - ${e.message}`)
    }
  } else {
    console.log(`UTF-8: NOT FOUND`)
  }
  
  const gbtext = iconv.decode(buf, 'gb18030')
  const gbMatch = gbtext.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
  if (gbMatch) {
    console.log(`GB18030: Found __NEXT_DATA__ (${gbMatch[1].length} chars)`)
    try {
      const data = JSON.parse(gbMatch[1])
      console.log(`GB18030 JSON parse: SUCCESS`)
    } catch (e) {
      console.log(`GB18030 JSON parse: FAILED - ${e.message}`)
      console.log(`Preview: ${gbMatch[1].substring(0, 100)}`)
    }
  } else {
    console.log(`GB18030: NOT FOUND`)
  }
  
  const winMatch = utf8text.match(/<script>window\.__NEXT_DATA__\s*=\s*([\s\S]*?)<\/script>/i)
  console.log(`window.__NEXT_DATA__: ${winMatch ? 'FOUND' : 'NOT FOUND'}`)
}

test().catch(console.error)
