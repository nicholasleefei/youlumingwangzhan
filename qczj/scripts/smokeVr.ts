import path from 'path'
import { JobManager } from '../api/jobs/jobManager.ts'

async function main() {
  const baseDir = path.join(process.cwd(), '.tmp_smoke')
  const jm = new JobManager(baseDir)

  const pp = await (jm as any).fetchImglistPageProps(6643, 73993)
  const vr = (jm as any).extractVrInfoFromImglistPageProps(pp)
  const colors = (jm as any).extractInteriorColorsFromImglistPageProps(pp)

  const panoIdMatch = String(vr?.interiorPanoUrl || '').match(/\/car\/pano\/(\d+)/i)
  const panoId = Number(panoIdMatch?.[1])
  const sampleXmlUrl = (jm as any).buildInteriorXmlUrl(panoId, colors?.[0]?.id || -1)

  const extId = await (jm as any).resolveExtIdFromSpecId(73993)
  const baseInfo = extId ? await (jm as any).fetchExtBaseInfo(extId) : null
  const exteriorItems = baseInfo ? (jm as any).buildExteriorVrItems(baseInfo, path.join(baseDir, 'vr_ext')) : []

  const xmlText = panoId ? (await (await fetch(sampleXmlUrl)).text()) : ''
  const interiorFaces = xmlText ? (jm as any).extractInteriorCubeFaceUrlsFromXml(xmlText) : []

  console.log(
    JSON.stringify(
      {
        vr,
        interiorColorCount: Array.isArray(colors) ? colors.length : 0,
        interiorColorSample: Array.isArray(colors) ? colors.slice(0, 4) : [],
        sampleXmlUrl,
        extId,
        exteriorItemCount: Array.isArray(exteriorItems) ? exteriorItems.length : 0,
        exteriorItemSample: Array.isArray(exteriorItems) ? exteriorItems.slice(0, 2) : [],
        interiorFaceCount: Array.isArray(interiorFaces) ? interiorFaces.length : 0,
        interiorFaceSample: Array.isArray(interiorFaces) ? interiorFaces.slice(0, 6) : [],
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
