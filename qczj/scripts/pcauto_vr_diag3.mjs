import fetch from 'node-fetch'
import iconv from 'iconv-lite'

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
  console.log('=== 太平洋汽车网VR分析 ===\n')

  // 测试VR页面
  const url = 'https://price.pcauto.com.cn/cars/imglist/sg44890-8-o1.html'
  console.log(`请求: ${url}`)

  const html = await fetchPage(url)
  console.log(`HTML: ${html.slice(0, 500)}...`)

  // 检查是否是API返回的结构
  if (html.includes('sybgn')) {
    console.log('\n=== 找到sybgn标签 ===')
    const matches = html.match(/sybgn\d+/gi) || []
    const unique = [...new Set(matches)]
    console.log(`唯一标签 (${unique.length}):`, unique.slice(0, 20))
  }

  // 测试直接用img标签获取
  console.log('\n=== 测试img标签格式 ===')
  const imgUrl = 'https://img.pcauto.com.cn/pano/g33/M00/03/3A/sybgn44890_ChxpVWldyDWAJMIWADD3GtOKb4Q079.jpg'
  console.log(`URL: ${imgUrl}`)
  console.log(`标签: sybgn44890 - 应该是内饰VR的位置1`)
}

main().catch(e => console.error('脚本错误:', e.message))
