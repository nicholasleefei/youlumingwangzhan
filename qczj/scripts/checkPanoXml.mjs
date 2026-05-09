const panoId = process.argv[2]
const intColorId = process.argv[3] || '-1'

if (!panoId) {
  console.error('Usage: node scripts/checkPanoXml.mjs <panoId> [intColorId]')
  process.exit(1)
}

const url = `https://pano.autohome.com.cn/car/pano/${panoId}.xml?v=20180831&paintingid=-1&intcolorid=${encodeURIComponent(intColorId)}&_sd=1`
const xml = await (await fetch(url)).text()

const tileserver = (xml.match(/tileserver=\"([^\"]+)\"/i) || [])[1] || ''
const startscene = (xml.match(/set\(startscene,'([^']+)'\)/) || [])[1] || ''

console.log(
  JSON.stringify(
    {
      url,
      len: xml.length,
      tileserver,
      startscene,
      sceneCount: (xml.match(/<scene\b/g) || []).length,
      urlTplCount: (xml.match(/url=\"[^\"]*\/vr\/pano_[^\"]+\"/g) || []).length,
    },
    null,
    2,
  ),
)
