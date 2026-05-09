import fetch from 'node-fetch'

async function test() {
  // Test if the imglist page HTML contains VR links
  const url = `https://www.autohome.com.cn/cars/imglist-x-x-110-x-x-x-x-x-x-1.html`
  const res = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    }
  })
  
  const text = await res.text()
  
  // Find all VR-related URLs
  const vrUrls = text.match(/https?:\/\/pano\.autohome\.com\.cn[^\s"'<>]+/g) || []
  console.log(`Total VR URLs found: ${vrUrls.length}`)
  console.log(`Unique VR URLs:`)
  const unique = [...new Set(vrUrls)]
  for (const u of unique.slice(0, 20)) {
    console.log(`  ${u}`)
  }
  
  // Check if there's a specific VR data structure in the HTML
  // Look for JSON data that might contain VR info
  const jsonMatches = text.match(/window\.__[A-Z_]+\s*=\s*(\{[^;]+\})/g) || []
  console.log(`\nGlobal JS vars found: ${jsonMatches.length}`)
  
  // Look for VR-related data attributes or embedded JSON
  const vrDataMatches = text.match(/vrinfo[^"]*"([^"]+)"/gi) || []
  console.log(`\nvrinfo in HTML: ${vrDataMatches.length}`)
  
  // Check for SPEC_CAR or similar data
  const specCarMatches = text.match(/SPEC_CAR|CarSpec|VrInfo|seriesPicList/i)
  if (specCarMatches) {
    console.log(`Found VR-related keywords: ${specCarMatches.join(', ')}`)
  }
  
  // Try to find the section with VR links
  const vrSectionStart = text.indexOf('pano.autohome.com.cn')
  if (vrSectionStart >= 0) {
    const snippet = text.substring(Math.max(0, vrSectionStart - 500), vrSectionStart + 500)
    console.log(`\nHTML snippet around first VR URL:`)
    console.log(snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  }
  
  // Also check: does the imglist page work with our current fetchText?
  console.log(`\n=== Testing fetchText equivalent ===`)
  const res2 = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  })
  const chunks = []
  for await (const chunk of res2.body) {
    chunks.push(chunk)
  }
  const buf = Buffer.concat(chunks)
  const encoding = res2.headers.get('content-type')?.includes('charset=gb') ? 'gb18030' : 'utf-8'
  const decoded = new TextDecoder(encoding).decode(buf)
  console.log(`Decoded length: ${decoded.length}`)
  console.log(`First 300 chars: ${decoded.substring(0, 300)}`)
  
  // Check for __NEXT_DATA__
  const nextDataMatch = decoded.match(/<script>window\.__NEXT_DATA__\s*=\s*(\{.*?\})\s*<\/script>/s)
  console.log(`__NEXT_DATA__ found: ${!!nextDataMatch}`)
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1])
      console.log(`pageProps keys: ${Object.keys(data?.props?.pageProps || {}).join(', ')}`)
      const vrinfo = data?.props?.pageProps?.SeriesPicList?.vrinfo
      console.log(`vrinfo from props: ${JSON.stringify(vrinfo, null, 2)}`)
    } catch (e) {
      console.log(`Parse error: ${e.message}`)
    }
  }
}

test().catch(console.error)
