import fetch from 'node-fetch'

const SPEC_ID = 74001

async function test() {
  const url = `https://pano.autohome.com.cn/car/ext/${SPEC_ID}`
  console.log(`URL: ${url}`)
  
  const res = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    }
  })
  
  console.log(`Status: ${res.status}`)
  console.log(`Content-Type: ${res.headers.get('content-type')}`)
  console.log(`Location: ${res.headers.get('location') || 'none'}`)
  
  const text = await res.text()
  console.log(`Body length: ${text.length}`)
  console.log(`Body preview: ${text.substring(0, 500)}`)
  
  // Check if it's a redirect page
  if (text.includes('autoimg') || text.includes('redirect') || text.includes('blocked')) {
    console.log('\n  -> This is an anti-bot/redirect page!')
  }
  
  // Try alternative: check the imglist page props for vrinfo
  console.log('\n=== Checking imglist page props for VR ===')
  const imglistUrl = `https://www.autohome.com.cn/cars/imglist-x-x-110-x-x-x-x-x-x-1.html`
  const res2 = await fetch(imglistUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Cookie': '',
    }
  })
  console.log(`imglist Status: ${res2.status}`)
  
  const text2 = await res2.text()
  const nextMatch = text2.match(/<script>window\.__NEXT_DATA__\s*=\s*({.*?})\s*<\/script>/s)
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1])
      const pp = data?.props?.pageProps
      const vrinfo = pp?.SeriesPicList?.vrinfo
      console.log(`vrinfo found: ${JSON.stringify(vrinfo, null, 2)}`)
    } catch (e) {
      console.log(`JSON parse error: ${e.message}`)
    }
  } else {
    console.log('No __NEXT_DATA__ found in imglist page')
    // Try to find vrurl in the HTML
    const vrurls = text2.match(/https?:\/\/pano\.autohome\.com\.cn[^\s"']+/g)
    if (vrurls) {
      console.log(`Found pano URLs: ${vrurls.slice(0, 5).join('\n')}`)
    }
  }
}

test().catch(console.error)
