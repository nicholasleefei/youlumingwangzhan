export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function isApiError<T>(r: ApiResponse<T>): r is { success: false; error: string } {
  return r.success === false
}

export type SeriesSearchItem = {
  seriesId: number
  name: string
  url: string
  hint?: string
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export type JobStage =
  | 'init'
  | 'resolve_series'
  | 'collect_links'
  | 'collect_images'
  | 'download_images'
  | 'collect_vr'
  | 'download_vr'
  | 'done'

export type Job = {
  id: string
  seriesId: number
  seriesName: string
  splitBySpec?: boolean
  outputDir?: string
  outputDirEffective?: string
  workRoot?: string
  status: JobStatus
  stage: JobStage
  progress: { total: number; done: number; success: number; failed: number }
  errors: Array<{ at: string; message: string }>
  createdAt: number
  startedAt?: number
  finishedAt?: number
  artifactPath?: string
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init)
  const json = (await res.json()) as ApiResponse<T>
  return { ok: res.ok, json }
}

export async function searchSeries(q: string) {
  return requestJson<SeriesSearchItem[]>(
    `/api/series/search?q=${encodeURIComponent(q)}`,
  )
}

export async function createJob(
  seriesId: number,
  opts?: { splitBySpec?: boolean; outputDir?: string },
) {
  return requestJson<{ jobId: string }>(`/api/jobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      seriesId,
      splitBySpec: Boolean(opts?.splitBySpec),
      outputDir: typeof opts?.outputDir === 'string' ? opts?.outputDir : '',
    }),
  })
}

export async function listJobFiles(jobId: string) {
  return requestJson<{ root: string; files: Array<{ path: string; size: number }> }>(
    `/api/jobs/${encodeURIComponent(jobId)}/files`,
  )
}

export async function getConfig() {
  return requestJson<{ defaultOutputDir: string }>(`/api/config`)
}

export async function getJob(jobId: string) {
  return requestJson<Job>(`/api/jobs/${encodeURIComponent(jobId)}`)
}
