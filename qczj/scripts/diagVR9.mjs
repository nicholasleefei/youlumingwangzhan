import fetch from 'node-fetch'

async function test() {
  const specId = 74009
  
  console.log('=== Testing various API endpoints for exterior VR base info ===\n')
  
  const tests = [
    { name: 'visitext', url: `https://pano.autohome.com.cn/api/visitext?id=${specId}&src=m&category=car` },
    { name: 'ext baseinfo direct', url: `https://pano.autohome.com.cn/api/ext/baseinfo/${specId}?src=m&category=car&deviceId=` },
    { name: 'car/autohome vr', url: `https://car.autohome.com.cn/vr/list-0-0-110-1.html` },
    { name: 'car VR detail page', url: `https://car.autohome.com.cn/vr/detail-${specId}-1.html` },
  ]
  
  for (const t of tests) {
    try {
      const res = await fetch(t.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.autohome.com.cn/',
        }
      })
      const text = await res.text()
      console.log(`${t.name}: status=${res.status} size=${text.length}`)
      console.log(`  Preview: ${text.substring(0, 200)}\n`)
    } catch (e) {
      console.log(`${t.name}: ERROR - ${e.message}\n`)
    }
  }
  
  // Try the series page's vrcover image to see if we can get info from it
  console.log('=== Testing vrcover image URL ===')
  const vrcover = 'https://img3.autoimg.cn/pano/g33/M01/7A/6F/ChxpVmiJ4x-AGIbDAAMoInOIAD8655.png'
  try {
    const res = await fetch(vrcover, { timeout: 10000, method: 'HEAD' })
    console.log(`vrcover status: ${res.status}`)
    console.log(`Content-Type: ${res.headers.get('content-type')}`)
  } catch (e) {
    console.log(`vrcover error: ${e.message}`)
  }
  
  // Check the car.autohome.com.cn VR list page
  console.log('\n=== Checking car.autohome.com.cn VR pages ===')
  const vrListUrl = `https://car.autohome.com.cn/vr/list-0-0-110-1.html`
  try {
    const res = await fetch(vrListUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    const text = await res.text()
    console.log(`VR list status: ${res.status} size=${text.length}`)
    
    // Find VR links
    const vrLinks = text.match(/https?:\/\/pano\.autohome\.com\.cn[^\s"'<>]+/g) || []
    console.log(`VR links found: ${vrLinks.length}`)
    for (const l of [...new Set(vrLinks)].slice(0, 10)) {
      console.log(`  ${l}`)
    }
  } catch (e) {
    console.log(`VR list error: ${e.message}`)
  }
}

test().catch(console.error)
