const url = process.argv[2]

if (!url) {
  console.error('Usage: node scripts/inspectImglist.mjs <imglistUrl>')
  process.exit(1)
}

const res = await fetch(url)
const html = await res.text()

const idx = html.indexOf('__NEXT_DATA__')
if (idx < 0) {
  console.error('No __NEXT_DATA__ found')
  process.exit(2)
}

const gt = html.indexOf('>', idx)
const end = html.indexOf('</script>', gt)
const raw = html.slice(gt + 1, end).trim()
const rawPanoIds = Array.from(
  new Set(
    (raw.match(/pano\.autohome\.com\.cn\\\/car\\\/(?:ext|pano)\\\/(\d+)/g) || []).map((s) => {
      const m = s.match(/(\d+)/)
      return m ? Number(m[1]) : null
    }),
  ),
).filter((n) => Number.isFinite(n) && n > 0)

const next = JSON.parse(raw)
const pp = next?.props?.pageProps

const pagePropsKeys = pp ? Object.keys(pp).sort() : []

const seriesId = pp?.params?.seriesId
const params = pp?.params || null
const specYears = Array.isArray(pp?.specList) ? pp.specList.length : 0
const typeCount = Array.isArray(pp?.typeList) ? pp.typeList.length : 0
const seriesList = pp?.seriesList?.list || []

const vrpaths = Array.from(new Set(seriesList.map((x) => x?.vrpath).filter(Boolean)))
const panoLinks = Array.from(
  new Set(
    (html.match(/https?:\/\/pano\.autohome\.com\.cn\/car\/(?:ext|pano)\/\d+[^"\s<]*/g) || []).map(
      (s) => s.trim(),
    ),
  ),
)

const summarize = (v) => {
  if (!v) return null
  if (Array.isArray(v)) return { kind: 'array', length: v.length }
  if (typeof v !== 'object') return { kind: typeof v }
  const keys = Object.keys(v).sort()
  const out = { kind: 'object', keys: keys.slice(0, 40) }
  if ('list' in v && Array.isArray(v.list)) out.listLength = v.list.length
  if ('total' in v && (typeof v.total === 'number' || typeof v.total === 'string')) out.total = v.total
  return out
}

console.log(
  JSON.stringify(
    {
      fetchedUrl: res.url,
      status: res.status,
      seriesId,
      page: next?.page,
      params,
      pagePropsKeys,
      specYears,
      typeCount,
      seriesListCount: seriesList.length,
      vrpathCount: vrpaths.length,
      vrpaths: vrpaths.slice(0, 20),
      htmlPanoLinkCount: panoLinks.length,
      htmlPanoLinks: panoLinks.slice(0, 40),
      nextRawPanoIdCount: rawPanoIds.length,
      nextRawPanoIds: rawPanoIds.slice(0, 40),
      hasSpecPicList: Boolean(pp?.SpecPicList),
      specPicListType: Array.isArray(pp?.SpecPicList) ? 'array' : typeof pp?.SpecPicList,
      specPicListSummary: summarize(pp?.SpecPicList),
      hasSeriesPicList: Boolean(pp?.SeriesPicList),
      seriesPicListType: Array.isArray(pp?.SeriesPicList) ? 'array' : typeof pp?.SeriesPicList,
      seriesPicListSummary: summarize(pp?.SeriesPicList),
    },
    null,
    2,
  ),
)
