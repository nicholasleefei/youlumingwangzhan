import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCrawlerStore } from '@/store/useCrawlerStore'
import { createJob, getConfig, isApiError, searchSeries } from '@/utils/api'

function parseSeriesId(input: string): number | null {
  const v = input.trim()
  if (!v) return null
  if (!/^\d+$/.test(v)) return null
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export default function Home() {
  const nav = useNavigate()
  const [splitBySpec, setSplitBySpec] = useState(true)
  const [outputDir, setOutputDir] = useState('')
  const {
    query,
    setQuery,
    seriesIdInput,
    setSeriesIdInput,
    searching,
    setSearching,
    searchError,
    setSearchError,
    searchResults,
    setSearchResults,
    selectedSeriesId,
    selectSeries,
  } = useCrawlerStore()

  const seriesId = useMemo(() => parseSeriesId(seriesIdInput), [seriesIdInput])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { json } = await getConfig()
      if (cancelled) return
      if (isApiError(json)) return
      setOutputDir(json.data.defaultOutputDir)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const canStart = Boolean(seriesId)

  const onSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchError('')
    try {
      const { json } = await searchSeries(q)
      if (isApiError(json)) {
        setSearchError(json.error || '搜索失败')
        setSearchResults([])
        return
      }
      setSearchResults(json.data)
      if (json.data.length === 0) {
        setSearchError('没有找到结果，可改用“直接输入车系ID”')
      }
    } catch (e) {
      setSearchError(String(e))
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const onStart = async () => {
    if (!seriesId) return
    const { json } = await createJob(seriesId, {
      splitBySpec,
      outputDir,
    })
    if (isApiError(json)) {
      setSearchError(json.error || '创建任务失败')
      return
    }
    nav(`/jobs/${json.data.jobId}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">汽车之家车型物料下载</h1>
            <p className="mt-2 text-sm text-zinc-300">
              支持“品牌+车型”搜索选择车系，或直接输入车系ID，一键下载并打包 ZIP。
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">方式 A：搜索车系（推荐）</div>
                <div className="mt-1 text-xs text-zinc-400">
                  输入品牌 + 车型官方名称，例如“特斯拉 Model Y”
                </div>
              </div>
              <button
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-white',
                  searching && 'opacity-60',
                )}
                onClick={onSearch}
                disabled={searching || !query.trim()}
              >
                <Search className="h-4 w-4" />
                搜索车系
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例如：特斯拉 Model Y"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              {searchError ? (
                <div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  {searchError}
                </div>
              ) : null}
              {searchResults.length ? (
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <div className="max-h-64 overflow-auto bg-zinc-950">
                    {searchResults.map((item) => {
                      const selected = selectedSeriesId === item.seriesId
                      return (
                        <button
                          key={item.seriesId}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 border-b border-zinc-900 px-3 py-3 text-left hover:bg-zinc-900/60',
                            selected && 'bg-zinc-900',
                          )}
                          onClick={() => selectSeries(item)}
                        >
                          <div>
                            <div className="text-sm text-zinc-100">{item.name}</div>
                            <div className="mt-1 text-xs text-zinc-500">
                              车系ID：{item.seriesId}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-400">选择</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-center text-xs text-zinc-500">或</div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm font-medium">方式 B：直接输入车系ID</div>
            <div className="mt-1 text-xs text-zinc-400">
              从汽车之家 URL 复制，例如 5769
            </div>
            <div className="mt-4 grid gap-3">
              <input
                value={seriesIdInput}
                onChange={(e) => setSeriesIdInput(e.target.value)}
                placeholder="例如：5769"
                className={cn(
                  'w-full rounded-lg border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2',
                  seriesId ? 'border-zinc-800 focus:ring-zinc-400' : 'border-red-900/50 focus:ring-red-500/40',
                )}
              />
              {!seriesIdInput.trim() ? null : seriesId ? null : (
                <div className="text-xs text-red-200">车系ID 需为正整数</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="text-sm font-medium">下载设置</div>
            <div className="mt-1 text-xs text-zinc-400">默认写入项目目录下的 `downloads/`（可改）</div>
            <div className="mt-4 grid gap-3">
              <input
                value={outputDir}
                onChange={(e) => setOutputDir(e.target.value)}
                placeholder="例如：D:\\qczj_downloads"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <div className="text-xs text-zinc-500">
                修改为其他路径时需为绝对路径。
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <label className="mr-4 inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={splitBySpec}
                onChange={(e) => setSplitBySpec(e.target.checked)}
                className="h-4 w-4 rounded border border-zinc-700 bg-zinc-950"
              />
              按车型（配置）分文件夹
            </label>
            <button
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-300',
                !canStart && 'cursor-not-allowed opacity-50',
              )}
              onClick={onStart}
              disabled={!canStart}
            >
              <Download className="h-4 w-4" />
              开始下载
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="text-sm font-medium">其他平台</div>
          <div className="mt-3">
            <a
              href="/pcauto"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              太平洋汽车网下载
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
