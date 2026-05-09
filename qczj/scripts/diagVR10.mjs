import fetch from 'node-fetch'

async function test() {
  // Test visitext with more details
  const specId = 74009
  
  console.log('=== visitext API ===')
  const visitextUrl = `https://pano.autohome.com.cn/api/visitext?id=${specId}&src=m&category=car&deviceId=`
  try {
    const res = await fetch(visitextUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `https://pano.autohome.com.cn/car/ext/${specId}`,
      }
    })
    const data = await res.json()
    console.log('visitext response:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('visitext error:', e.message)
  }
  
  // Check if the ext page returns anything with different headers
  console.log('\n=== ext page with browser headers ===')
  const extUrl = `https://pano.autohome.com.cn/car/ext/${specId}`
  try {
    const res = await fetch(extUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.autohome.com.cn/',
      }
    })
    console.log('ext status:', res.status)
    console.log('ext content-type:', res.headers.get('content-type'))
    const text = await res.text()
    console.log('ext size:', text.length)
    
    // Look for baseinfo URL
    const baseinfoMatch = text.match(/baseinfo\/\d+/i) || text.match(/visitext\?id=\d+/i)
    console.log('baseinfo match:', baseinfoMatch)
    
    // Check if it's a redirect
    if (text.includes('location') || text.includes('redirect')) {
      console.log('This is a redirect page!')
    }
    
    console.log('Preview:', text.substring(0, 300))
  } catch (e) {
    console.log('ext error:', e.message)
  }
  
  // Check the VR list page for the specific series
  console.log('\n=== VR list page - extract ext IDs for series 110 ===')
  const vrListUrl = `https://car.autohome.com.cn/vr/list-0-0-110-1.html`
  try {
    const res = await fetch(vrListUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    const text = await res.text()
    
    // Extract all ext URLs
    const extUrls = text.match(/https?:\/\/pano\.autohome\.com\.cn\/car\/ext\/(\d+)/gi) || []
    const uniqueExt = [...new Set(extUrls.map(u => u.replace(/[?#].*/, '')))]
    console.log(`Ext URLs: ${uniqueExt.length}`)
    for (const u of uniqueExt.slice(0, 20)) {
      const id = u.match(/\/car\/ext\/(\d+)/)?.[1]
      console.log(`  ${u} -> specId: ${id}`)
    }
    
    // Also extract all pano URLs
    const panoUrls = text.match(/https?:\/\/pano\.autohome\.com\.cn\/car\/pano\/(\d+)/gi) || []
    const uniquePano = [...new Set(panoUrls.map(u => u.replace(/[?#].*/, '')))]
    console.log(`\nPano URLs: ${uniquePano.length}`)
    for (const u of uniquePano.slice(0, 20)) {
      const id = u.match(/\/car\/pano\/(\d+)/)?.[1]
      console.log(`  ${u} -> panoId: ${id}`)
    }
  } catch (e) {
    console.log('VR list error:', e.message)
  }
}

test().catch(console.error)
