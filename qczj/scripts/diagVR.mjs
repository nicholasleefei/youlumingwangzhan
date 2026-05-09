import fetch from 'node-fetch'

const SPEC_IDS = [74001, 74002, 74003]

async function testExtId(specId) {
  const url = `https://pano.autohome.com.cn/car/ext/${specId}`
  console.log(`\n=== ext/${specId} ===`)
  try {
    const res = await fetch(url, { timeout: 10000 })
    const text = await res.text()
    const m = text.match(/\/api\/visitext\?id=(\d+)/i) || text.match(/\/api\/ext\/baseinfo\/(\d+)/i)
    if (m?.[1]) {
      const extId = Number(m[1])
      console.log(`  extId found: ${extId}`)
      return extId
    }
    const gMatch = text.match(/var\s+globalConfig\s*=\s*\{[\s\S]*?id:\s*["']?(\d+)["']?/i)
    if (gMatch?.[1]) {
      console.log(`  globalConfig id: ${gMatch[1]}`)
      return Number(gMatch[1])
    }
    console.log(`  NO extId found, text length: ${text.length}`)
    console.log(`  text preview: ${text.substring(0, 200)}`)
    return null
  } catch (e) {
    console.log(`  ERROR: ${e.message}`)
    return null
  }
}

async function testBaseInfo(extId) {
  const url = `https://pano.autohome.com.cn/api/ext/baseinfo/${extId}?src=m&category=car&deviceId=`
  console.log(`\n=== baseinfo/${extId} ===`)
  try {
    const res = await fetch(url, { timeout: 10000 })
    const data = await res.json()
    const colorInfo = data?.color_info || []
    console.log(`  color_count: ${colorInfo.length}`)
    for (const c of colorInfo) {
      const frames = (c.Hori?.Normal || []).length
      console.log(`    ${c.ColorName} (${c.ColorValue}): ${frames} frames`)
    }
    return data
  } catch (e) {
    console.log(`  ERROR: ${e.message}`)
    return null
  }
}

async function testPano(specId) {
  const url = `https://pano.autohome.com.cn/car/ext/${specId}`
  console.log(`\n=== pano/${specId} ===`)
  try {
    const res = await fetch(url, { timeout: 10000 })
    const text = await res.text()
    const idMatch =
      text.match(/panourl:\s*"https?:\/\/pano\.autohome\.com\.cn\/car\/pano\/(\d+)"/i) ||
      text.match(/panourl:\s*"\/\/pano\.autohome\.com\.cn\/car\/pano\/(\d+)"/i) ||
      text.match(/\/car\/pano\/(\d+)\.xml/i) ||
      text.match(/\/car\/pano\/(\d+)/i)
    if (idMatch?.[1]) {
      const panoId = Number(idMatch[1])
      console.log(`  panoId found: ${panoId}`)
      return panoId
    }
    console.log(`  NO panoId found`)
    return null
  } catch (e) {
    console.log(`  ERROR: ${e.message}`)
    return null
  }
}

async function testXml(panoId) {
  const url = `https://pano.autohome.com.cn/car/pano/${panoId}.xml?v=20180831&paintingid=-1&intcolorid=-1&_sd=1`
  console.log(`\n=== xml/${panoId} ===`)
  try {
    const res = await fetch(url, { timeout: 10000 })
    const text = await res.text()
    const faceRe = /url="([^"]*\/vr\/pano_[^"]+)"/gi
    const faces = []
    let m
    while ((m = faceRe.exec(text))) faces.push(m[1])
    console.log(`  faces found: ${faces.length}`)
    const sceneRe = /<scene[^>]+name="([^"]+)"/gi
    const scenes = []
    while ((m = sceneRe.exec(text))) scenes.push(m[1])
    console.log(`  scenes: ${scenes.join(', ')}`)
    return faces.length
  } catch (e) {
    console.log(`  ERROR: ${e.message}`)
    return 0
  }
}

async function main() {
  for (const specId of SPEC_IDS) {
    console.log(`\n========== SPEC ${specId} ==========`)
    const extId = await testExtId(specId)
    if (extId) {
      await testBaseInfo(extId)
    }
    const panoId = await testPano(specId)
    if (panoId) {
      await testXml(panoId)
    }
  }
}

main().catch(console.error)
