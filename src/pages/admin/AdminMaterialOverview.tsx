import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { cardContentCls, pageDescCls, pageTitleCls, smallButtonCls } from "@/admin/AdminApp";
import ContextMenu, { type ContextMenuItem } from "@/components/admin/materialOverview/ContextMenu";
import DeleteConfirmModal from "@/components/admin/materialOverview/DeleteConfirmModal";
import MaterialTree from "@/components/admin/materialOverview/MaterialTree";
import { type NodeKey } from "@/components/admin/materialOverview/types";
import useMaterialOverviewData from "@/hooks/useMaterialOverviewData";
import { selectionRange } from "@/utils/selectionRange";
import type { MaterialResourceJump } from "@/pages/admin/materialResourceJump";

type DeleteKind = "series_exterior_vr" | "series_interior_vr" | "series_official" | "model_exterior_images" | "model_interior_images" | "brand_clear";

// Clear options shape
type ClearOptions = {
  series: boolean;
  models: boolean;
  modelDetails: boolean;
  carPictures: boolean;
  modelImageConfig: boolean;
  seriesVrConfig: boolean;
  brands: boolean;
};

const defaultClearOptions: ClearOptions = {
  series: true,
  models: true,
  modelDetails: true,
  carPictures: true,
  modelImageConfig: true,
  seriesVrConfig: true,
  brands: true,
};

type DeleteAction =
  | { open: false }
  | {
      open: true;
      kind: DeleteKind;
      title: string;
      description: string;
      seriesJmIds: number[];
      modelJmIds: number[];
      brandJmIds?: number[];
      clearOptions?: ClearOptions;
    };

