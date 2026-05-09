import { inputCls, labelCls, pageCardCls, primaryButtonCls, secondaryButtonCls, statusBadgeCls } from "@/admin/AdminApp";
import { RefreshCw, Search } from "lucide-react";
import type { BrandRow, SeriesRow } from "./query";

export default function FilterBar(props: {
  brands: BrandRow[];
  seriesOptions: SeriesRow[];
  onlyNormal: boolean;
  onlyHasImages: boolean;
  brandFilter: number | null;
  seriesFilter: number | null;
  keyword: string;
  loading: boolean;
  lastUpdatedAt: string;
  stats: { totalSeries: number; totalVrSeries: number; totalImageSeries: number };
  onChangeOnlyNormal: (v: boolean) => void;
  onChangeOnlyHasImages: (v: boolean) => void;
  onChangeBrand: (v: number | null) => void;
  onChangeSeries: (v: number | null) => void;
  onChangeKeyword: (v: string) => void;
  onQuery: () => void;
  onReset: () => void;
}) {
  const {
    brands,
    seriesOptions,
    onlyNormal,
    onlyHasImages,
    brandFilter,
    seriesFilter,
    keyword,
    loading,
    lastUpdatedAt,
    stats,
    onChangeOnlyNormal,
    onChangeOnlyHasImages,
    onChangeBrand,
    onChangeSeries,
    onChangeKeyword,
    onQuery,
    onReset,
  } = props;

  return (
    <div className={pageCardCls() + " p-6 mb-6"}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-semibold text-zinc-900">资源配置总览表</div>
          <div className="text-sm text-zinc-500">按品牌 / 车系汇总 VR 与图片资源覆盖情况，并支持行内删除。{lastUpdatedAt ? `上次刷新：${lastUpdatedAt}` : ""}</div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <label className={labelCls()}>品牌</label>
            <select value={brandFilter ?? ""} onChange={(e) => onChangeBrand(e.target.value ? Number(e.target.value) : null)} className={inputCls()}>
              <option value="">全部品牌</option>
              {brands
                .filter((b) => !onlyNormal || (b.activity_status ?? 0) === 0)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((b) => (
                  <option key={b.jm_id} value={b.jm_id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className={labelCls()}>车系</label>
            <select value={seriesFilter ?? ""} onChange={(e) => onChangeSeries(e.target.value ? Number(e.target.value) : null)} className={inputCls()}>
              <option value="">全部车系</option>
              {seriesOptions.map((s) => (
                <option key={s.jm_id} value={s.jm_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className={labelCls()}>关键字</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input value={keyword} onChange={(e) => onChangeKeyword(e.target.value)} placeholder="搜索品牌/车系" className={inputCls() + " pl-10"} />
            </div>
          </div>
          <div className="lg:col-span-2 flex items-end gap-2">
            <button type="button" onClick={onQuery} disabled={loading} className={primaryButtonCls() + " w-full gap-2"}>
              <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
              查询
            </button>
            <button type="button" onClick={onReset} className={secondaryButtonCls() + " px-4"}>
              重置
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={onlyNormal} onChange={(e) => onChangeOnlyNormal(e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
              仅展示状态正常
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={onlyHasImages}
                onChange={(e) => onChangeOnlyHasImages(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              仅显示有图（含VR）
            </label>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className={statusBadgeCls("default")}>车系：{stats.totalSeries}</span>
            <span className={statusBadgeCls("info")}>有VR：{stats.totalVrSeries}</span>
            <span className={statusBadgeCls("success")}>有图片：{stats.totalImageSeries}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
