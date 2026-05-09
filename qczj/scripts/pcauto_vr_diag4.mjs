import fetch from 'node-fetch'
import iconv from 'iconv-lite'

const sgId = '44890'

async function fetchPage(url) {
  try {
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
  } catch (e) {
    return `ERROR: ${e.message}`
  }
}

async function main() {
  console.log('=== 太平洋汽车网VR标签分析 ===\n')

  // 尝试不同的URL格式
  const urls = [
    `https://price.pcauto.com.cn/cars/imglist/sg${sgId}-8-o1.html`,
    `https://price.pcauto.com.cn/cars/imglist/sg${sgId}-8.html`,
    `https://price.pcauto.com.cn/cars/imglist/sg${sgId}/8.html`,
  ]

  for (const url of urls) {
    console.log(`\n--- 测试: ${url} ---`)
    const html = await fetchPage(url)
    if (html.startsWith('ERROR:')) {
      console.log(html)
    } else {
      console.log(`返回长度: ${html.length}`)

      // 找sybgn标签
      const sybgnMatches = html.match(/sybgn\d+/gi) || []
      console.log(`找到sybgn: ${[...new Set(sybgnMatches)].slice(0, 20).join(', ')}`)

      // 找data-src图片
      const imgMatches = html.match(/data-src="([^"]+)"/gi) || []
      console.log(`找到图片: ${imgMatches.length} 张`)

      if (imgMatches.length > 0) {
        console.log('示例:')
        imgMatches.slice(0, 5).forEach((m, i) => {
          const url = m.match(/data-src="([^"]+)"/)?.[1] || ''
          console.log(`  ${i + 1}: ${url}`)
        })
      }
    }
  }

  // 假设sybgn标签格式: sybgn + 数字
  // 44890, 44891, 44892 -> 可能是第1/2/3个位置
  // 46714, 46715, 46716 -> 可能是另外的位置
  console.log('\n\n=== 标签分析 ===')
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']

  // 这些数字的差值可能表示位置
  console.log('标签差值:')
  for (let i = 1; i < tags.length; i++) {
    const diff = parseInt(tags[i]) - parseInt(tags[i - 1])
    console.log(`  ${tags[i - 1]} -> ${tags[i]}: 差值 ${diff}`)
  }

  // 太平洋网VR图片URL格式:
  // https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44890_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg
  // 标签部分是 sybgn + 数字ID

  console.log('\n\n=== VR图片URL格式 ===')
  console.log('太平洋VR图片URL格式: https://img.pcauto.com.cn/pano/[path]/sybgn[tagId]_[hash].jpg')
  console.log('标签ID可能是VR中的视角/位置索引')
  console.log('\n可能的命名方式:')
  console.log('  - sybgn + ID数字本身')
  console.log('  - 需要从页面中获取位置名称')
}

main().catch(console.error)
