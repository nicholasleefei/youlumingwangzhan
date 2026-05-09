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

export type JobProgress = {
  total: number
  done: number
  success: number
  failed: number
}

export type JobError = {
  at: string
  message: string
}

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
  progress: JobProgress
  errors: JobError[]
  createdAt: number
  startedAt?: number
  finishedAt?: number
  artifactPath?: string
}

export type SeriesSearchItem = {
  seriesId: number
  name: string
  url: string
  hint?: string
}
