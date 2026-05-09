import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createJob, getJob, isApiError, type Job } from '@/utils/api'
import { stageLabel } from '@/utils/stage'

function msToText(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m ? `${m}分${r}秒` : `${r}秒`
}

export default function JobResult() {
  const { jobId } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [err, setErr] = useState('')
  const [restarting, setRestarting] = useState(false)

  useEffect(() => {
    if (!jobId) return
    getJob(jobId)
      .then(({ json }) => {
        if (isApiError(json)) {
          setErr(json.error || '获取任务失败')
          return
        }
        setJob(json.data)
      })
      .catch((e) => setErr(String(e)))
  }, [jobId])

  const onRestart = async () => {
    if (!job?.seriesId) return
    setRestarting(true)
    try {
      const { json } = await createJob(job.seriesId, {
        splitBySpec: Boolean(job.splitBySpec),
        outputDir: job.outputDir || '',
      })
      if (isApiError(json)) {
        setErr(json.error || '重新下载失败')
        return
      }
      window.location.href = `/jobs/${json.data.jobId}`
    } catch (e) {
      setErr(String(e))
    } finally {
      setRestarting(false)
    }
  }

  if (!jobId) return <div className="p-6">缺少 jobId</div>

  const duration =
    job?.startedAt && job?.finishedAt ? msToText(job.finishedAt - job.startedAt) : ''

  const ok = job?.status === 'succeeded'

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
          <div className="text-xs text-zinc-500">{job ? stageLabel(job.stage) : ''}</div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-zinc-400">结果</div>
              <div className="mt-1 text-lg font-semibold tracking-tight">
                {job?.seriesName ? job.seriesName : `车系 ${job?.seriesId ?? ''}`}
              </div>
              <div className="mt-1 text-xs text-zinc-500">JobId：{jobId}</div>
            </div>
            <div
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                ok ? 'bg-emerald-950/40 text-emerald-200' : 'bg-red-950/50 text-red-200',
              )}
            >
              {ok ? '已完成' : '失败'}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
              <div className="text-xs text-zinc-500">耗时</div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {duration || '-'}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
              <div className="text-xs text-zinc-500">成功</div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {job?.progress.success ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
              <div className="text-xs text-zinc-500">失败</div>
              <div className="mt-1 text-sm font-semibold text-zinc-100">
                {job?.progress.failed ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-sm font-medium text-zinc-100">目录结构</div>
            <div className="mt-2 grid gap-1 text-xs text-zinc-400">
              <div>{'{年份}款_{车型配置名}/'}</div>
              <div>&nbsp;&nbsp;├── 外观图/</div>
              <div>&nbsp;&nbsp;├── 内饰图/</div>
              <div>&nbsp;&nbsp;├── 细节图/</div>
              <div>&nbsp;&nbsp;└── 品牌官方图/</div>
              <div>外观360VR/（按颜色子目录：颜色名_#RRGGBB）</div>
              <div>内饰360VR/（按内饰颜色子目录：颜色名_#RRGGBB-#RRGGBB/场景名/ 六面体贴图）</div>
              <div>_logs/job.log（任务日志）</div>
            </div>
          </div>

          {job?.workRoot ? (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-sm font-medium text-zinc-100">输出位置</div>
              <div className="mt-2 text-xs text-zinc-400 break-words">
                {(job.outputDirEffective || job.outputDir || '（工具数据目录）') + `\\${job.workRoot}`}
              </div>
              {job?.outputDir && job?.outputDirEffective && job.outputDir !== job.outputDirEffective ? (
                <div className="mt-2 text-xs text-amber-300">
                  已回退到可写目录（原 outputDir 无权限或不可写）：{job.outputDir}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {job?.workRoot ? (
              <a
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
                href={`/api/jobs/${encodeURIComponent(jobId)}/file?path=${encodeURIComponent(`${job.workRoot}/_logs/job.log`)}`}
                target="_blank"
                rel="noreferrer"
              >
                下载日志
              </a>
            ) : null}
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800',
                restarting && 'opacity-60',
              )}
              onClick={onRestart}
              disabled={restarting || !job?.seriesId}
            >
              <RotateCcw className="h-4 w-4" />
              重新下载
            </button>
          </div>

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
              <div className="mt-2 max-h-56 overflow-auto text-xs text-zinc-400">
                {job.errors
                  .slice(-50)
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
  )
}
