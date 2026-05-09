const seriesId = Number(process.argv[2])
const specIdArg = process.argv[3]

if (!Number.isFinite(seriesId) || seriesId <= 0) {
  console.error('Usage: node scripts/inspectPageProps.mjs <seriesId> [specId|x]')
  process.exit(1)
}

const specPart = specIdArg && specIdArg !== 'x' ? String(Number(specIdArg)) : 'x'
const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-${specPart}-x-x-x-x-x-1.html`

const html = await (await fetch(url)).text()
const idx = html.indexOf('__NEXT_DATA__')
const gt = html.indexOf('>', idx)
const end = html.indexOf('</script>', gt)
const next = JSON.parse(html.slice(gt + 1, end))

const pp = next?.props?.pageProps
const keys = Object.keys(pp || {}).sort()

const seriesPic = pp?.SeriesPicList
const specPic = pp?.SpecPicList
const sPicinfo = seriesPic?.picinfo
const pPicinfo = specPic?.picinfo
const sVr = seriesPic?.vrinfo
const pVr = specPic?.vrinfo

console.log(
  JSON.stringify(
    {
      url,
      page: next?.page,
      pagePropsKeys: keys,
      specListFirst: pp?.specList?.[0]?.list?.[0]?.specid || null,
      SeriesPicListKeys: seriesPic ? Object.keys(seriesPic) : null,
      SpecPicListKeys: specPic ? Object.keys(specPic) : null,
      SeriesPicListPicinfo: Array.isArray(sPicinfo)
        ? { len: sPicinfo.length, names: sPicinfo.map((x) => x?.name).slice(0, 20) }
        : { type: typeof sPicinfo },
      SpecPicListPicinfo: Array.isArray(pPicinfo)
        ? { len: pPicinfo.length, names: pPicinfo.map((x) => x?.name).slice(0, 20) }
        : { type: typeof pPicinfo },
      SeriesPicListVrinfo: Array.isArray(sVr) ? { len: sVr.length, sample: sVr.slice(0, 4) } : { type: typeof sVr },
      SpecPicListVrinfo: Array.isArray(pVr) ? { len: pVr.length, sample: pVr.slice(0, 4) } : { type: typeof pVr },
    },
    null,
    2,
  ),
)

