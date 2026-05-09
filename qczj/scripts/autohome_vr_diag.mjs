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
  console.log('=== 汽车之家VR标签分析 ===\n')

  // 分析sybgn标签
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']
  console.log('用户提供的VR标签:', tags.join(', '))

  // 这些标签出现在VR图片URL中
  console.log('\n=== VR图片URL格式 ===')
  const vrUrl = 'https://panovr.autoimg.cn/pano/g33/M00/03/3A/0x0_autohomecar__ChxpVWldyDWAJMIWADD3GtOKb4Q079.png'
  console.log(`汽车之家VR图片URL: ${vrUrl}`)

  // 用户提到的标签格式
  console.log('\n=== 分析sybgn标签格式 ===')
  console.log('URL中可能包含: .../sybgn44890_xxx.jpg 或 .../sybgn44891_xxx.jpg')

  // 差值分析
  console.log('\n标签差值:')
  for (let i = 1; i < tags.length; i++) {
    const diff = parseInt(tags[i]) - parseInt(tags[i - 1])
    console.log(`  ${tags[i - 1]} -> ${tags[i]}: ${diff}`)
  }

  // 搜索汽车之家VR页面找标签含义
  console.log('\n\n=== 在汽车之家VR页面搜索标签含义 ===')

  // 问界M8 seriesId=8003
  const seriesId = '8003'
  const urls = [
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-10-x-x-x-x-1.html`,  // 内饰
    `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-1-x-x-x-x-1.html`,    // 外观
  ]

  for (const url of urls) {
    console.log(`\n尝试: ${url}`)
    try {
      const html = await fetchPage(url)
      console.log(`HTML长度: ${html.length}`)

      // 找sybgn标签
      const sybgnMatches = html.match(/sybgn(\d+)/gi) || []
      if (sybgnMatches.length > 0) {
        console.log(`找到sybgn: ${[...new Set(sybgnMatches)].slice(0, 20).join(', ')}`)
      }

      // 找VR相关数据
      const vrMatches = html.match(/vrinfo['"]?\s*:\s*\[([^\]]+)\]/gi) ||
                        html.match(/pano['"]?\s*:\s*\{([^}]+)\}/gi) ||
                        html.match(/position['"]?\s*:\s*['"]([^'"]+)['"]/gi)
      if (vrMatches) {
        console.log('VR数据:', vrMatches.slice(0, 3))
      }

      // 找JSON数据
      const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?})\s*;?\s*<\/script>/is)
      if (jsonMatch) {
        console.log('找到__INITIAL_STATE__')
      }

    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }

  // 尝试直接访问VR页面
  console.log('\n\n=== 直接分析VR页面 ===')

  // 问界M8 某个spec的VR
  const specIds = ['72085', '72088', '73981']
  for (const specId of specIds) {
    const vrUrl = `https://pano.autohome.com.cn/car/ext/${specId}`
    console.log(`\nVR页面: ${vrUrl}`)
    try {
      const html = await fetchPage(vrUrl)
      console.log(`HTML长度: ${html.length}`)

      // 找globalConfig
      const gcMatch = html.match(/globalConfig\s*=\s*\{([^}]+)\}/i)
      if (gcMatch) {
        console.log(`globalConfig: {${gcMatch[1].slice(0, 100)}...`)
      }

      // 找color_info中的position
      const positionMatches = html.match(/position['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
      if (positionMatches.length > 0) {
        console.log(`找到position: ${positionMatches.slice(0, 10).join(', ')}`)
      }

      // 找ColorName
      const colorMatches = html.match(/ColorName['"]?\s*:\s*['"]([^'"]+)['"]/gi) || []
      if (colorMatches.length > 0) {
        console.log(`找到ColorName: ${colorMatches.slice(0, 10).join(', ')}`)
      }

    } catch (e) {
      console.log(`错误: ${e.message}`)
    }
  }
}

main().catch(console.error)
