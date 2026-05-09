import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { supabase } from "@/utils/supabaseClient";
import { statusBadgeCls, tableContainerCls } from "@/admin/AdminApp";
import { countSeriesVrImages, safeStringArrayLen, type SeriesVrConfigRow } from "@/utils/resourceOverview";

type ExteriorGroup = { id: string; color_name: string; images: string[] };
type InteriorPosition = { id: string; position_name: string; images: string[] };
type InteriorColor = { id: string; color_name: string; positions: InteriorPosition[] };

function normalizeExterior(v: unknown): ExteriorGroup[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((g: any) => ({
      id: String(g?.id ?? ""),
      color_name: String(g?.color_name ?? ""),
      images: Array.isArray(g?.images) ? g.images.filter((x: any) => typeof x === "string" && x.trim()) : [],
    }))
    .filter((g) => g.id && g.color_name);
}

function normalizeInterior(v: unknown): InteriorColor[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((c: any) => ({
      id: String(c?.id ?? ""),
      color_name: String(c?.color_name ?? ""),
      positions: Array.isArray(c?.positions)
        ? c.positions
            .map((p: any) => ({
              id: String(p?.id ?? ""),
              position_name: String(p?.position_name ?? ""),
              images: Array.isArray(p?.images) ? p.images.filter((x: any) => typeof x === "string" && x.trim()) : [],
            }))
            .filter((p: InteriorPosition) => p.id && p.position_name)
        : [],
    }))
    .filter((c: InteriorColor) => c.id && c.color_name);
}

export default function SeriesVrDetailsModal(props: {
  open: boolean;
  seriesJmId: number | null;
  title: string;
  onClose: () => void;
}) {
  const { open, seriesJmId, title, onClose } = props;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cfg, setCfg] = useState<SeriesVrConfigRow | null>(null);

  useEffect(() => {
    if (!open || !seriesJmId) return;
    setBusy(true);
    setError(null);
    setCfg(null);
    supabase
      .from("series_vr_config")
      .select("id, series_jm_id, brand_jm_id, brand_name, series_name, exterior_vr, interior_vr")
      .eq("series_jm_id", seriesJmId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        setCfg((data as any) ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载VR明细失败"))
      .finally(() => setBusy(false));
  }, [open, seriesJmId]);

  const exterior = useMemo(() => normalizeExterior(cfg?.exterior_vr), [cfg?.exterior_vr]);
  const interior = useMemo(() => normalizeInterior(cfg?.interior_vr), [cfg?.interior_vr]);
  const stats = useMemo(() => countSeriesVrImages(cfg), [cfg]);

  const interiorRows = useMemo(() => {
    const out: Array<{ color_name: string; position_name: string; count: number }> = [];
    for (const c of interior) {
      if (c.positions.length === 0) out.push({ color_name: c.color_name, position_name: "-", count: 0 });
      for (const p of c.positions) {
        out.push({ color_name: c.color_name, position_name: p.position_name, count: safeStringArrayLen(p.images) });
      }
    }
    return out;
  }, [interior]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
    >
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
          <span className={stats.hasExterior ? statusBadgeCls("info") : statusBadgeCls("default")}>
            外观：{stats.exteriorGroupCount} 组 / {stats.exteriorImageCount} 张
          </span>
          <span className={stats.hasInterior ? statusBadgeCls("info") : statusBadgeCls("default")}>
            内饰：{stats.interiorColorCount} 色 / {stats.interiorImageCount} 张
          </span>
          <span className={stats.totalImageCount > 0 ? statusBadgeCls("success") : statusBadgeCls("default")}>
            合计：{stats.totalImageCount} 张
          </span>
        </div>

        {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {busy ? (
          <div className="animate-pulse">
            <div className="h-4 w-full rounded bg-zinc-100" />
            <div className="mt-3 h-4 w-5/6 rounded bg-zinc-100" />
            <div className="mt-3 h-4 w-2/3 rounded bg-zinc-100" />
          </div>
        ) : !cfg ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">暂无VR配置</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-900">外观 VR（按组）</div>
              <div className={tableContainerCls()}>
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full divide-y divide-zinc-200 bg-white">
                    <thead className="sticky top-0 z-10 bg-zinc-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        <th className="px-4 py-3">组名</th>
                        <th className="px-4 py-3">图片数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {exterior.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-sm text-zinc-500">
                            暂无数据
                          </td>
                        </tr>
                      ) : (
                        exterior.map((g) => (
                          <tr key={g.id} className="hover:bg-zinc-50">
                            <td className="px-4 py-3 text-sm text-zinc-900">{g.color_name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-700">{safeStringArrayLen(g.images)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-900">内饰 VR（按颜色 / 位置）</div>
              <div className={tableContainerCls()}>
                <div className="max-h-[420px] overflow-auto">
                  <table className="min-w-full divide-y divide-zinc-200 bg-white">
                    <thead className="sticky top-0 z-10 bg-zinc-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        <th className="px-4 py-3">颜色</th>
                        <th className="px-4 py-3">位置</th>
                        <th className="px-4 py-3">图片数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {interiorRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-zinc-500">
                            暂无数据
                          </td>
                        </tr>
                      ) : (
                        interiorRows.map((r, idx) => (
                          <tr key={`${r.color_name}-${r.position_name}-${idx}`} className="hover:bg-zinc-50">
                            <td className="px-4 py-3 text-sm text-zinc-900">{r.color_name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-700">{r.position_name}</td>
                            <td className="px-4 py-3 text-sm text-zinc-700">{r.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

