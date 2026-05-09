import fetch from 'node-fetch'

async function test() {
  const seriesId = 110
  
  // Fetch the full imglist page
  const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-x-x-x-x-x-1.html`
  const res = await fetch(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    }
  })
  
  const text = await res.text()
  
  // Check for various data formats
  console.log(`Page size: ${text.length}`)
  
  // 1. __NEXT_DATA__
  const nextData = text.match(/<script[^>]*>window\.__NEXT_DATA__\s*=\s*(\{.*?\})\s*<\/script>/s)
  console.log(`__NEXT_DATA__: ${nextData ? 'FOUND' : 'NOT FOUND'}`)
  
  // 2. window.__INITIAL_STATE__ or similar
  const initState = text.match(/window\.__[A-Z_]+\s*=\s*(\{.*?\});/s)
  console.log(`__INITIAL_STATE__: ${initState ? 'FOUND' : 'NOT FOUND'}`)
  
  // 3. Look for the data embedded in JavaScript
  const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
  console.log(`\nScript blocks: ${scriptBlocks.length}`)
  
  // 4. Look for __NEXT_DATA__ in any script
  for (let i = 0; i < scriptBlocks.length; i++) {
    if (scriptBlocks[i].includes('__NEXT_DATA__') || scriptBlocks[i].includes('SeriesPicList') || scriptBlocks[i].includes('specList')) {
      console.log(`Script ${i}: ${scriptBlocks[i].substring(0, 200)}`)
    }
  }
  
  // 5. Check for embedded JSON in scripts
  for (let i = 0; i < scriptBlocks.length; i++) {
    const content = scriptBlocks[i]
    if (content.includes('"specList"') || content.includes("'specList'")) {
      console.log(`\nFound specList in script ${i}`)
      console.log(content.substring(0, 500))
    }
  }
  
  // 6. Check if this is a redirect page
  if (text.includes('autoimg.cn') || text.includes('redirect') || text.includes('Verify')) {
    console.log('\n-> This looks like an anti-bot page!')
  }
  
  // 7. Check content-type
  console.log(`\nContent-Type: ${res.headers.get('content-type')}`)
  console.log(`Status: ${res.status}`)
  
  // 8. Check for specific markers
  const markers = ['SeriesPicList', 'specList', 'vrinfo', 'picinfo', 'pano.autohome.com.cn', '__NEXT_DATA__']
  for (const m of markers) {
    const count = (text.match(new RegExp(m, 'g')) || []).length
    console.log(`  "${m}": ${count} occurrences`)
  }
  
  // 9. Find the VR section specifically
  const vrSection = text.match(/360[掳度]全[景視]|<span[^>]*>360<\/span>/gi)
  console.log(`\nVR section markers: ${vrSection?.length || 0}`)
  
  // 10. Look for data in specific attributes
  const dataAttrs = text.match(/data-(?:spec|vr|pano|id)="[^"]*"/gi) || []
  console.log(`\nData attributes with spec/vr/pano: ${dataAttrs.slice(0, 5).join('\n')}`)
  
  // 11. Check for API calls that might have the data
  const apiCalls = text.match(/"https?:\/\/[^"]*api[^"]*"/gi) || []
  console.log(`\nAPI URLs: ${apiCalls.slice(0, 5).join(', ')}`)
  
  const fetchCalls = text.match(/fetch\(['"`]([^'"`]+)['"`]/gi) || []
  console.log(`fetch calls: ${fetchCalls.slice(0, 5).join(', ')}`)
  
  // 12. Try to find where the series data is embedded
  const jsonLd = text.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  console.log(`\nJSON-LD scripts: ${jsonLd.length}`)
  
  // 13. Check if the page has data in a different format
  const initialState = text.match(/window\.__STATE__\s*=\s*(\{.*?\});/s) || text.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\});/s)
  if (initialState) {
    console.log(`Initial state found! Length: ${initialState[1].length}`)
    try {
      const data = JSON.parse(initialState[1])
      console.log(`Keys: ${Object.keys(data).join(', ')}`)
    } catch (e) {
      console.log(`Parse error: ${e.message}`)
    }
  }
}

test().catch(console.error)
