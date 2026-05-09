import fetch from 'node-fetch'

async function test() {
  const specId = 74009
  const url = `https://pano.autohome.com.cn/car/ext/${specId}`
  
  const res = await fetch(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    }
  })
  
  const text = await res.text()
  console.log(`Size: ${text.length}`)
  
  // Look for JSON data embedded in the page
  // 1. Try to find baseinfo data
  const baseinfoRe = /baseinfo\s*[=:]\s*(\{[^}]+\})/gi
  let m
  while ((m = baseinfoRe.exec(text))) {
    console.log(`baseinfo: ${m[0].substring(0, 200)}`)
  }
  
  // 2. Try to find color_info
  const colorRe = /color_info\s*[=:]\s*(\[[\s\S]*?\])/gi
  while ((m = colorRe.exec(text))) {
    console.log(`color_info: ${m[0].substring(0, 300)}`)
  }
  
  // 3. Look for globalConfig
  const globalRe = /globalConfig\s*=\s*(\{[\s\S]*?\});/i
  const globalMatch = text.match(globalRe)
  if (globalMatch) {
    console.log(`\nglobalConfig found (${globalMatch[1].length} chars)`)
    console.log(`Preview: ${globalMatch[1].substring(0, 300)}`)
  }
  
  // 4. Look for any JSON-like structures with image data
  const imgRootRe = /image_root\s*[=:]\s*["']([^"']+)["']/i
  const imgRootMatch = text.match(imgRootRe)
  console.log(`\nimage_root: ${imgRootMatch?.[1] || 'not found'}`)
  
  // 5. Look for Hori data
  const horiRe = /Hori\s*[=:]\s*(\{[^}]+\})/gi
  while ((m = horiRe.exec(text))) {
    console.log(`Hori: ${m[0].substring(0, 200)}`)
  }
  
  // 6. Look for var declarations with IDs
  const varRe = /var\s+(\w+)\s*=\s*(\d+)/gi
  while ((m = varRe.exec(text))) {
    if (['id', 'Id', 'ID', 'extId', 'specId'].includes(m[1])) {
      console.log(`var ${m[1]} = ${m[2]}`)
    }
  }
  
  // 7. Check if there's an API call in the page
  const apiRe = /fetch\s*\([^)]*\)/gi
  const apis = text.match(apiRe) || []
  console.log(`\nAPI calls: ${apis.slice(0, 5).join(', ')}`)
  
  // 8. Look for data in script tags with specific content
  const scriptBlocks = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || []
  console.log(`\nScript blocks: ${scriptBlocks.length}`)
  for (let i = 0; i < scriptBlocks.length; i++) {
    const content = scriptBlocks[i]
    if (content.includes('baseinfo') || content.includes('color_info') || content.includes('image_root')) {
      console.log(`Script ${i} has VR data:`)
      console.log(content.substring(0, 500))
    }
  }
  
  // 9. Look for JSON data in any script
  const jsonRe = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi
  const jsonBlocks = text.match(jsonRe) || []
  console.log(`\nJSON script blocks: ${jsonBlocks.length}`)
  for (const block of jsonBlocks) {
    console.log(block.substring(0, 300))
  }
  
  // 10. Try to find the data in the page body
  // Check for specific markers
  console.log('\n=== Searching for specific markers ===')
  const markers = ['ColorName', 'ColorValue', 'image_root', 'Hori', 'Normal', 'Seq', 'Url', 'baseinfo', 'visitext']
  for (const marker of markers) {
    const count = (text.match(new RegExp(marker, 'g')) || []).length
    console.log(`"${marker}": ${count} occurrences`)
  }
}

test().catch(console.error)
