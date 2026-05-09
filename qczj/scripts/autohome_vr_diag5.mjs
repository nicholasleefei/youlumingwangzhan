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
  console.log('=== 汽车之家VR图片URL标签分析 ===\n')

  // 用户提供的标签格式
  const tags = ['44890', '44891', '44892', '46714', '46715', '46716']
  console.log('标签:', tags.join(', '))

  // 搜索汽车之家VR图片URL格式
  console.log('\n=== 分析汽车之家VR图片URL ===')

  // 问界M8 spec 72085 外观VR baseinfo
  const extId = '5771'  // 从之前诊断知道
  const extUrl = `https://pano.autohome.com.cn/api/ext/baseinfo/${extId}?src=m&category=car&deviceId=`
  console.log(`\n外观VR API: ${extUrl}`)

  try {
    const resp = await fetchPage(extUrl)
    console.log(`响应长度: ${resp.length}`)

    const data = JSON.parse(resp)
    if (data.result) {
      const info = data.result
      console.log(`image_root: ${info.image_root}`)

      // 提取颜色和图片
      const colorInfo = info.color_info || []
      console.log(`颜色数量: ${colorInfo.length}`)

      for (const c of colorInfo.slice(0, 2)) {
        console.log(`\n颜色: ${c.ColorName}`)
        const frames = c.Hori?.Normal || []
        console.log(`  图片数量: ${frames.length}`)
        for (const f of frames.slice(0, 3)) {
          console.log(`    Seq=${f.Seq}, Url=${f.Url}`)
        }
      }
    }

  } catch (e) {
    console.log(`错误: ${e.message}`)
  }

  // 内饰VR XML
  console.log('\n\n=== 内饰VR XML分析 ===')
  const xmlUrl = 'https://pano.autohome.com.cn/car/pano/72085.xml?v=20180831&paintingid=-1&intcolorid=-1&_sd=1'
  console.log(`\n${xmlUrl}`)

  try {
    const xml = await fetchPage(xmlUrl)
    console.log(`XML长度: ${xml.length}`)

    // 提取scene名称和url
    const sceneRe = /<scene[^>]+name="([^"]+)"[\s\S]*?<\/scene>/gi
    let m
    let count = 0
    while ((m = sceneRe.exec(xml)) && count < 10) {
      const sceneName = m[1]
      const block = m[0]
      const urls = block.match(/url="([^"]+)"/gi) || []
      console.log(`\n场景: ${sceneName}`)
      console.log(`  URL数量: ${urls.length}`)
      if (urls.length > 0) {
        console.log(`  示例: ${urls[0]}`)
      }
      count++
    }

  } catch (e) {
    console.log(`错误: ${e.message}`)
  }

  // 搜索VR图片URL中是否有标签
  console.log('\n\n=== 搜索VR图片URL中的标签 ===')

  // 直接测试一个VR图片URL
  const testUrls = [
    'https://panovr.autoimg.cn/pano/g33/M00/03/3A/0x0_autohomecar__ChxpVWldyDWAJMIWADD3GtOKb4Q079.png',
    'https://img3.autoimg.cn/pano/g31/M0B/D0/01/400x0_autohomecar__ChxoHWfqVieAb_bMAAIrkxw642E818.jpg',
  ]

  for (const url of testUrls) {
    console.log(`\n${url}`)
    const hasSybn = url.includes('sybgn') || url.includes('symbol')
    console.log(`包含sybgn/sybn: ${hasSybn}`)
  }

  // 用户提供的标签是否可能是图片文件名的一部分？
  console.log('\n\n=== 用户标签分析 ===')
  console.log('用户提供的标签: sybgn44890, sybgn44891, sybgn44892, sybgn46714, sybgn46715, sybgn46716')
  console.log('这些标签格式: sybgn + 数字ID')
  console.log('可能是太平洋汽车网格式，而不是汽车之家')

  // 差值分析
  console.log('\n标签差值:')
  for (let i = 1; i < tags.length; i++) {
    const diff = parseInt(tags[i]) - parseInt(tags[i - 1])
    console.log(`  ${tags[i - 1]} -> ${tags[i]}: ${diff}`)
  }

  console.log('\n=== 建议的命名方案 ===')
  console.log('由于无法从页面获取实际位置名称，建议：')
  console.log('1. 使用标签ID作为文件夹名称的一部分')
  console.log('2. 或者根据标签分组命名（如 组1, 组2）')
  console.log('3. 或者直接使用序号（如 视角1, 视角2）')
}

main().catch(console.error)
