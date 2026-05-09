import fetch from 'node-fetch'

const SERIES_TO_TEST = [
  { id: 8529, name: '问界M6' },
  { id: 110, name: '凯美瑞' },
  { id: 4471, name: '汉兰达' },
  { id: 2712, name: '奥迪A4L' },
  { id: 164, name: '宝马3系' },
  { id: 2235, name: '奔驰C级' },
  { id: 3167, name: '大众途观L' },
  { id: 4828, name: '本田CR-V' },
  { id: 2823, name: 'RAV4荣放' },
  { id: 3448, name: '别克GL8' },
]

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      })
      if (res.ok) {
        return res.text()
      }
      if (res.status === 404) {
        return ''
      }
      console.log(`  Retry ${i + 1}/${retries}: ${url} status=${res.status}`)
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    } catch (e) {
      console.log(`  Retry ${i + 1}/${retries}: ${url} error=${e.message}`)
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return ''
}

async function testSeries(seriesId, seriesName) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`测试 ${seriesName} (seriesId=${seriesId})`)
  console.log('='.repeat(60))

  const results = {
    specs: 0,
    types: 0,
    vrExterior: 0,
    vrInterior: 0,
    colors: 0,
    errors: [],
  }

  try {
    const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-x-x-x-x-1.html`
    const html = await fetchWithRetry(url)
    if (!html) {
      results.errors.push('无法获取页面')
      return results
    }

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
    if (!nextDataMatch) {
      results.errors.push('无法解析__NEXT_DATA__')
      return results
    }

    const json = JSON.parse(nextDataMatch[1])
    const pp = json?.props?.pageProps
    if (!pp) {
      results.errors.push('无法获取pageProps')
      return results
    }

    const specList = pp?.specList || []
    let specCount = 0
    for (const year of specList) {
      specCount += (year.list || []).length
    }
    results.specs = specCount
    console.log(`  车型数量: ${specCount}`)

    const typeList = pp?.typeList || []
    results.types = typeList.length
    console.log(`  类型数量: ${typeList.length}`)

    const vrinfo = pp?.SeriesPicList?.vrinfo || []
    console.log(`  VR信息: ${vrinfo.length}条`)
    for (const v of vrinfo) {
      console.log(`    type=${v.type} sepcid=${v.sepcid} url=${String(v.vrurl || '').replace(/\?.*/, '')}`)
    }

    let exteriorVrUrl = ''
    let interiorVrUrl = ''
    for (const v of vrinfo) {
      const url = String(v.vrurl || '')
      if (Number(v.type) === 1 && url.includes('/car/ext/')) exteriorVrUrl = url
      if (Number(v.type) === 2 && url.includes('/car/pano/')) interiorVrUrl = url
    }

    if (exteriorVrUrl) {
      const extIdMatch = exteriorVrUrl.match(/\/car\/ext\/(\d+)/i)
      if (extIdMatch) {
        const extSpecId = extIdMatch[1]
        const extPage = await fetchWithRetry(`https://pano.autohome.com.cn/car/ext/${extSpecId}`)
        if (extPage) {
          const globalConfigMatch = extPage.match(/globalConfig\s*=\s*\{[^}]*id\s*:\s*"?(\d+)"?/i)
          if (globalConfigMatch) {
            const extId = globalConfigMatch[1]
            const baseInfoUrl = `https://pano.autohome.com.cn/api/ext/baseinfo/${extId}?src=m&category=car&deviceId=`
            const baseInfoRes = await fetch(baseInfoUrl, { timeout: 15000 })
            if (baseInfoRes.ok) {
              const baseInfo = await baseInfoRes.json()
              if (baseInfo?.data?.color_info) {
                results.colors = baseInfo.data.color_info.length
                console.log(`  外观VR颜色数: ${results.colors}`)
              }
            }
          }
        }
      }
    }

    if (interiorVrUrl) {
      const interiorIdMatch = interiorVrUrl.match(/\/car\/pano\/(\d+)/i)
      if (interiorIdMatch) {
        const interiorId = interiorIdMatch[1]
        const xmlUrl = `https://pano.autohome.com.cn/car/pano/${interiorId}.xml?v=20180831&paintingid=-1&intcolorid=-1&_sd=1`
        const xml = await fetchWithRetry(xmlUrl)
        if (xml && xml.includes('<scene')) {
          const sceneMatches = xml.match(/<scene[^>]+name="([^"]+)"/gi) || []
          results.vrInterior = sceneMatches.length
          console.log(`  内饰VR场景数: ${results.vrInterior}`)
        }
      }
    }

    const picinfo = pp?.SeriesPicList?.picinfo
    let picCount = 0
    if (Array.isArray(picinfo)) {
      picCount = picinfo.length
    } else if (picinfo?.callist && Array.isArray(picinfo.callist)) {
      picCount = picinfo.callist.length
    }
    console.log(`  图片分类数: ${picCount}`)

  } catch (e) {
    results.errors.push(e.message)
    console.log(`  错误: ${e.message}`)
  }

  return results
}

async function main() {
  console.log('汽车之家下载工具测试')
  console.log('='.repeat(60))
  console.log(`测试 ${SERIES_TO_TEST.length} 个车系...`)
  console.log('='.repeat(60))

  const allResults = []

  for (const series of SERIES_TO_TEST) {
    const result = await testSeries(series.id, series.name)
    allResults.push({ series, result })
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('\n\n' + '='.repeat(60))
  console.log('测试结果汇总')
  console.log('='.repeat(60))

  let successCount = 0
  for (const { series, result } of allResults) {
    const hasErrors = result.errors.length > 0
    const hasVr = result.vrInterior > 0
    const status = hasErrors ? 'FAIL' : (hasVr ? 'OK' : 'WARN')
    console.log(`[${status}] ${series.name}: specs=${result.specs} types=${result.types} vrInt=${result.vrInterior}`)
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        console.log(`   - ${err}`)
      }
    }
    if (!hasErrors) successCount++
  }

  console.log('\n' + '='.repeat(60))
  console.log(`总计: ${successCount}/${allResults.length} 成功`)
  console.log('='.repeat(60))
}

main().catch(console.error)
