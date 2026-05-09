import fetch from 'node-fetch'
import iconv from 'iconv-lite'

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
  console.log('=== 太平洋汽车网VR结构分析 ===\n')

  // 测试一些太平洋有VR的车系
  // 汉兰达 sgId可能是 44890 (从用户之前的下载)
  const testSgIds = ['44890']

  for (const sgId of testSgIds) {
    console.log(`\n=== 测试 sgId: ${sgId} ===`)

    // 尝试不同的URL格式
    const urls = [
      `https://price.pcauto.com.cn/cars/imglist/sg${sgId}.html`,
      `https://www.pcauto.com.cn/cars/imglist/sg${sgId}/8.html`,
    ]

    for (const url of urls) {
      console.log(`\n尝试: ${url}`)
      try {
        const html = await fetchPage(url)
        console.log(`HTML长度: ${html.length}`)

        // 找关键词
        const keywords = ['vr', 'VR', '全景', '360', 'pano', 'Pano']
        for (const kw of keywords) {
          const count = (html.match(new RegExp(kw, 'gi')) || []).length
          if (count > 0) console.log(`  "${kw}" 出现 ${count} 次`)
        }

        // 找sybgn标签
        const sybgnMatches = html.match(/sybgn(\d+)/gi) || []
        if (sybgnMatches.length > 0) {
          console.log(`\n  找到sybgn标签: ${[...new Set(sybgnMatches)].slice(0, 30).join(', ')}`)

          // 尝试找标签对应的位置名称
          // 找附近的文字
          const lines = html.split('\n')
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('sybgn')) {
              const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 6)).join('')
              // 提取标签附近的文本
              const textContext = context.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
              if (textContext.length > 20) {
                console.log(`  上下文: ${textContext.slice(0, 200)}`)
                break
              }
            }
          }
        }

        // 找JSON数据
        const jsonMatches = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+})/i) ||
                           html.match(/var\s+\w+\s*=\s*({.+})/i) ||
                           html.match(/data:\s*\[(.+)\]/gi)
        if (jsonMatches) {
          console.log(`\n  找到JSON数据，长度: ${jsonMatches[0]?.length || 0}`)
        }

      } catch (e) {
        console.log(`  错误: ${e.message}`)
      }
    }
  }

  // 直接分析VR图片URL
  console.log('\n\n=== VR图片URL分析 ===')
  const vrUrls = [
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44890_ChxpVWldyDWAJMIWADD3GtOKb4Q079.png',
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44891_ChxpVWldyDWAJMIWADD3GtOKb4Q079.png',
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn46714_ChxpVWldyDWAJMIWADD3GtOKb4Q079.png',
  ]

  for (const url of vrUrls) {
    const tag = url.match(/sybgn(\d+)/)?.[1]
    console.log(`\n标签ID: ${tag}`)
    console.log(`URL: ${url}`)
    // sybgn后面的数字就是标签
    // 需要从页面获取这个数字对应的位置名称
  }

  console.log('\n=== 结论 ===')
  console.log('sybgn标签格式: sybgn + 数字ID')
  console.log('数字ID本身可能是VR视角索引')
  console.log('需要从页面获取位置名称（如果有的话）')
}

main().catch(console.error)
