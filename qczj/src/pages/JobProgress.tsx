import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getJob, isApiError, type Job } from '@/utils/api'
import { stageLabel } from '@/utils/stage'

function percent(done: number, total: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}

export default function JobProgress() {
  const { jobId } = useParams()
  const nav = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [err, setErr] = useState('')

  const p = useMemo(() => {
    if (!job) return 0
    return percent(job.progress.done, job.progress.total)
  }, [job])

  useEffect(() => {
    if (!jobId) return
    let stopped = false
    let es: EventSource | null = null
    let closing = false
    let pollTimer: number | null = null

    const poll = async () => {
      try {
        const { json } = await getJob(jobId)
        if (isApiError(json)) {
          setErr(json.error || '获取任务失败')
          return
        }
        if (stopped) return
        setJob(json.data)
        if (json.data.status === 'succeeded' || json.data.status === 'failed') {
          closing = true
          es?.close()
          es = null
          if (pollTimer) window.clearInterval(pollTimer)
          nav(`/jobs/${jobId}/result`, { replace: true })
        }
      } catch (e) {
        setErr(String(e))
      }
    }

    const startSse = () => {
      es = new EventSource(`/api/jobs/${encodeURIComponent(jobId)}/events`)
      es.addEventListener('job_update', (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as Job
          setJob(data)
          if (data.status === 'succeeded' || data.status === 'failed') {
            closing = true
            es?.close()
            es = null
            if (pollTimer) window.clearInterval(pollTimer)
            nav(`/jobs/${jobId}/result`, { replace: true })
          }
        } catch {
          setErr('进度事件解析失败')
        }
      })
      es.onerror = () => {
        if (closing || stopped) return
        if (pollTimer) return
        void poll()
        pollTimer = window.setInterval(poll, 1500)
      }
    }

    poll()
    startSse()

    return () => {
      stopped = true
      closing = true
      es?.close()
      if (pollTimer) window.clearInterval(pollTimer)
    }
  }, [jobId, nav])

  if (!jobId) {
    return <div className="p-6">缺少 jobId</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div />
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-zinc-400">任务</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">
                {job?.seriesName ? job.seriesName : `车系 ${job?.seriesId ?? ''}`}
              </div>
              <div className="mt-1 text-xs text-zinc-500">JobId：{jobId}</div>
            </div>
            <div
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                job?.status === 'failed'
                  ? 'bg-red-950/50 text-red-200'
                  : job?.status === 'succeeded'
                    ? 'bg-emerald-950/40 text-emerald-200'
                    : 'bg-zinc-950/50 text-zinc-200',
              )}
            >
              {job?.status === 'failed'
                ? '失败'
                : job?.status === 'succeeded'
                  ? '已完成'
                  : '进行中'}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <div className="inline-flex items-center gap-2">
                <Loader2 className={cn('h-4 w-4', job?.status === 'running' ? 'animate-spin' : '')} />
                {job ? stageLabel(job.stage) : '加载中'}
              </div>
              <div>
                {job
                  ? job.progress.total
                    ? `${job.progress.done}/${job.progress.total}（${p}%）`
                    : `已完成 ${job.progress.done}`
                  : ''}
              </div>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={cn(
                  'h-full rounded-full bg-emerald-400 transition-all',
                  job?.status === 'failed' && 'bg-red-400',
                )}
                style={{ width: `${p}%` }}
              />
            </div>

            {job ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                  <div className="text-xs text-zinc-500">成功</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-100">
                    {job.progress.success}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                  <div className="text-xs text-zinc-500">失败</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-100">
                    {job.progress.failed}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                  <div className="text-xs text-zinc-500">总计</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-100">
                    {job.progress.total}
                  </div>
                </div>
              </div>
            ) : null}

            {err ? (
              <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {err}
              </div>
            ) : null}

            {job?.errors?.length ? (
              <details className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                <summary className="cursor-pointer text-xs text-zinc-300">
                  查看错误（{job.errors.length}）
                </summary>
                <div className="mt-2 max-h-48 overflow-auto text-xs text-zinc-400">
                  {job.errors
                    .slice(-20)
                    .reverse()
                    .map((e, idx) => (
                      <div key={idx} className="border-t border-zinc-900 py-2">
                        <div className="text-zinc-300">[{e.at}]</div>
                        <div className="mt-1 break-words">{e.message}</div>
                      </div>
                    ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
