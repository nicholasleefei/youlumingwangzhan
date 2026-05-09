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
  console.log('=== 汽车之家VR position数据分析 ===\n')

  // 试一个spec的内饰VR
  const specId = '72085'
  const vrUrl = `https://pano.autohome.com.cn/car/pano/${specId}`
  console.log(`内饰VR: ${vrUrl}`)

  try {
    const html = await fetchPage(vrUrl)
    console.log(`HTML长度: ${html.length}`)

    // 找完整的position数据
    console.log('\n=== position数据分析 ===')

    // 提取 "position":"xxx" 格式
    const posMatches = html.match(/position['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
    console.log(`position匹配: ${posMatches.slice(0, 10).join('\n  ')}`)

    // 提取 "Seq":xxx 格式
    const seqMatches = html.match(/Seq['"]?\s*:\s*(\d+)/gi) || []
    console.log(`\nSeq匹配: ${seqMatches.slice(0, 10).join('\n  ')}`)

    // 找Hori数据
    const horiMatches = html.match(/Hori\s*:\s*(\d+)/gi) || []
    console.log(`Hori匹配: ${horiMatches.slice(0, 10).join('\n  ')}`)

    // 找color_info中的position
    const colorInfoMatch = html.match(/color_info\s*=\s*(\[[\s\S]*?\]])\s*;?\s*$/mi)
    if (colorInfoMatch) {
      console.log(`\ncolor_info长度: ${colorInfoMatch[1].length}`)
      const posInColor = colorInfoMatch[1].match(/position['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
      console.log(`color_info中的position: ${posInColor.slice(0, 10).join(', ')}`)
    }

    // 找包含sybgn的行
    console.log('\n=== 找sybgn相关数据 ===')
    const lines = html.split(/[\r\n]+/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('sybgn') || (line.includes('position') && line.match(/\d{5,}/))) {
        const clean = line.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (clean.length > 10 && clean.length < 500) {
          console.log(`  ${clean.slice(0, 300)}`)
        }
      }
    }

    // 找API返回的数据
    console.log('\n\n=== 尝试不同的API ===')

    // 外观VR API
    const extUrls = [
      'https://pano.autohome.com.cn/api/ext/baseinfo/5771?category=ext',
      'https://pano.autohome.com.cn/api/ext/baseinfo/5771?category=interior',
    ]

    for (const url of extUrls) {
      try {
        const resp = await fetchPage(url)
        console.log(`\n${url}`)
        console.log(`响应: ${resp.slice(0, 300)}`)
      } catch (e) {
        console.log(`错误: ${e.message}`)
      }
    }

    // 找图片URL中的标签
    console.log('\n=== 提取VR图片URL和标签 ===')
    const imgUrls = html.match(/https?:\/\/panovr\.autoimg\.cn[^\s"']+/gi) || []
    const uniqueUrls = [...new Set(imgUrls)]
    console.log(`找到 ${uniqueUrls.length} 个VR图片URL`)
    console.log(`示例: ${uniqueUrls.slice(0, 5).join('\n  ')}`)

    // 检查URL中是否包含sybgn
    const sybgnUrls = uniqueUrls.filter(u => u.includes('sybgn'))
    console.log(`\n包含sybgn的URL: ${sybgnUrls.slice(0, 5).join('\n  ')}`)

    // 提取标签
    for (const url of uniqueUrls.slice(0, 5)) {
      const tagMatch = url.match(/sybgn(\d+)/i)
      if (tagMatch) {
        console.log(`\n标签: ${tagMatch[1]}`)
        console.log(`URL: ${url}`)
      }
    }

  } catch (e) {
    console.log(`错误: ${e.message}`)
  }
}

main().catch(console.error)
