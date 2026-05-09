import fetch from 'node-fetch'

async function test() {
  // Test various VR detail/collection endpoints
  const specId = 74009
  const tests = [
    `https://car.autohome.com.cn/vr/detail-${specId}-1.html`,
    `https://car.autohome.com.cn/vr/detail-${specId}.html`,
    `https://pano.autohome.com.cn/car/ext/${specId}`,
    `https://pano.autohome.com.cn/car/vr/${specId}`,
  ]
  
  for (const url of tests) {
    try {
      const res = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.autohome.com.cn/',
        }
      })
      const text = await res.text()
      console.log(`${url}`)
      console.log(`  status=${res.status} size=${text.length}`)
      
      // Look for baseinfo or image data
      const baseinfoMatch = text.match(/baseinfo[^"']*/i) || text.match(/visitext[^"']*/i)
      const colorMatch = text.match(/color_info[^"']*/i) || text.match(/"ColorName"[^"']*/i)
      const imageRootMatch = text.match(/image_root[^"']*/i)
      console.log(`  baseinfo: ${baseinfoMatch?.[0] || 'none'}`)
      console.log(`  color_info: ${colorMatch?.[0] || 'none'}`)
      console.log(`  image_root: ${imageRootMatch?.[0] || 'none'}`)
      
      // Check for redirect
      if (text.includes('location.href') || text.includes('window.location')) {
        const locMatch = text.match(/location[.\s]*href\s*=\s*["']([^"']+)["']/i)
        console.log(`  REDIRECT to: ${locMatch?.[1] || 'unknown'}`)
      }
      console.log()
    } catch (e) {
      console.log(`${url}: ERROR - ${e.message}\n`)
    }
  }
  
  // Try the actual autohome VR collection page for the series
  console.log('=== Checking if we can get VR from the spec page directly ===')
  const specPageUrl = `https://www.autohome.com.cn/cars/imglist-x-x-110-${specId}-x-x-x-x-x-1.html`
  try {
    const res = await fetch(specPageUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    const text = await res.text()
    
    const match = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
    if (match) {
      const data = JSON.parse(match[1])
      const spl = data?.props?.pageProps?.SeriesPicList
      if (spl?.vrinfo) {
        console.log('Spec page vrinfo:')
        for (const v of spl.vrinfo) {
          console.log(`  type=${v.type} specId=${v.sepcid} url=${v.vrurl}`)
        }
      } else {
        console.log('No vrinfo in spec page')
        console.log('SeriesPicList keys:', Object.keys(spl || {}))
      }
    }
  } catch (e) {
    console.log('Spec page error:', e.message)
  }
  
  // Check the vrcover image URL to see if it contains useful data
  console.log('\n=== Checking if vrcover URL pattern reveals the data source ===')
  const vrcover = 'https://img3.autoimg.cn/pano/g33/M01/7A/6F/ChxpVmiJ4x-AGIbDAAMoInOIAD8655.png'
  // The path g33/M01/7A/6F/ChxpVmiJ4x-AGIbDAAMoInOIAD8655.png might contain encoded info
  // Let's check the g33 part - this is the host folder, not the spec ID
}

test().catch(console.error)
