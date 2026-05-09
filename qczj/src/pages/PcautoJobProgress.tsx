import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, AlertCircle, CheckCircle } from 'lucide-react'

interface JobStatus {
  id: string
  sgId: string
  seriesName: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  progress: number
  total: number
  success: number
  failed: number
  errors: Array<{ stage: string; message: string }>
}

export default function PcautoJobProgress() {
  const { jobId } = useParams<{ jobId: string }>()
  const [job, setJob] = useState<JobStatus | null>(null)
  const [logContent, setLogContent] = useState('')
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!jobId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/pcauto/status/${jobId}`)
        const json = await res.json()
        if (json.success) {
          setJob(json.data)
        }
      } catch (e) {
        console.error('poll error:', e)
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [jobId])

  useEffect(() => {
    if (!jobId) return

    const fetchLog = async () => {
      try {
        const res = await fetch(`/api/pcauto/log/${jobId}`)
        if (res.ok) {
          const text = await res.text()
          setLogContent(text)
        }
      } catch (e) {
        console.error('log error:', e)
      }
    }

    fetchLog()
    const interval = setInterval(fetchLog, 5000)
    return () => clearInterval(interval)
  }, [jobId])

  if (!job) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="text-zinc-400">加载中...</div>
      </div>
    )
  }

  const isRunning = job.status === 'running' || job.status === 'pending'

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center gap-4">
          <Link
            to="/pcauto"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <h1 className="text-lg font-semibold">{job.seriesName} - 下载进度</h1>
        </div>

        <div className="mt-6 grid gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {job.status === 'succeeded' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {job.status === 'failed' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                {isRunning && <Download className="h-5 w-5 animate-pulse text-blue-500" />}
                <span className="text-sm font-medium">
                  {job.status === 'pending' && '等待开始'}
                  {job.status === 'running' && '采集中...'}
                  {job.status === 'succeeded' && '已完成'}
                  {job.status === 'failed' && '失败'}
                </span>
              </div>
              <span className="text-sm text-zinc-400">
                {job.total > 0 ? `${job.success}/${job.total}` : '-'}
              </span>
            </div>

            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-xs text-zinc-400">{job.progress}%</div>
            </div>

            {job.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                {job.errors.map((err, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs text-red-200"
                  >
                    [{err.stage}] {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm font-medium">下载日志</div>
            <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-400 font-mono">
              {logContent || '暂无日志'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
