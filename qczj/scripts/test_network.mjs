import fetch from 'node-fetch'

const SERIES_TO_TEST = [
  { id: 8529, name: '问界M6' },
  { id: 110, name: '凯美瑞' },
  { id: 4471, name: '汉兰达' },
]

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        },
      })
      if (res.ok) {
        return res.text()
      }
      console.log(`  [${i + 1}] HTTP ${res.status}: ${url}`)
      await new Promise(r => setTimeout(r, 1500 * (i + 1)))
    } catch (e) {
      console.log(`  [${i + 1}] Error: ${e.message}`)
      await new Promise(r => setTimeout(r, 1500 * (i + 1)))
    }
  }
  return ''
}

async function testSeries(seriesId, seriesName) {
  console.log(`\n测试 ${seriesName} (seriesId=${seriesId})`)
  const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-x-x-x-x-1.html`
  console.log(`  URL: ${url}`)

  const html = await fetchWithRetry(url)
  if (!html) {
    console.log('  结果: 无法获取页面')
    return { success: false, reason: '无法获取页面' }
  }

  console.log(`  HTML长度: ${html.length}`)

  if (html.includes('被禁止访问') || html.includes('403')) {
    console.log('  结果: 被禁止访问')
    return { success: false, reason: '403 Forbidden' }
  }

  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
  if (!nextDataMatch) {
    console.log('  结果: 无法解析NEXT_DATA')
    console.log(`  前200字符: ${html.slice(0, 200)}`)
    return { success: false, reason: '无NEXT_DATA' }
  }

  try {
    const json = JSON.parse(nextDataMatch[1])
    const pp = json?.props?.pageProps
    if (!pp) {
      console.log('  结果: 无pageProps')
      return { success: false, reason: '无pageProps' }
    }

    const specList = pp?.specList || []
    let specCount = 0
    for (const year of specList) {
      specCount += (year.list || []).length
    }

    const vrinfo = pp?.SeriesPicList?.vrinfo || []
    console.log(`  结果: specs=${specCount} vrinfo=${vrinfo.length}条`)
    return { success: true, specs: specCount, vrinfo: vrinfo.length }
  } catch (e) {
    console.log(`  JSON解析错误: ${e.message}`)
    return { success: false, reason: 'JSON错误' }
  }
}

async function main() {
  console.log('汽车之家测试脚本')
  console.log('='.repeat(60))

  for (const series of SERIES_TO_TEST) {
    const result = await testSeries(series.id, series.name)
    console.log(`  状态: ${result.success ? 'OK' : 'FAIL'}`)
    await new Promise(r => setTimeout(r, 3000))
  }
}

main().catch(console.error)
