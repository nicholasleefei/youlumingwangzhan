const base = 'http://localhost:22000/api'
const seriesId = Number(process.argv[2] || '6643')

async function main() {
  const r = await fetch(base + '/jobs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ seriesId, splitBySpec: false }),
  })
  const j = await r.json()
  const id = j?.data?.jobId
  if (!id) throw new Error('create failed')

  let last = null
  for (let i = 0; i < 240; i++) {
    const rr = await fetch(base + '/jobs/' + id)
    const jj = await rr.json()
    last = jj?.data
    if (last?.status === 'succeeded' || last?.status === 'failed') break
    await new Promise((r) => setTimeout(r, 1000))
  }

  const files = await (await fetch(base + '/jobs/' + id + '/files')).json()
  const root = files?.data?.root
  const logPath = `${root}/_logs/job.log`

  const log = await (await fetch(base + '/jobs/' + id + '/file?path=' + encodeURIComponent(logPath))).text()
  const lines = log.trim().split(/\r?\n/)
  console.log('jobId', id, 'status', last?.status, 'lines', lines.length)
  console.log(lines.slice(0, 10).join('\n'))
  console.log('...')
  console.log(lines.slice(-10).join('\n'))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

