import fetch from 'node-fetch'

async function fetchPage(url) {
  const res = await fetch(url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function main() {
  console.log('=== 汽车之家VR标签分析（内饰VR位置命名）===\n')

  // 用户提供的标签
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']
  console.log('VR标签:', tags.join(', '))

  // 先在图片列表页面找这些标签的上下文
  console.log('\n=== 在图片列表页面搜索sybgn标签 ===')

  // 问界M8 内饰图页面
  const urls = [
    'https://www.autohome.com.cn/cars/imglist-x-x-8003-x-10-x-x-x-x-1.html',
  ]

  for (const url of urls) {
    console.log(`\n页面: ${url}`)
    try {
      const html = await fetchPage(url)
      console.log(`HTML长度: ${html.length}`)

      // 找sybgn标签及其上下文
      const lines = html.split(/[\r\n]+/)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('sybgn')) {
          const context = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10))
          const textContext = context.map(l => l.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l.length > 5)

          for (const line of textContext) {
            if (line.includes('sybgn') || line.match(/\d{5,}/)) {
              console.log(`  ${line.slice(0, 200)}`)
            }
          }
          break
        }
      }

      // 也尝试找包含标签的JSON
      const jsonMatch = html.match(/\{[^{]*"sybgn[^}]+\}/gi) ||
                        html.match(/\{[^{]*"picid"[^}]+\}/gi)
      if (jsonMatch) {
        console.log('\n找到JSON数据:')
        console.log(jsonMatch.slice(0, 3).join('\n'))
      }

    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }

  // 直接访问内饰VR页面找标签
  console.log('\n\n=== 在内饰VR页面分析标签 ===')

  // 问界M8 spec 72085 的内饰VR
  const interiorVrUrl = 'https://pano.autohome.com.cn/car/pano/72085'
  console.log(`\n内饰VR页面: ${interiorVrUrl}`)

  try {
    const html = await fetchPage(interiorVrUrl)
    console.log(`HTML长度: ${html.length}`)

    // 找panoId相关数据
    const panoMatches = html.match(/panoId['"]?\s*:\s*['"]?(\d+)['"]?/gi) || []
    console.log(`找到panoId: ${panoMatches.slice(0, 5).join(', ')}`)

    // 找Seq/Url
    const seqMatches = html.match(/Seq['"]?\s*:\s*(\d+)/gi) || []
    const urlMatches = html.match(/Url['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
    console.log(`找到Seq: ${seqMatches.slice(0, 10).join(', ')}`)
    console.log(`找到Url: ${urlMatches.slice(0, 5).join(', ')}`)

    // 找可能的position/name
    const nameMatches = html.match(/(?:name|Name|position|Position)['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
    if (nameMatches.length > 0) {
      console.log(`找到name/position: ${nameMatches.slice(0, 10).join(', ')}`)
    }

    // 找JSON配置中的标签
    const allJson = html.match(/window\.__[A-Z_]+\s*=\s*({.+?})\s*;?\s*<\/script>/gis)
    if (allJson) {
      for (const json of allJson) {
        if (json.includes('sybgn') || json.includes('pano')) {
          console.log(`\n找到相关JSON (${json.length}): ${json.slice(0, 500)}...`)
        }
      }
    }

  } catch (e) {
    console.log(`错误: ${e.message}`)
  }

  // 尝试分析VR图片URL
  console.log('\n\n=== 分析VR图片URL格式 ===')
  console.log('太平洋网格式: .../sybgn44890_xxx.jpg')
  console.log('汽车之家格式可能是: .../sybgn44890_xxx.png')

  // 搜索可能的内饰VR标签
  console.log('\n=== 搜索汽车之家内饰VR标签 ===')

  // 试一个通用的内饰VR URL
  const testVrUrls = [
    'https://pano.autohome.com.cn/car/pano/72085',
    'https://pano.autohome.com.cn/car/pano/72088',
    'https://pano.autohome.com.cn/car/pano/73981',
  ]

  for (const vrUrl of testVrUrls) {
    console.log(`\n${vrUrl}`)
    try {
      const html = await fetchPage(vrUrl)
      // 提取JSON部分
      const jsonMatch = html.match(/var\s+\w+\s*=\s*({[\s\S]*?})\s*;?\s*$/mi) ||
                        html.match(/window\.\w+\s*=\s*({[\s\S]*?})\s*;?\s*$/mi)
      if (jsonMatch) {
        console.log(`JSON长度: ${jsonMatch[1].length}`)
        // 找panoId
        const pidMatch = jsonMatch[1].match(/panoId['"]?\s*:\s*['"]?(\d+)['"]?/)
        if (pidMatch) {
          console.log(`panoId: ${pidMatch[1]}`)
        }
      }

      // 找图片URL
      const imgUrls = html.match(/https?:\/\/[^\s"']+\.(jpg|png|jpeg)/gi) || []
      console.log(`图片URL: ${imgUrls.slice(0, 3).join(', ')}`)

    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }

  console.log('\n=== 结论 ===')
  console.log('需要找到VR图片URL中sybgn标签对应的实际位置名称')
  console.log('可能需要从页面HTML中提取位置/视角数据')
}

main().catch(console.error)
