import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PcautoHome() {
  const nav = useNavigate()
  const [sgId, setSgId] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canStart = Boolean(sgId.trim() && seriesName.trim())

  const onStart = async () => {
    if (!canStart) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/pcauto/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sgId: sgId.trim(),
          seriesName: seriesName.trim(),
        }),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error || '创建任务失败')
        setLoading(false)
        return
      }

      nav(`/pcauto-jobs/${json.jobId}`)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">太平洋汽车网物料下载</h1>
            <p className="mt-2 text-sm text-zinc-300">
              输入车系组ID和车型名称，一键下载外观、内饰、空间、细节、VR等图片。
            </p>
          </div>
          <a
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
            href="/api/health"
            target="_blank"
            rel="noreferrer"
          >
            健康检查
          </a>
        </div>

        <div className="mt-8 grid gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm font-medium">创建下载任务</div>
            <div className="mt-1 text-xs text-zinc-400">
              在太平洋汽车网图片列表页面URL中可找到车系组ID（sg开头），例如 sg4550
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">车系组ID</label>
                <input
                  value={sgId}
                  onChange={(e) => setSgId(e.target.value)}
                  placeholder="例如：4550（不带sg前缀）"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">车型名称</label>
                <input
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  placeholder="例如：凯美瑞"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500',
                    loading && 'opacity-60 cursor-not-allowed',
                  )}
                  onClick={onStart}
                  disabled={loading || !canStart}
                >
                  <Download className="h-4 w-4" />
                  开始下载
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm font-medium">URL格式说明</div>
            <div className="mt-3 space-y-2 text-xs text-zinc-400">
              <div>
                <span className="text-zinc-200">太平洋汽车网图片列表URL：</span>
                <code className="ml-2 rounded bg-zinc-800 px-1">
                  https://price.pcauto.com.cn/cars/imglist/sg4550-2-o1.html
                </code>
              </div>
              <div className="mt-2">
                <span className="text-zinc-200">其中 sg4550 就是车系组ID</span>
              </div>
              <div className="mt-2">
                <span className="text-zinc-200">分类ID：</span>
                <span className="ml-2">1=外观，2=内饰，3=空间，4=细节，8=VR</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm font-medium">下载说明</div>
            <ul className="mt-2 space-y-1 text-xs text-zinc-400">
              <li>• 下载内容包括：外观图、内饰图、空间图、细节图、VR图</li>
              <li>• 图片会自动按分类保存到不同文件夹</li>
              <li>• 下载完成后可以打包为ZIP文件</li>
              <li>• 图片URL格式：img.pcauto.com.cn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
