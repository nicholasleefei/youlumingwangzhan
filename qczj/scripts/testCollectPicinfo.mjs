import path from 'path'
import { JobManager } from '../api/jobs/jobManager.ts'

const seriesId = Number(process.argv[2] || '7207')
const specId = Number(process.argv[3] || '77307')

const jm = new JobManager(path.join(process.cwd(), '.tmp_pp'))

const pp = await jm.fetchImglistPageProps(seriesId, specId)
const maxByKey = { exterior: 5, interior: 5, detail: 5, official: 5 }
const grouped = await jm.collectLimitedImagesFromImglistPicInfo(seriesId, specId, maxByKey)

console.log(
  JSON.stringify(
    {
      seriesId,
      specId,
      hasSeriesPic: Boolean(pp?.SeriesPicList),
      picinfoType: typeof pp?.SeriesPicList?.picinfo,
      grouped: {
        exterior: grouped.exterior.length,
        interior: grouped.interior.length,
        detail: grouped.detail.length,
        official: grouped.official.length,
      },
      sample: {
        exterior: grouped.exterior.slice(0, 2),
        interior: grouped.interior.slice(0, 2),
      },
    },
    null,
    2,
  ),
)

