import fetch from 'node-fetch'
import iconv from 'iconv-lite'

const sgId = '44890'

async function fetchPage(url) {
  const res = await fetch(url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return iconv.decode(buf, 'gbk')
}

async function main() {
  console.log('=== 太平洋汽车网VR标签诊断 ===\n')

  const categories = [
    { id: '1', name: '外观' },
    { id: '2', name: '内饰' },
    { id: '3', name: '空间' },
    { id: '4', name: '细节' },
    { id: '8', name: 'VR' },
  ]

  for (const cat of categories) {
    const url = `https://price.pcauto.com.cn/cars/imglist/sg${sgId}-${cat.id}-o1.html`
    console.log(`\n--- 分类 ${cat.id} (${cat.name}) ---`)
    console.log(`URL: ${url}`)

    try {
      const html = await fetchPage(url)

      // 找图片
      const dataSrcMatches = html.match(/data-src="(https?:\/\/img\.pcauto\.com\.cn[^"]+)"/gi) || []
      const srcMatches = html.match(/src="(https?:\/\/img\.pcauto\.com\.cn[^"]+)"/gi) || []
      const allMatches = [...dataSrcMatches, ...srcMatches]
      const uniqueUrls = [...new Set(allMatches.map(m => m.match(/src="([^"]+)"/)?.[1]).filter(Boolean))]

      if (uniqueUrls.length > 0) {
        console.log(`找到 ${uniqueUrls.length} 张图片`)
        console.log('示例URL:')
        uniqueUrls.slice(0, 5).forEach((url, i) => {
          console.log(`  ${i + 1}: ${url}`)
        })
      } else {
        console.log('未找到图片')
      }

      // 对于VR分类，找更多结构信息
      if (cat.id === '8') {
        // 找关键词
        const keywords = ['sybgn', 'position', 'seat', '驾驶', '后排', '后备箱', '方向盘', '中控']
        for (const kw of keywords) {
          const count = (html.match(new RegExp(kw, 'gi')) || []).length
          if (count > 0) console.log(`  "${kw}" 出现 ${count} 次`)
        }

        // 找可能的命名信息
        const titleMatches = html.match(/<title>([^<]+)<\/title>/i) || []
        if (titleMatches[1]) console.log(`  页面标题: ${titleMatches[1]}`)
      }

    } catch (e) {
      console.log(`  错误: ${e.message}`)
    }
  }

  // 直接测试VR标签
  console.log('\n\n=== 测试VR图片标签 ===')
  const testUrls = [
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44890_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg',
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44891_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg',
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn46714_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg',
  ]

  for (const url of testUrls) {
    console.log(`\n标签: ${url.match(/sybgn(\d+)/)?.[1] || 'unknown'}`)
    console.log(`URL: ${url}`)
  }
}

main().catch(console.error)
