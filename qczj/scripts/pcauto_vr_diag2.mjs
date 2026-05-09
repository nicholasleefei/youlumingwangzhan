import fetch from 'node-fetch'
import iconv from 'iconv-lite'

async function fetchPage(url) {
  const res = await fetch(url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return iconv.decode(buf, 'gbk')
}

async function main() {
  console.log('=== 太平洋汽车网VR图片标签分析 ===\n')

  // 测试不同的URL格式
  const testUrls = [
    'https://www.pcauto.com.cn/cars/imglist/sg44890-8-o1.html',
    'https://price.pcauto.com.cn/cars/imglist/sg44890.html',
  ]

  for (const url of testUrls) {
    console.log(`\n--- 测试URL: ${url} ---`)
    try {
      const html = await fetchPage(url)
      console.log(`HTML长度: ${html.length}`)

      // 找sybgn标签
      const sybgnMatches = html.match(/sybgn(\d+)/gi) || []
      console.log(`sybgn出现次数: ${sybgnMatches.length}`)
      if (sybgnMatches.length > 0) {
        const uniqueTags = [...new Set(sybgnMatches)]
        console.log(`唯一标签: ${uniqueTags.slice(0, 20).join(', ')}`)
      }

      // 找图片URL
      const imgMatches = html.match(/https?:\/\/img\.pcauto\.com\.cn[^"<\s]+/gi) || []
      console.log(`图片URL数量: ${imgMatches.length}`)
      if (imgMatches.length > 0) {
        console.log(`示例: ${imgMatches.slice(0, 5).join('\n  ')}`)
      }

    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }

  // 直接看某个VR标签的页面
  console.log('\n\n=== 分析sybgn标签含义 ===')
  const vrTags = ['44890', '44891', '44892', '46714', '46715', '46716']

  // 这些标签可能是VR全景中的位置索引
  // 让我尝试找页面中的标签含义
  const tagsUrl = 'https://www.pcauto.com.cn/cars/imglist/sg44890-8.html'
  console.log(`\n测试: ${tagsUrl}`)

  try {
    const html = await fetchPage(tagsUrl)
    console.log(`HTML长度: ${html.length}`)

    // 提取更多上下文
    const lines = html.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('sybgn')) {
        const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 4)).join('\n')
        console.log(`\n上下文:\n${context}\n---`)
        if (i > 50) break
      }
    }

  } catch (e) {
    console.log(`错误: ${e.message}`)
  }
}

main().catch(console.error)
