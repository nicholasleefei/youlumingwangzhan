import { useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { inputCls, primaryButtonCls, smallButtonCls, statusBadgeCls, tableContainerCls } from "@/admin/AdminApp";
import { RefreshCw, Search } from "lucide-react";

function sortCategoryPairs(categories: Record<string, number>) {
  return Object.entries(categories)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export default function SeriesModelCoverageModal(props: {
  open: boolean;
  title: string;
  busy: boolean;
  error: string | null;
  search: string;
  onChangeSearch: (v: string) => void;
  onRefresh: () => void;
  onClose: () => void;
  rows: Array<{ jm_id: number; name: string; source: "car_pictures" | "model_image_config" | "none"; total: number; categories: Record<string, number> }>;
  onDeleteModel: (m: { jm_id: number; name: string }) => void;
}) {
  const { open, title, busy, error, search, onChangeSearch, onRefresh, onClose, rows, onDeleteModel } = props;

  const filtered = useMemo(() => {
    const kw = search.trim();
    if (!kw) return rows;
    return rows.filter((m) => m.name.includes(kw) || String(m.jm_id).includes(kw));
  }, [rows, search]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
    >
      <div className="p-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder="搜索车型名 / jm_id"
                className={inputCls() + " pl-10"}
              />
            </div>
          </div>
          <button type="button" onClick={onRefresh} disabled={busy} className={primaryButtonCls() + " gap-2"}>
            <RefreshCw className={"h-4 w-4 " + (busy ? "animate-spin" : "")} />
            刷新
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className={tableContainerCls()}>
          <div className="max-h-[520px] overflow-auto">
            <table className="min-w-full divide-y divide-zinc-200 bg-white">
              <thead className="sticky top-0 z-10 bg-zinc-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">车型</th>
                  <th className="px-4 py-3">jm_id</th>
                  <th className="px-4 py-3">来源</th>
                  <th className="px-4 py-3">分类</th>
                  <th className="px-4 py-3">合计</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {busy ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4" colSpan={6}>
                        <div className="h-4 w-full rounded bg-zinc-100" />
                      </td>
                    </tr>
                  ))
                  ) : filtered.length === 0 ? (
                  <tr>
                      <td className="px-4 py-10 text-center text-sm text-zinc-500" colSpan={6}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => {
                    const catPairs = sortCategoryPairs(m.categories);
                    const shown = catPairs.slice(0, 4);
                    const more = catPairs.length - shown.length;
                    const sourceLabel =
                      m.source === "car_pictures" ? "car_pictures" : m.source === "model_image_config" ? "model_image_config" : "-";
                    return (
                      <tr key={m.jm_id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-sm text-zinc-900">{m.name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{m.jm_id}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{sourceLabel}</td>
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
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{m.total}</td>
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => onDeleteModel({ jm_id: m.jm_id, name: m.name })} className={smallButtonCls("danger")}>
                            删除图片
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
