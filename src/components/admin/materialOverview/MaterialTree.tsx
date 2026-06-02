import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ActivityStatusPills from "@/components/admin/materialOverview/ActivityStatusPills";
import AssetStatusChip from "@/components/admin/materialOverview/AssetStatusChip";
import type { DbBrand, DbModel, DbSeries, NodeKey, NodeType } from "@/components/admin/materialOverview/types";
import { nodeKey } from "@/components/admin/materialOverview/types";

function presentState(present: boolean) {
  return present ? ("present" as const) : ("missing" as const);
}

export default function MaterialTree(props: {
  onlyNormal?: boolean;
  brands: DbBrand[];
  expandedBrands: Set<number>;
  expandedSeries: Set<number>;
  getSeriesForBrand: (brandJmId: number) => DbSeries[];
  getModelsForSeries: (seriesJmId: number) => DbModel[];
  getSeriesAssetStatus: (seriesJmId: number) => { hasExteriorVr: boolean; hasInteriorVr: boolean; hasOfficial: boolean };
  getModelAssetStatus: (modelJmId: number) => { hasExteriorImages: boolean; hasInteriorImages: boolean; hasDetails: boolean };
  getModelHotSale: (modelJmId: number) => boolean;
  onConfigureSeries: (brand: DbBrand, series: DbSeries) => void;
  onConfigureModel: (brand: DbBrand, series: DbSeries, model: DbModel) => void;
  onToggleBrand: (brandJmId: number) => void;
  onToggleSeries: (seriesJmId: number) => void;
  selected: Set<NodeKey>;
  onNodeClick: (e: React.MouseEvent, key: NodeKey, parentKey: string, siblings: NodeKey[]) => void;
  onNodeContextMenu: (e: React.MouseEvent, key: NodeKey, parentKey: string) => void;
  onSetSingleStatus: (type: NodeType, id: string, status: number) => void;
  onSetModelHotSale: (modelJmId: number, hot: boolean) => void;
  onDeleteSeriesAsset: (seriesKey: NodeKey, series: DbSeries, kind: "exterior_vr" | "interior_vr" | "official_images") => void;
  onDeleteModelImages: (modelKey: NodeKey, model: DbModel, kind: "exterior" | "interior") => void;
  onClearSelection: () => void;
  brandChecked: Set<string>;
  onToggleBrandCheck: (brandId: string) => void;
}) {
  const {
    onlyNormal,
    brands,
    expandedBrands,
    expandedSeries,
    getSeriesForBrand,
    getModelsForSeries,
    getSeriesAssetStatus,
    getModelAssetStatus,
    getModelHotSale,
    onConfigureSeries,
    onConfigureModel,
    onToggleBrand,
    onToggleSeries,
    selected,
    onNodeClick,
    onNodeContextMenu,
    onSetSingleStatus,
    onSetModelHotSale,
    onDeleteSeriesAsset,
    onDeleteModelImages,
    onClearSelection,
    brandChecked,
    onToggleBrandCheck,
  } = props;

  const showOnlyNormal = onlyNormal ?? false;
  const isNormal = (x: { activity_status?: number | null }) => (x.activity_status ?? 0) === 0;
  const visibleBrands = showOnlyNormal ? brands.filter(isNormal) : brands;

  const rowCls = (active: boolean) =>
    "flex w-full items-start justify-between gap-4 rounded-xl border px-3 py-3 transition-colors " +
    (active ? "border-blue-200 bg-blue-50" : "border-zinc-200 bg-white hover:bg-zinc-50");

  const leftCls = "flex min-w-0 items-center gap-2";

  const brandKeys = useMemo(() => visibleBrands.map((b) => nodeKey("brand", b.id)), [visibleBrands]);

  const seriesKeysByBrand = useMemo(() => {
    const m = new Map<number, NodeKey[]>();
    for (const b of visibleBrands) {
      const seriesRows = showOnlyNormal ? getSeriesForBrand(b.jm_id).filter(isNormal) : getSeriesForBrand(b.jm_id);
      const sKeys = seriesRows.map((s) => nodeKey("series", s.id));
      m.set(b.jm_id, sKeys);
    }
    return m;
  }, [getSeriesForBrand, showOnlyNormal, visibleBrands]);

  const modelKeysBySeries = useMemo(() => {
    const m = new Map<number, NodeKey[]>();
    for (const b of visibleBrands) {
      const seriesRows = showOnlyNormal ? getSeriesForBrand(b.jm_id).filter(isNormal) : getSeriesForBrand(b.jm_id);
      for (const s of seriesRows) {
        const modelRows = showOnlyNormal ? getModelsForSeries(s.jm_id).filter(isNormal) : getModelsForSeries(s.jm_id);
        const keys = modelRows.map((x) => nodeKey("model", x.id));
        m.set(s.jm_id, keys);
      }
    }
    return m;
  }, [getModelsForSeries, getSeriesForBrand, showOnlyNormal, visibleBrands]);

  return (
    <div
      className="space-y-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClearSelection();
      }}
    >
      {visibleBrands.map((b) => {
        const bKey = nodeKey("brand", b.id);
        const brandExpanded = expandedBrands.has(b.jm_id);
        const bSelected = selected.has(bKey);
        const brandSiblings = brandKeys;
        const seriesRows = showOnlyNormal ? getSeriesForBrand(b.jm_id).filter(isNormal) : getSeriesForBrand(b.jm_id);
        const seriesSiblings = seriesKeysByBrand.get(b.jm_id) || [];

        return (
          <div key={bKey} className="space-y-2">
            <div
              className={rowCls(bSelected)}
            >
              {/* Brand checkbox */}
              <input
                type="checkbox"
                checked={brandChecked.has(b.id)}
                onChange={() => onToggleBrandCheck(b.id)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 rounded border-zinc-300 text-blue-600"
              />
              <div
                className="flex-1 cursor-pointer"
                onClick={(e) => onNodeClick(e, bKey, "root", brandSiblings)}
                onContextMenu={(e) => onNodeContextMenu(e, bKey, "root")}
              >
              <div className={leftCls}>
                <button
                  type="button"
                  className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBrand(b.jm_id);
                  }}
                  aria-label={brandExpanded ? "收起品牌" : "展开品牌"}
                >
                  {brandExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">{b.name}</div>
                  <div className="text-xs text-zinc-500">品牌 · {b.jm_id}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ActivityStatusPills value={b.activity_status} onChange={(st) => onSetSingleStatus("brand", b.id, st)} />
              </div>
            </div>
            </div>

            {brandExpanded ? (
              <div className="pl-10 space-y-2">
                {seriesRows.map((s) => {
                  const sKey = nodeKey("series", s.id);
                  const seriesExpanded = expandedSeries.has(s.jm_id);
                  const sSelected = selected.has(sKey);
                  const parentKey = `brand:${b.id}`;
                  const status = getSeriesAssetStatus(s.jm_id);
                  const needSeriesConfig = !status.hasExteriorVr || !status.hasInteriorVr;
                  const modelRows = showOnlyNormal ? getModelsForSeries(s.jm_id).filter(isNormal) : getModelsForSeries(s.jm_id);
                  const modelSiblings = modelKeysBySeries.get(s.jm_id) || [];

                  return (
                    <div key={sKey} className="space-y-2">
                      <div
                        className={rowCls(sSelected)}
                        onClick={(e) => onNodeClick(e, sKey, parentKey, seriesSiblings)}
                        onContextMenu={(e) => onNodeContextMenu(e, sKey, parentKey)}
                      >
                        <div className={leftCls}>
                          <button
                            type="button"
                            className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSeries(s.jm_id);
                            }}
                            aria-label={seriesExpanded ? "收起车系" : "展开车系"}
                          >
                            {seriesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">{s.name}</div>
                            <div className="text-xs text-zinc-500">车系 · {s.jm_id}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <AssetStatusChip
                            label="外观VR"
                            state={presentState(status.hasExteriorVr)}
                            deletable={status.hasExteriorVr}
                            onDelete={() => onDeleteSeriesAsset(sKey, s, "exterior_vr")}
                          />
                          <AssetStatusChip
                            label="内饰VR"
                            state={presentState(status.hasInteriorVr)}
                            deletable={status.hasInteriorVr}
                            onDelete={() => onDeleteSeriesAsset(sKey, s, "interior_vr")}
                          />
                          <AssetStatusChip
                            label="官图"
                            state={presentState(status.hasOfficial)}
                            deletable={status.hasOfficial}
                            onDelete={() => onDeleteSeriesAsset(sKey, s, "official_images")}
                          />
                          {needSeriesConfig ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onConfigureSeries(b, s);
                              }}
                              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              配置
                            </button>
                          ) : null}
                          <ActivityStatusPills value={s.activity_status} onChange={(st) => onSetSingleStatus("series", s.id, st)} />
                        </div>
                      </div>

                      {seriesExpanded ? (
                        <div className="pl-10 space-y-2">
                          {modelRows.map((m) => {
                            const mKey = nodeKey("model", m.id);
                            const mSelected = selected.has(mKey);
                            const parent = `series:${s.id}`;
                            const ms = getModelAssetStatus(m.jm_id);
                            const needModelConfig = !ms.hasExteriorImages || !ms.hasInteriorImages;
                            return (
                              <div
                                key={mKey}
                                className={rowCls(mSelected)}
                                onClick={(e) => onNodeClick(e, mKey, parent, modelSiblings)}
                                onContextMenu={(e) => onNodeContextMenu(e, mKey, parent)}
                              >
                                <div className={leftCls}>
                                  <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-500">
                                    M
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-zinc-900">{m.name}</div>
                                    <div className="text-xs text-zinc-500">车型 · {m.jm_id}</div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                  <AssetStatusChip
                                    label="外观图"
                                    state={presentState(ms.hasExteriorImages)}
                                    deletable={ms.hasExteriorImages}
                                    onDelete={() => onDeleteModelImages(mKey, m, "exterior")}
                                  />
                                  <AssetStatusChip
                                    label="内饰图"
                                    state={presentState(ms.hasInteriorImages)}
                                    deletable={ms.hasInteriorImages}
                                    onDelete={() => onDeleteModelImages(mKey, m, "interior")}
                                  />
                                  <AssetStatusChip label="详细参数" state={presentState(ms.hasDetails)} />
                                  {needModelConfig ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onConfigureModel(b, s, m);
                                      }}
                                      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                    >
                                      配置
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    disabled={!ms.hasDetails}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSetModelHotSale(m.jm_id, !getModelHotSale(m.jm_id));
                                    }}
                                    className={
                                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors " +
                                      (!ms.hasDetails
                                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                                        : getModelHotSale(m.jm_id)
                                          ? "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                                          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50")
                                    }
                                  >
                                    热销
                                  </button>
                                  <ActivityStatusPills value={m.activity_status} onChange={(st) => onSetSingleStatus("model", m.id, st)} />
                                </div>
                              </div>
                            );
                          })}

                          {modelRows.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">暂无车型</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {seriesRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">暂无车系</div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}

      {visibleBrands.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">暂无品牌数据</div>
      ) : null}
    </div>
  );
}
