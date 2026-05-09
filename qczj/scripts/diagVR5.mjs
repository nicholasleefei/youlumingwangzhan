import fetch from 'node-fetch'
import { readFileSync } from 'fs'

async function test() {
  // First try network fetch
  const url = `https://www.autohome.com.cn/cars/imglist-x-x-110-x-x-x-x-x-x-1.html`
  
  try {
    const res = await fetch(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      }
    })
    
    const text = await res.text()
    
    // Parse the JSON data
    const match = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
    if (match) {
      const data = JSON.parse(match[1])
      const pp = data?.props?.pageProps
      
      console.log('=== SeriesPicList ===')
      const spl = pp?.SeriesPicList
      if (spl) {
        console.log('Keys:', Object.keys(spl))
        
        console.log('\n--- vrinfo ---')
        const vrinfo = spl.vrinfo
        console.log(JSON.stringify(vrinfo, null, 2))
        
        console.log('\n--- picinfo ---')
        const picinfo = spl.picinfo
        if (Array.isArray(picinfo)) {
          console.log(`Array of ${picinfo.length} items:`)
          for (const item of picinfo) {
            console.log(`  ${item.name}: total=${item.total}`)
          }
        } else if (picinfo && typeof picinfo === 'object') {
          console.log('Object with callist:')
          console.log(JSON.stringify(picinfo, null, 2).substring(0, 2000))
        }
        
        console.log('\n--- specList (first year) ---')
        const specList = spl.specList
        if (Array.isArray(specList)) {
          console.log(`Years: ${specList.map(y => y.year).join(', ')}`)
          if (specList[0]) {
            console.log(`First year (${specList[0].year}) specs: ${specList[0].list?.length || 0}`)
            if (specList[0].list?.[0]) {
              console.log(JSON.stringify(specList[0].list[0], null, 2))
            }
          }
        }
      } else {
        console.log('No SeriesPicList found')
        console.log('pageProps keys:', Object.keys(pp || {}))
      }
    } else {
      console.log('No __NEXT_DATA__ found')
    }
  } catch (e) {
    console.log(`Error: ${e.message}`)
  }
}

test().catch(console.error)
