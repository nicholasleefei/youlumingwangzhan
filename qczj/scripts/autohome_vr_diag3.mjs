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
  console.log('=== 汽车之家VR标签与位置名称分析 ===\n')

  // 用户提供的标签
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']
  console.log('标签:', tags.join(', '))

  // 试一个spec的内饰VR
  const specId = '72085'
  const vrUrl = `https://pano.autohome.com.cn/car/pano/${specId}`
  console.log(`\n内饰VR: ${vrUrl}`)

  try {
    const html = await fetchPage(vrUrl)
    console.log(`HTML长度: ${html.length}`)

    // 找pano配置数据
    const configMatch = html.match(/var\s+config\s*=\s*({[\s\S]*?})\s*;?\s*$/mi) ||
                        html.match(/window\.\w+\s*=\s*({[\s\S]*?})\s*;?\s*$/mi)
    if (configMatch) {
      const jsonStr = configMatch[1]
      console.log(`\n找到config (${jsonStr.length}字符)`)

      // 提取panoId
      const panoIdMatch = jsonStr.match(/panoId\s*:\s*['"]?(\d+)['"]?/)
      if (panoIdMatch) {
        console.log(`panoId: ${panoIdMatch[1]}`)
      }

      // 提取图片URL
      const imgMatches = jsonStr.match(/https?:\/\/[^\s"']+\.(jpg|png)/gi) || []
      console.log(`图片: ${imgMatches.slice(0, 3).join('\n  ')}`)

      // 提取可能的position/name
      const nameMatches = jsonStr.match(/(?:name|position|label|title|text)['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
      if (nameMatches.length > 0) {
        console.log(`名称标签: ${nameMatches.slice(0, 10).join(', ')}`)
      }
    }

    // 找__INITIAL_STATE__或类似
    const stateMatch = html.match(/window\.__[A-Z_]+\s*=\s*({[\s\S]*?})\s*;?\s*<\/script>/gis)
    if (stateMatch) {
      for (const state of stateMatch) {
        if (state.includes('pano') || state.includes('sybgn')) {
          console.log(`\n找到相关state (${state.length})`)
          console.log(state.slice(0, 500))
        }
      }
    }

    // 直接在HTML中搜索关键词
    const keywords = ['sybgn', 'panoId', 'Seq', 'Url', 'image_root', 'seat', 'position']
    console.log('\n=== 关键词搜索 ===')
    for (const kw of keywords) {
      const count = (html.match(new RegExp(kw, 'gi')) || []).length
      if (count > 0) {
        console.log(`  "${kw}": ${count}次`)
      }
    }

    // 找image_root
    const rootMatch = html.match(/image_root['"]?\s*:\s*['"]([^'"]+)['"]/i)
    if (rootMatch) {
      console.log(`\nimage_root: ${rootMatch[1]}`)
    }

    // 找VR图片的Hori/Normal数据
    const horiMatches = html.match(/Hori['"]?\s*:\s*(\d+)/gi) || []
    const normalMatches = html.match(/Normal['"]?\s*:\s*(\d+)/gi) || []
    console.log(`Hori: ${horiMatches.slice(0, 10).join(', ')}`)
    console.log(`Normal: ${normalMatches.slice(0, 10).join(', ')}`)

  } catch (e) {
    console.log(`错误: ${e.message}`)
  }

  // 尝试API直接获取VR信息
  console.log('\n\n=== 尝试VR API ===')
  const apiUrls = [
    `https://pano.autohome.com.cn/api/ext/baseinfo/5771`,  // 从之前诊断知道extId=5771
    `https://pano.autohome.com.cn/car/pano/${specId}/?src=share`,
  ]

  for (const apiUrl of apiUrls) {
    console.log(`\n${apiUrl}`)
    try {
      const resp = await fetchPage(apiUrl)
      if (resp.length < 500) {
        console.log(`响应: ${resp.slice(0, 200)}`)
      } else {
        console.log(`响应长度: ${resp.length}`)
        // 找JSON中的name
        const nameMatch = resp.match(/name['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
        console.log(`name: ${nameMatch.slice(0, 5).join(', ')}`)
      }
    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }

  // 分析标签差值
  console.log('\n\n=== 标签差值分析 ===')
  console.log('标签组1: 44890, 44891, 44892 (差值=1, 连续)')
  console.log('标签组2: 46714, 46715, 46716 (差值=1, 连续)')
  console.log('两组之间: 差值=1822')
  console.log('\n可能解释:')
  console.log('- 每组3个连续的标签可能是同一个VR位置的不同角度')
  console.log('- 或者标签ID本身没有位置含义，只是序号')

  console.log('\n=== 建议的命名方案 ===')
  console.log('方案1: 使用标签ID作为位置名称')
  console.log('  - 44890, 44891, 44892 -> 内饰VR位置1-1, 1-2, 1-3')
  console.log('  - 46714, 46715, 46716 -> 内饰VR位置2-1, 2-2, 2-3')
  console.log('\n方案2: 猜测实际位置（待验证）')
  console.log('  - 驾驶位、前排、后排、后备箱等')
  console.log('\n方案3: 直接使用标签编号')
  console.log('  - 根据标签数值分组命名')
}

main().catch(console.error)
