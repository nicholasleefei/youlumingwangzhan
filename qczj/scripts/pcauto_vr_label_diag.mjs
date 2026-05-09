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
  console.log('=== 太平洋汽车网VR标签分析（内饰VR位置命名）===\n')

  // 用户提供的标签
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']
  console.log('太平洋网VR标签:', tags.join(', '))

  // 标签分析
  console.log('\n标签差值:')
  for (let i = 1; i < tags.length; i++) {
    const diff = parseInt(tags[i]) - parseInt(tags[i - 1])
    console.log(`  ${tags[i - 1]} -> ${tags[i]}: ${diff}`)
  }

  // 分析太平洋网VR图片URL格式
  console.log('\n=== 太平洋网VR图片URL格式 ===')
  const pcautoVrUrls = [
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44890_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg',
    'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44891_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg',
  ]

  for (const url of pcautoVrUrls) {
    const tag = url.match(/sybgn(\d+)/)?.[1]
    console.log(`标签: ${tag}`)
    console.log(`URL: ${url}`)
  }

  // 尝试从太平洋网VR页面获取位置名称
  console.log('\n\n=== 从太平洋网VR页面获取位置信息 ===')

  // 汉兰达 sgId=44890
  const vrPageUrls = [
    'https://price.pcauto.com.cn/cars/imglist/sg44890-8.html',
    'https://price.pcauto.com.cn/cars/imglist/sg44890-8-o1.html',
  ]

  for (const url of vrPageUrls) {
    console.log(`\n${url}`)
    try {
      const html = await fetchPage(url)
      console.log(`HTML长度: ${html.length}`)

      // 找sybgn标签和上下文
      const lines = html.split(/[\r\n]+/)
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('sybgn')) {
          const context = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10))
          const textContext = context.map(l => l.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(l => l.length > 5)
          for (const line of textContext) {
            if (line.includes('sybgn') || line.match(/[驾驶后排座位]/)) {
              console.log(`  ${line.slice(0, 200)}`)
            }
          }
          break
        }
      }

      // 找JSON数据
      const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*;?\s*<\/script>/is) ||
                        html.match(/var\s+data\s*=\s*({.+?})\s*;?\s*$/mi)
      if (jsonMatch) {
        console.log(`\n找到JSON (${jsonMatch[1].length}字符)`)
        // 提取VR相关
        const vrMatch = jsonMatch[1].match(/vr[s]?['"]?\s*:\s*(\[[\s\S]*?\]\]|\{[\s\S]*?\})/i)
        if (vrMatch) {
          console.log(`VR数据: ${vrMatch[1].slice(0, 300)}`)
        }
      }

    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }

  // 尝试从不同页面获取VR标签对应的位置名称
  console.log('\n\n=== 搜索位置名称关键词 ===')

  // 搜索可能的内饰位置关键词
  const positionKeywords = ['驾驶', '后排', '前排', '副驾', '主驾', '中控', '后备箱', '后排座椅', '天窗', '方向盘']
  const testUrl = 'https://price.pcauto.com.cn/cars/imglist/sg44890-8.html'

  try {
    const html = await fetchPage(testUrl)
    console.log(`\n搜索关键词:`)
    for (const kw of positionKeywords) {
      const count = (html.match(new RegExp(kw, 'g')) || []).length
      if (count > 0) {
        console.log(`  "${kw}": ${count}次`)
      }
    }
  } catch (e) {
    console.log(`错误: ${e.message}`)
  }

  // 根据标签差值分组
  console.log('\n\n=== 基于差值的分组分析 ===')
  console.log('标签组1: 44890, 44891, 44892 (差值=1)')
  console.log('标签组2: 46714, 46715, 46716 (差值=1)')
  console.log('\n可能解释:')
  console.log('- 每组可能代表同一位置的多个视角')
  console.log('- 或不同颜色/配置的内饰VR')

  console.log('\n=== 建议的命名方案 ===')
  console.log('方案A: 根据标签分组命名')
  console.log('  - 44890~44892: 内饰VR区组1 (视角1/2/3)')
  console.log('  - 46714~46716: 内饰VR区组2 (视角4/5/6)')
  console.log('\n方案B: 直接使用标签数值')
  console.log('  - 根据标签大小分组 (小标签组=前排, 大标签组=后排)')
  console.log('\n方案C: 通用命名')
  console.log('  - VR视角_001, VR视角_002, ...')
}

main().catch(console.error)
