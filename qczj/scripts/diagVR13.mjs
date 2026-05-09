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
  
  // Extract globalConfig.id
  const globalMatch = text.match(/globalConfig\s*=\s*(\{[\s\S]*?\});/)
  if (globalMatch) {
    try {
      // Fix potential issues with the JSON-like object
      let jsonStr = globalMatch[1]
      // Remove trailing commas
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1')
      const globalConfig = JSON.parse(jsonStr)
      console.log('globalConfig.id:', globalConfig.id)
      console.log('globalConfig.specId:', globalConfig.specId)
    } catch (e) {
      console.log('globalConfig parse error:', e.message)
      console.log('Raw:', globalMatch[1].substring(0, 300))
    }
  }
  
  // Extract all ColorName/ColorValue pairs
  const colorRe = /"ColorName"\s*:\s*"([^"]+)".*?"ColorValue"\s*:\s*"([^"]+)"/gs
  let m
  console.log('\nColors:')
  while ((m = colorRe.exec(text))) {
    console.log(`  ${m[1]}: ${m[2]}`)
  }
  
  // Extract image URLs from the Hori structure
  // Pattern: "Url": "path" with "Seq": number nearby
  const seqRe = /"Seq"\s*:\s*(\d+)[^}]*?"Url"\s*:\s*"([^"]+)"/gi
  console.log('\nSeq/Url pairs:')
  const urls = []
  while ((m = seqRe.exec(text))) {
    urls.push({ seq: Number(m[1]), url: m[2] })
  }
  urls.sort((a, b) => a.seq - b.seq)
  for (const u of urls.slice(0, 20)) {
    console.log(`  seq=${u.seq}: ${u.url}`)
  }
  console.log(`Total URLs: ${urls.length}`)
  
  // Look for image_root in the page
  // The image_root might be constructed from the vrcover URL
  const vrcover = 'https://img3.autoimg.cn/pano/g33/M01/7A/6F/ChxpVmiJ4x-AGIbDAAMoInOIAD8655.png'
  // The g33.autoimg.cn is the CDN, and the path after that is the image_root equivalent
  const imgRoot = 'https://img3.autoimg.cn/pano'
  console.log(`\nInferred image_root: ${imgRoot}`)
  
  // Check if there's a pattern like: the image URLs use the same CDN
  const sampleUrl = urls[0]?.url
  if (sampleUrl) {
    console.log(`Sample URL: ${sampleUrl}`)
    // Check if it's absolute or relative
    if (sampleUrl.startsWith('http')) {
      console.log('URLs are absolute')
    } else {
      console.log('URLs are relative, need to prepend image_root')
    }
  }
  
  // Check if the baseinfo API works with globalConfig.id
  const extId = '6009'
  console.log(`\n=== Testing baseinfo with extId=${extId} ===`)
  const baseinfoUrl = `https://pano.autohome.com.cn/api/ext/baseinfo/${extId}?src=m&category=car&deviceId=`
  try {
    const res2 = await fetch(baseinfoUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': `https://pano.autohome.com.cn/car/ext/${specId}`,
      }
    })
    const data = await res2.json()
    console.log('baseinfo response:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.log('baseinfo error:', e.message)
  }
}

test().catch(console.error)
