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
  console.log('=== 太平洋汽车网VR标签和位置分析 ===\n')

  // 用之前成功下载的汉兰达 sgId
  // 先看主页面找VR相关信息
  const sgIds = ['44890', '46713']  // 汉兰达可能有多个配置

  for (const sgId of sgIds) {
    console.log(`\n=== sgId: ${sgId} ===`)

    // 尝试车系主页面
    const mainUrls = [
      `https://price.pcauto.com.cn/cars/imglist/sg${sgId}.html`,
      `https://www.pcauto.com.cn/cars/sg${sgId}.html`,
    ]

    for (const url of mainUrls) {
      try {
        const html = await fetchPage(url)
        if (html.length < 100) continue

        console.log(`\n页面: ${url}`)
        console.log(`长度: ${html.length}`)

        // 找VR相关数据
        const vrPatterns = [
          /vrinfo['"]?\s*:\s*\[([^\]]+)\]/gi,
          /vrList['"]?\s*:\s*\[([^\]]+)\]/gi,
          /pano['"]?\s*:\s*\{([^}]+)\}/gi,
          /position['"]?\s*:\s*['"]([^'"]+)['"]/gi,
          /seat['"]?\s*:\s*['"]([^'"]+)['"]/gi,
        ]

        for (const pattern of vrPatterns) {
          const matches = html.match(pattern)
          if (matches) {
            console.log(`  找到匹配: ${matches.slice(0, 5).join('\n    ')}`)
          }
        }

        // 找sybgn标签及其上下文
        const lines = html.split(/[\r\n]+/)
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('sybgn')) {
            const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 4))
              .map(l => l.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
              .filter(l => l.length > 10)
              .join(' | ')
            if (context) {
              console.log(`\n  sybgn上下文: ${context.slice(0, 300)}`)
            }
          }
        }

        // 找JSON中的位置名称
        const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*;?\s*<\/script>/is)
        if (jsonMatch) {
          console.log(`\n  找到__INITIAL_STATE__，长度: ${jsonMatch[1].length}`)
          // 提取VR相关
          const vrMatch = jsonMatch[1].match(/vr[s]?['"]?\s*:\s*(\[[^\]]+\]|{[^}]+})/i)
          if (vrMatch) {
            console.log(`  VR数据: ${vrMatch[1].slice(0, 200)}`)
          }
        }

        break
      } catch (e) {
        console.log(`  错误: ${e.message}`)
      }
    }
  }

  // 分析图片URL中的标签
  console.log('\n\n=== VR图片标签分析 ===')
  console.log('用户提供的数据:')
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']
  console.log('标签:', tags.join(', '))

  // 计算差值
  console.log('\n标签差值分析:')
  for (let i = 1; i < tags.length; i++) {
    const diff = parseInt(tags[i]) - parseInt(tags[i - 1])
    console.log(`  ${tags[i - 1]} -> ${tags[i]}: ${diff}`)
  }

  // 假设标签是VR中的位置索引
  console.log('\n可能的解释:')
  console.log('- 44890, 44891, 44892 差值都是1，可能是连续的视角位置')
  console.log('- 46714, 46715, 46716 差值都是1，可能是另一组视角位置')
  console.log('- 两组之间差值1822，可能是不同的区域/分类')

  // 可能的命名逻辑
  console.log('\n建议的命名方式:')
  console.log('- 组1 (44890-44892): 内饰第1-3个视角')
  console.log('- 组2 (46714-46716): 内饰第4-6个视角')
  console.log('- 或按实际位置: 驾驶位、前排中部、后排等')

  console.log('\n=== 测试获取位置名称 ===')
  // 尝试找一个有VR页面的车系
  const vrUrl = 'https://price.pcauto.com.cn/cars/imglist/sg44890-8-o1.html'
  console.log(`\nVR页面: ${vrUrl}`)

  try {
    const html = await fetchPage(vrUrl)
    console.log(`返回: ${html.slice(0, 500)}`)
  } catch (e) {
    console.log(`错误: ${e.message}`)
  }
}

main().catch(console.error)
