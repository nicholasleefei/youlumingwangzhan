import { smallButtonCls, statusBadgeCls, tableContainerCls } from "@/admin/AdminApp";
import { Trash2 } from "lucide-react";
import type { OverviewRow } from "./query";

function sortCategoryPairs(categories: Record<string, number>) {
  return Object.entries(categories)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function statusDot(has: boolean) {
  return <span className={"inline-flex h-2.5 w-2.5 rounded-full " + (has ? "bg-green-500" : "bg-zinc-300")} />;
}

export default function OverviewTable(props: {
  loading: boolean;
  rows: OverviewRow[];
  deleteBusy: boolean;
  selectedSeriesIds: Set<number>;
  onToggleSeries: (seriesJmId: number) => void;
  onToggleAllVisible: (checked: boolean) => void;
  onOpenModels: (r: OverviewRow) => void;
  onOpenVrDetails: (r: OverviewRow) => void;
  onOpenDeleteVr: (r: OverviewRow) => void;
  onOpenDeleteImages: (r: OverviewRow) => void;
}) {
  const { loading, rows, deleteBusy, selectedSeriesIds, onToggleSeries, onToggleAllVisible, onOpenModels, onOpenVrDetails, onOpenDeleteVr, onOpenDeleteImages } = props;

  const allChecked = rows.length > 0 && rows.every((r) => selectedSeriesIds.has(r.seriesJmId));

  return (
    <div className={tableContainerCls()}>
      <div className="max-h-[560px] overflow-auto">
        <table className="min-w-full divide-y divide-zinc-200 bg-white">
          <thead className="sticky top-0 z-10 bg-zinc-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => onToggleAllVisible(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3">品牌</th>
              <th className="px-4 py-3">车系</th>
              <th className="px-4 py-3">车型数</th>
              <th className="px-4 py-3">VR</th>
              <th className="px-4 py-3">图片</th>
              <th className="px-4 py-3">图片分类统计</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4" colSpan={8}>
                    <div className="h-4 w-full rounded bg-zinc-100" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-zinc-500" colSpan={8}>
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const catPairs = sortCategoryPairs(r.images.categories);
                const shown = catPairs.slice(0, 3);
                const more = catPairs.length - shown.length;
                const hasImages = r.images.totalCount > 0;
                return (
                  <tr key={r.seriesJmId} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedSeriesIds.has(r.seriesJmId)}
                        onChange={() => onToggleSeries(r.seriesJmId)}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-900">{r.brandName}</td>
                    <td className="px-4 py-3 text-sm text-zinc-900">{r.seriesName}</td>
                    <td className="px-4 py-3 text-sm text-zinc-700">{r.modelCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          {statusDot(r.vr.totalImageCount > 0)}
                          <span className="text-zinc-700">{r.vr.totalImageCount > 0 ? `${r.vr.totalImageCount} 张` : "无"}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className={r.vr.hasExterior ? statusBadgeCls("info") : statusBadgeCls("default")}>
                            外观 {r.vr.exteriorGroupCount}组/{r.vr.exteriorImageCount}张
                          </span>
                          <span className={r.vr.hasInterior ? statusBadgeCls("info") : statusBadgeCls("default")}>
                            内饰 {r.vr.interiorColorCount}色/{r.vr.interiorImageCount}张
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          {statusDot(hasImages)}
                          <span className="text-zinc-700">{hasImages ? `${r.images.totalCount} 张` : "无"}</span>
                        </div>
                        <div className="text-xs text-zinc-500">覆盖车型 {r.images.modelWithAnyCount}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {shown.length === 0 ? <span className={statusBadgeCls("default")}>-</span> : null}
                        {shown.map(([k, v]) => (
                          <span key={k} className={statusBadgeCls("default")}>
                            {k} {v}
                          </span>
                        ))}
                        {more > 0 ? <span className={statusBadgeCls("default")}>+{more}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => onOpenModels(r)} className={smallButtonCls("secondary") + " gap-1"}>
                          车型
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenVrDetails(r)}
                          disabled={r.vr.totalImageCount === 0}
                          className={smallButtonCls("secondary") + " gap-1"}
                        >
                          VR明细
                        </button>
                        <button type="button" onClick={() => onOpenDeleteVr(r)} disabled={deleteBusy} className={smallButtonCls("danger") + " gap-1"}>
                          <Trash2 className="h-4 w-4" />
                          删除VR
                        </button>
                        <button type="button" onClick={() => onOpenDeleteImages(r)} disabled={deleteBusy} className={smallButtonCls("danger") + " gap-1"}>
                          <Trash2 className="h-4 w-4" />
                          删除图片
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
