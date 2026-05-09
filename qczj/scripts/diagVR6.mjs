import fetch from 'node-fetch'

async function test() {
  // Test if individual spec pages have vrinfo
  const specIds = [74001, 74002, 74003]
  
  for (const specId of specIds) {
    const url = `https://www.autohome.com.cn/cars/imglist-x-x-110-${specId}-x-x-x-x-x-1.html`
    console.log(`\n=== SPEC ${specId} ===`)
    
    try {
      const res = await fetch(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        }
      })
      
      const text = await res.text()
      
      const match = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
      if (match) {
        const data = JSON.parse(match[1])
        const spl = data?.props?.pageProps?.SeriesPicList
        if (spl) {
          const vrinfo = spl.vrinfo || []
          console.log(`  vrinfo count: ${vrinfo.length}`)
          for (const v of vrinfo) {
            console.log(`    type=${v.type} sepcid=${v.sepcid} specname=${v.specname} vrurl=${v.vrurl}`)
          }
          
          const picinfo = spl.picinfo
          if (picinfo) {
            if (Array.isArray(picinfo)) {
              console.log(`  picinfo: array of ${picinfo.length}`)
            } else {
              const callist = picinfo.callist || []
              console.log(`  picinfo: object with ${callist.length} categories`)
              for (const c of callist) {
                console.log(`    ${c.name}: total=${c.total}`)
              }
            }
          }
        } else {
          console.log('  No SeriesPicList')
          const pp = data?.props?.pageProps
          console.log(`  pageProps keys: ${Object.keys(pp || {}).join(', ')}`)
        }
      } else {
        console.log('  No __NEXT_DATA__ found')
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`)
    }
  }
  
  // Also test the Series_SpecsCar endpoint for exterior VR
  console.log('\n\n=== Testing Series_SpecsCar API ===')
  for (const specId of specIds) {
    const url = `https://car.autohome.com.cn/ajax/series_SpecsCar.aspx?specId=${specId}`
    try {
      const res = await fetch(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.autohome.com.cn/',
        }
      })
      const text = await res.text()
      console.log(`\n  specId=${specId} status=${res.status} size=${text.length}`)
      
      // Look for VR-related fields
      const vrMatch = text.match(/"vr[^"]*":/gi) || []
      console.log(`  VR fields: ${vrMatch.slice(0, 5).join(', ')}`)
      
      // Look for ext ID
      const extMatch = text.match(/ext[Ii]d["\s:]+(\d+)/i) || text.match(/panoid["\s:]+(\d+)/i)
      console.log(`  Ext/Pano IDs: ${extMatch ? extMatch[0] : 'none'}`)
      
      // Show first 300 chars
      console.log(`  Preview: ${text.substring(0, 300)}`)
    } catch (e) {
      console.log(`  Error: ${e.message}`)
    }
  }
}

test().catch(console.error)