export default function AdminMaterialOverview(props: { onGoToResources?: (jump: MaterialResourceJump) => void }) {
  const [onlyNormal, setOnlyNormal] = useState(true);
  const {
    loading,
    error,
    notice,
    setError,
    setNotice,
    brands,
    expandedBrands,
    expandedSeries,
    getSeriesForBrand,
    getModelsForSeries,
    getSeriesAssetStatus,
    getModelAssetStatus,
    getModelHotSale,
    toggleBrandExpanded,
    toggleSeriesExpanded,
    setSingleStatus,
    batchSetStatus,
    setModelHotSale,
    batchSetModelHotSale,
    deleteSeriesAssets,
    deleteModelImages,
    loadBrands,
    reloadKeepExpanded,
  } = useMaterialOverviewData({ onlyNormal });

  const [selected, setSelected] = useState<Set<NodeKey>>(new Set());
  const lastSelectedRef = useRef<{ key: NodeKey; parentKey: string } | null>(null);

  // Brand-level checkbox state
  const [brandChecked, setBrandChecked] = useState<Set<string>>(new Set());
  const [clearBrandsBusy, setClearBrandsBusy] = useState(false);
  const [clearProgress, setClearProgress] = useState<{ done: number; total: number; current: string } | null>(null);

  function toggleBrandCheck(brandId: string) {
    setBrandChecked(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) next.delete(brandId);
      else next.add(brandId);
      return next;
    });
  }

  function openClearBrands() {
    const q = brandSearch.trim().toLowerCase();
    const visibleBrands = q ? brands.filter(b => b.name.toLowerCase().includes(q)) : brands;
    const checkedBrands = visibleBrands.filter(b => brandChecked.has(b.id));
    if (checkedBrands.length === 0) return;
    const names = checkedBrands.length > 3
      ? checkedBrands.slice(0, 3).map(b => b.name).join("、") + `…等 ${checkedBrands.length} 个`
      : checkedBrands.map(b => b.name).join("、");
    setDeleteAction({
      open: true,
      kind: "brand_clear",
      title: `确认清空 ${checkedBrands.length} 个品牌数据`,
      description: `将清空品牌「${names}」下的数据。请勾选需要删除的内容：`,
      seriesJmIds: [],
      modelJmIds: [],
      brandJmIds: checkedBrands.map(b => b.jm_id),
      clearOptions: { ...defaultClearOptions },
    });
    setDeleteConfirmText("");
  }

  async function confirmClearBrands(brandJmIds: number[], opts: ClearOptions) {
    setClearBrandsBusy(true);
    const total = brandJmIds.length;
    let done = 0;
    setClearProgress({ done: 0, total, current: "" });
    try {
      for (const bjm of brandJmIds) {
        // find brand name
        const brandName = brands.find(b => b.jm_id === bjm)?.name || String(bjm);
        setClearProgress({ done, total, current: brandName });
        // 1. get series under this brand
        const { data: seriesRows } = await supabase.from("series").select("jm_id").eq("brand_jm_id", bjm);
        const sJmIds = (seriesRows ?? []).map((s: any) => s.jm_id);

        // 2. get models under this brand
        const { data: modelRows } = await supabase.from("models_jumdata").select("jm_id").eq("brand_jm_id", bjm);
        const mJmIds = (modelRows ?? []).map((m: any) => m.jm_id);

        // 3. delete model_details
        if (opts.modelDetails && mJmIds.length > 0) {
          await supabase.from("model_details").delete().in("model_jm_id", mJmIds);
          await supabase.from("model_details").delete().in("brand_jm_id", bjm);
        }
        // 4. delete car_pictures (images)
        if (opts.carPictures && mJmIds.length > 0) {
          await supabase.from("car_pictures").delete().in("model_jm_id", mJmIds);
        }
        // 5. delete model_image_config
        if (opts.modelImageConfig && mJmIds.length > 0) {
          await supabase.from("model_image_config").delete().in("model_jm_id", mJmIds);
        }
        // 6. delete models_jumdata
        if (opts.models) {
          await supabase.from("models_jumdata").delete().eq("brand_jm_id", bjm);
        }
        // 7. delete series_vr_config
        if (opts.seriesVrConfig && sJmIds.length > 0) {
          await supabase.from("series_vr_config").delete().in("series_jm_id", sJmIds);
        }
        // 8. delete series
        if (opts.series) {
          await supabase.from("series").delete().eq("brand_jm_id", bjm);
        }
        // 9. delete the brand itself
        if (opts.brands) {
          await supabase.from("brands").delete().eq("jm_id", bjm);
        }
        done++;
      }
      setBrandChecked(new Set());
      await loadBrands();
      setNotice(`已清空 ${brandJmIds.length} 个品牌及其关联数据`);
    } catch (e: any) {
      setError(e?.message || "清空失败");
    } finally {
      setClearBrandsBusy(false);
      setClearProgress(null);
    }
  }

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [deleteAction, setDeleteAction] = useState<DeleteAction>({ open: false });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const selectedSummary = useMemo(() => {
    const brandIds: string[] = [];
    const seriesIds: string[] = [];
    const modelIds: string[] = [];
    const seriesJmIds: number[] = [];
    const modelJmIds: number[] = [];

    const seriesById = new Map<string, { id: string; jm_id: number }>();
    const modelById = new Map<string, { id: string; jm_id: number }>();
    const brandById = new Map<string, { id: string }>();

    for (const b of brands) brandById.set(b.id, { id: b.id });
    for (const b of brands) {
      for (const s of getSeriesForBrand(b.jm_id)) seriesById.set(s.id, { id: s.id, jm_id: s.jm_id });
      for (const s of getSeriesForBrand(b.jm_id)) {
        for (const m of getModelsForSeries(s.jm_id)) modelById.set(m.id, { id: m.id, jm_id: m.jm_id });
      }
    }

    for (const k of selected) {
      const [t, id] = String(k).split(":");
      if (t === "brand") {
        if (brandById.has(id)) brandIds.push(id);
      }
      if (t === "series") {
        const s = seriesById.get(id);
        if (s) {
          seriesIds.push(s.id);
          seriesJmIds.push(s.jm_id);
        }
      }
      if (t === "model") {
        const m = modelById.get(id);
        if (m) {
          modelIds.push(m.id);
          modelJmIds.push(m.jm_id);
        }
      }
    }

    return {
      total: selected.size,
      brandIds,
      seriesIds,
      modelIds,
      seriesJmIds,
      modelJmIds,
    };
  }, [brands, getModelsForSeries, getSeriesForBrand, selected]);

  function clearSelection() {
    setSelected(new Set());
    lastSelectedRef.current = null;
  }

  function selectSingle(key: NodeKey, parentKey: string) {
    setSelected(new Set([key]));
    lastSelectedRef.current = { key, parentKey };
  }

  function toggleSelection(key: NodeKey, parentKey: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    lastSelectedRef.current = { key, parentKey };
  }

  function rangeSelect(keys: NodeKey[], from: NodeKey, to: NodeKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const k of selectionRange(keys, from, to)) next.add(k);
      return next;
    });
  }

  function onNodeClick(e: React.MouseEvent, key: NodeKey, parentKey: string, siblings: NodeKey[]) {
    if (e.shiftKey && lastSelectedRef.current && lastSelectedRef.current.parentKey === parentKey) {
      rangeSelect(siblings, lastSelectedRef.current.key, key);
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      toggleSelection(key, parentKey);
      return;
    }
    selectSingle(key, parentKey);
  }

  function openMenuAt(e: React.MouseEvent) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    clearSelection();
    closeMenu();
  }, [onlyNormal]);

  useEffect(() => {
    if (!menuOpen) return;
    const onScroll = () => setMenuOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [menuOpen]);

  function openDelete(kind: DeleteKind, title: string, description: string, seriesJmIds: number[], modelJmIds: number[]) {
    setDeleteAction({ open: true, kind, title, description, seriesJmIds, modelJmIds });
    setDeleteConfirmText("");
  }

  async function confirmDelete() {
    if (!deleteAction.open) return;
    if (deleteBusy) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleteBusy(true);
    setError(null);
    setNotice(null);
    try {
      const keepBrands = new Set(expandedBrands);
      const keepSeries = new Set(expandedSeries);

      if (deleteAction.kind === "series_exterior_vr") await deleteSeriesAssets(deleteAction.seriesJmIds, "exterior_vr");
      if (deleteAction.kind === "series_interior_vr") await deleteSeriesAssets(deleteAction.seriesJmIds, "interior_vr");
      if (deleteAction.kind === "series_official") await deleteSeriesAssets(deleteAction.seriesJmIds, "official_images");
      if (deleteAction.kind === "model_exterior_images") await deleteModelImages(deleteAction.modelJmIds, "exterior");
      if (deleteAction.kind === "model_interior_images") await deleteModelImages(deleteAction.modelJmIds, "interior");
      if (deleteAction.kind === "brand_clear" && deleteAction.brandJmIds) {
        await confirmClearBrands(deleteAction.brandJmIds, deleteAction.clearOptions || defaultClearOptions);
        // Reset checked brands after clear
        setBrandChecked(new Set());
      }

      setDeleteAction({ open: false });
      setDeleteConfirmText("");
      setNotice("删除完成");
      clearSelection();

      await reloadKeepExpanded(keepBrands, keepSeries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleteBusy(false);
    }
  }

  const menuItems: ContextMenuItem[] = useMemo(() => {
    const n = selectedSummary.total;
    const seriesCount = selectedSummary.seriesJmIds.length;
    const modelCount = selectedSummary.modelJmIds.length;
    const canEdit = n > 0;
    return [
      {
        key: "s0",
        label: `批量设为：正常（${n}）`,
        disabled: !canEdit,
        onClick: () => batchSetStatus({ brandIds: selectedSummary.brandIds, seriesIds: selectedSummary.seriesIds, modelIds: selectedSummary.modelIds, status: 0, total: n }),
      },
      {
        key: "s1",
        label: `批量设为：不显示（${n}）`,
        disabled: !canEdit,
        onClick: () => batchSetStatus({ brandIds: selectedSummary.brandIds, seriesIds: selectedSummary.seriesIds, modelIds: selectedSummary.modelIds, status: 1, total: n }),
      },
      {
        key: "s2",
        label: `批量设为：不可用（${n}）`,
        disabled: !canEdit,
        onClick: () => batchSetStatus({ brandIds: selectedSummary.brandIds, seriesIds: selectedSummary.seriesIds, modelIds: selectedSummary.modelIds, status: 2, total: n }),
      },
      {
        key: "h1",
        label: `批量设为：热销（车型 ${modelCount}）`,
        disabled: modelCount === 0,
        onClick: () => batchSetModelHotSale(selectedSummary.modelJmIds, true),
      },
      {
        key: "h2",
        label: `批量取消热销（车型 ${modelCount}）`,
        disabled: modelCount === 0,
        onClick: () => batchSetModelHotSale(selectedSummary.modelJmIds, false),
      },
      {
        key: "d1",
        label: `批量删除外观VR（车系 ${seriesCount}）`,
        disabled: seriesCount === 0,
        danger: true,
        onClick: () =>
          openDelete(
            "series_exterior_vr",
            "确认批量删除外观VR",
            "将清空所选车系的外观VR图组。此操作不可恢复。",
            selectedSummary.seriesJmIds,
            []
          ),
      },
      {
        key: "d2",
        label: `批量删除内饰VR（车系 ${seriesCount}）`,
        disabled: seriesCount === 0,
        danger: true,
        onClick: () =>
          openDelete(
            "series_interior_vr",
            "确认批量删除内饰VR",
            "将清空所选车系的内饰VR图组。此操作不可恢复。",
            selectedSummary.seriesJmIds,
            []
          ),
      },
      {
        key: "d3",
        label: `批量删除官图（车系 ${seriesCount}）`,
        disabled: seriesCount === 0,
        danger: true,
        onClick: () =>
          openDelete("series_official", "确认批量删除官图", "将清空所选车系的官图。此操作不可恢复。", selectedSummary.seriesJmIds, []),
      },
      {
        key: "d4",
        label: `批量删除外观图（车型 ${modelCount}）`,
        disabled: modelCount === 0,
        danger: true,
        onClick: () =>
          openDelete(
            "model_exterior_images",
            "确认批量删除外观图",
            "将删除所选车型的外观图（car_pictures）并清空 model_image_config 外观图数组。此操作不可恢复。",
            [],
            selectedSummary.modelJmIds
          ),
      },
      {
        key: "d5",
        label: `批量删除内饰图（车型 ${modelCount}）`,
        disabled: modelCount === 0,
        danger: true,
        onClick: () =>
          openDelete(
            "model_interior_images",
            "确认批量删除内饰图",
            "将删除所选车型的内饰图（car_pictures）并清空 model_image_config 内饰图数组。此操作不可恢复。",
            [],
            selectedSummary.modelJmIds
          ),
      },
    ];
  }, [batchSetModelHotSale, batchSetStatus, selectedSummary]);

  const header = (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div>
        <h4 className={pageTitleCls()}>数据总览</h4>
        <p className={pageDescCls()}>树形查看 品牌 → 车系 → 车型，并支持状态修改与多选右键批量操作。</p>
      </div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <span>只加载正常</span>
          <button
            type="button"
            role="switch"
            aria-checked={onlyNormal}
            onClick={() => setOnlyNormal((v) => !v)}
            className={
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors " +
              (onlyNormal ? "border-blue-600 bg-blue-600" : "border-zinc-300 bg-zinc-200")
            }
          >
            <span className={"inline-block h-5 w-5 transform rounded-full bg-white transition-transform " + (onlyNormal ? "translate-x-5" : "translate-x-1")} />
          </button>
        </label>
        <button type="button" className={smallButtonCls("secondary") + " gap-2"} onClick={loadBrands} disabled={loading}>
          <RefreshCw className={"h-4 w-4" + (loading ? " animate-spin" : "")} />
          刷新
        </button>
      </div>
    </div>
  );

  const [brandSearch, setBrandSearch] = useState("");

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(b => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const infoBar = error ? (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
  ) : notice ? (
    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>
  ) : null;

  return (
    <div>
      {header}
      {infoBar}

      <div className={cardContentCls() + " p-4"}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-zinc-800">品牌 → 车系 → 车型</div>
            {/* Brand checkboxes */}
            <button type="button" onClick={() => setBrandChecked(new Set(filteredBrands.map(b => b.id)))} className="text-xs text-blue-600 hover:text-blue-800 select-none">
              全选
            </button>
            <span className="text-zinc-300">|</span>
            <button type="button" onClick={() => setBrandChecked(new Set())} className="text-xs text-blue-600 hover:text-blue-800 select-none">
              取消全选
            </button>
            <span className="text-zinc-300">|</span>
            <button type="button" onClick={() => setBrandChecked(prev => { const all = new Set(filteredBrands.map(b => b.id)); for (const id of all) { if (prev.has(id)) all.delete(id); } return all; })} className="text-xs text-blue-600 hover:text-blue-800 select-none">
              反选
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={brandSearch}
              onChange={e => { setBrandSearch(e.target.value); setBrandChecked(new Set()); }}
              placeholder="搜索品牌…"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 w-44 focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            {brandChecked.size > 0 ? (
              <button
                type="button"
                disabled={clearBrandsBusy}
                onClick={openClearBrands}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {clearBrandsBusy ? "清空中..." : `清空已选品牌数据（${brandChecked.size}）`}
              </button>
            ) : null}
            <div className="text-xs text-zinc-500">已选 {selected.size} 个节点（右键批量操作）</div>
          </div>
        </div>

        <MaterialTree
          onlyNormal={onlyNormal}
          brands={filteredBrands}
          expandedBrands={expandedBrands}
          expandedSeries={expandedSeries}
          getSeriesForBrand={getSeriesForBrand}
          getModelsForSeries={getModelsForSeries}
          getSeriesAssetStatus={getSeriesAssetStatus}
          getModelAssetStatus={getModelAssetStatus}
          getModelHotSale={getModelHotSale}
          onConfigureSeries={(b, s) =>
            props.onGoToResources?.({
              section: "series-vr",
              brandJmId: b.jm_id,
              brandName: b.name,
              seriesJmId: s.jm_id,
              seriesName: s.name,
            })
          }
          onConfigureModel={(b, s, m) =>
            props.onGoToResources?.({
              section: "model-images",
              brandJmId: b.jm_id,
              brandName: b.name,
              seriesJmId: s.jm_id,
              seriesName: s.name,
              modelJmId: m.jm_id,
              modelName: m.name,
            })
          }
          onToggleBrand={(id) => {
            toggleBrandExpanded(id).catch((e) => setError(e instanceof Error ? e.message : "展开失败"));
          }}
          onToggleSeries={(id) => {
            toggleSeriesExpanded(id).catch((e) => setError(e instanceof Error ? e.message : "展开失败"));
          }}
          selected={selected}
          onNodeClick={onNodeClick}
          onNodeContextMenu={(e, key, parentKey) => {
            if (!selected.has(key)) selectSingle(key, parentKey);
            openMenuAt(e);
          }}
          onSetSingleStatus={(type, id, status) => setSingleStatus(type, id, status)}
          onSetModelHotSale={(modelJmId, hot) =>
            setModelHotSale(modelJmId, hot).catch((e) => {
              setError(e instanceof Error ? e.message : "保存失败");
            })
          }
          onDeleteSeriesAsset={(k, s, kind) => {
            setSelected(new Set([k]));
            const map: Record<string, { kind: DeleteKind; title: string; desc: string }> = {
              exterior_vr: { kind: "series_exterior_vr", title: "确认删除外观VR", desc: `将清空车系“${s.name}”的外观VR图组。此操作不可恢复。` },
              interior_vr: { kind: "series_interior_vr", title: "确认删除内饰VR", desc: `将清空车系“${s.name}”的内饰VR图组。此操作不可恢复。` },
              official_images: { kind: "series_official", title: "确认删除官图", desc: `将清空车系“${s.name}”的官图。此操作不可恢复。` },
            };
            const it = map[kind];
            openDelete(it.kind, it.title, it.desc, [s.jm_id], []);
          }}
          onDeleteModelImages={(k, m, kind) => {
            setSelected(new Set([k]));
            if (kind === "exterior") {
              openDelete("model_exterior_images", "确认删除外观图", `将删除车型“${m.name}”的外观图。此操作不可恢复。`, [], [m.jm_id]);
            } else {
              openDelete("model_interior_images", "确认删除内饰图", `将删除车型“${m.name}”的内饰图。此操作不可恢复。`, [], [m.jm_id]);
            }
          }}
          onClearSelection={clearSelection}
          brandChecked={brandChecked}
          onToggleBrandCheck={toggleBrandCheck}
        />
      </div>

      <ContextMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        items={menuItems.map((it) => ({
          ...it,
          onClick: () => {
            closeMenu();
            it.onClick();
          },
        }))}
        onClose={closeMenu}
      />

      <DeleteConfirmModal
        open={deleteAction.open}
        title={deleteAction.open ? deleteAction.title : "确认删除"}
        description={deleteAction.open ? deleteAction.description : ""}
        confirmText={deleteConfirmText}
        busy={deleteBusy || clearBrandsBusy}
        onChangeConfirmText={setDeleteConfirmText}
        onClose={() => {
          if (deleteBusy || clearBrandsBusy) return;
          setDeleteAction({ open: false });
          setDeleteConfirmText("");
        }}
        onConfirm={confirmDelete}
      >
        {deleteAction.open && deleteAction.kind === "brand_clear" && deleteAction.clearOptions ? (
          <div>
            {/* Progress bar during clearing */}
            {clearProgress ? (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-blue-800">清空中…</span>
                  <span className="text-blue-600">{clearProgress.done} / {clearProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden mb-1">
                  <div
                    className="h-2.5 rounded-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${clearProgress.total > 0 ? Math.round((clearProgress.done / clearProgress.total) * 100) : 0}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 truncate">{clearProgress.current}</div>
              </div>
            ) : (
              <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-800 mb-2">选择要删除的数据：</div>
                <div className="grid grid-cols-2 gap-2">
              {[
                { key: "brands", label: "品牌" },
                { key: "series", label: "车系" },
                { key: "models", label: "车型" },
                { key: "modelDetails", label: "车型详情" },
                { key: "carPictures", label: "车辆图片 (car_pictures)" },
                { key: "modelImageConfig", label: "图片配置 (model_image_config)" },
                { key: "seriesVrConfig", label: "VR配置 (series_vr_config)" },
              ].map(({ key, label }) => {
                const checked = (deleteAction as any).clearOptions?.[key] ?? true;
                return (
                  <label key={key} className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setDeleteAction(prev => {
                          if (!prev.open) return prev;
                          const opts = { ...(prev.clearOptions || defaultClearOptions) };
                          (opts as any)[key] = !checked;
                          return { ...prev, clearOptions: opts };
                        });
                      }}
                      className="rounded border-zinc-300 text-blue-600"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>
            )}
          </div>
        ) : null}
      </DeleteConfirmModal>
    </div>
  );
}