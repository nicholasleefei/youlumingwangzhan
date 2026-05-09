import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import DeleteResourceModal, { type DeleteIntent } from "./DeleteResourceModal";
import BulkDeleteResourceModal, { type BulkDeleteIntent } from "./BulkDeleteResourceModal";
import DeleteModelImagesModal, { type ModelDeleteIntent } from "./DeleteModelImagesModal";
import SeriesModelCoverageModal from "./SeriesModelCoverageModal";
import { loadBaseOptions, loadModelCoverage, queryOverviewData, type BrandRow, type OverviewRow, type SeriesRow } from "./query";
import FilterBar from "./FilterBar";
import OverviewTable from "./OverviewTable";
import SeriesVrDetailsModal from "./SeriesVrDetailsModal";

export default function ResourceOverviewTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesRow[]>([]);
  const [onlyNormal, setOnlyNormal] = useState(true);
  const [onlyHasImages, setOnlyHasImages] = useState(false);

  const [brandFilter, setBrandFilter] = useState<number | null>(null);
  const [seriesFilter, setSeriesFilter] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");

  const [allRows, setAllRows] = useState<OverviewRow[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("");

  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent>({ open: false });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelModalBusy, setModelModalBusy] = useState(false);
  const [modelModalError, setModelModalError] = useState<string | null>(null);
  const [modelModalTitle, setModelModalTitle] = useState<string>("");
  const [modelModalSeriesJmId, setModelModalSeriesJmId] = useState<number | null>(null);
  const [modelModalSearch, setModelModalSearch] = useState("");
  const [modelRows, setModelRows] = useState<
    Array<{ jm_id: number; name: string; source: "car_pictures" | "model_image_config" | "none"; total: number; categories: Record<string, number> }>
  >([]);

  const [vrModalOpen, setVrModalOpen] = useState(false);
  const [vrModalTitle, setVrModalTitle] = useState<string>("");
  const [vrModalSeriesJmId, setVrModalSeriesJmId] = useState<number | null>(null);

  const [modelDeleteIntent, setModelDeleteIntent] = useState<ModelDeleteIntent>({ open: false });
  const [modelDeleteConfirmText, setModelDeleteConfirmText] = useState("");
  const [modelDeleteBusy, setModelDeleteBusy] = useState(false);

  const [selectedSeriesIds, setSelectedSeriesIds] = useState<Set<number>>(new Set());
  const [bulkDeleteIntent, setBulkDeleteIntent] = useState<BulkDeleteIntent>({ open: false });
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);

  const initialLoaded = useRef(false);

  const visibleSeriesOptions = useMemo(() => {
    return seriesList
      .filter((s) => (brandFilter ? s.brand_jm_id === brandFilter : true))
      .filter((s) => (!onlyNormal ? true : (s.activity_status ?? 0) === 0))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [brandFilter, onlyNormal, seriesList]);

  async function refresh() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { rows, lastUpdatedAt } = await queryOverviewData({
        brands,
        seriesList,
        onlyNormal,
        brandFilter,
        seriesFilter,
        keyword,
      });
      setAllRows(rows);
      setLastUpdatedAt(lastUpdatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }

  const rows = useMemo(() => {
    if (!onlyHasImages) return allRows;
    return allRows.filter((r) => (r.images?.totalCount ?? 0) > 0 || (r.vr?.totalImageCount ?? 0) > 0);
  }, [allRows, onlyHasImages]);

  async function openModelModal(r: OverviewRow) {
    setModelModalTitle(`${r.brandName} / ${r.seriesName} 车型图片覆盖`);
    setModelModalSeriesJmId(r.seriesJmId);
    setModelModalOpen(true);
    setModelModalSearch("");
    setModelModalError(null);
    setModelModalBusy(true);
    try {
      const items = await loadModelCoverage({ seriesJmId: r.seriesJmId });
      setModelRows(items);
    } catch (e) {
      setModelModalError(e instanceof Error ? e.message : "加载车型明细失败");
      setModelRows([]);
    } finally {
      setModelModalBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteIntent.open) return;
    if (deleteBusy) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleteBusy(true);
    setError(null);
    try {
      if (deleteIntent.scope === "vr") {
        const { error } = await supabase.from("series_vr_config").delete().eq("series_jm_id", deleteIntent.seriesJmId);
        if (error) throw error;
      } else {
        if (deleteIntent.imageDeleteMode === "all" || deleteIntent.imageDeleteMode === "car_pictures") {
          const { error } = await supabase.from("car_pictures").delete().eq("series_jm_id", deleteIntent.seriesJmId);
          if (error) throw error;
        }
        if (deleteIntent.imageDeleteMode === "all" || deleteIntent.imageDeleteMode === "model_image_config") {
          const { error } = await supabase.from("model_image_config").delete().eq("series_jm_id", deleteIntent.seriesJmId);
          if (error) throw error;
        }
      }
      setDeleteIntent({ open: false });
      setDeleteConfirmText("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function confirmBulkDelete() {
    if (!bulkDeleteIntent.open) return;
    if (bulkDeleteBusy) return;
    if (bulkDeleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    if (bulkDeleteIntent.seriesIds.length === 0) return;
    setBulkDeleteBusy(true);
    setError(null);
    try {
      if (bulkDeleteIntent.scope === "vr") {
        const { error } = await supabase.from("series_vr_config").delete().in("series_jm_id", bulkDeleteIntent.seriesIds);
        if (error) throw error;
      } else {
        if (bulkDeleteIntent.imageDeleteMode === "all" || bulkDeleteIntent.imageDeleteMode === "car_pictures") {
          const { error } = await supabase.from("car_pictures").delete().in("series_jm_id", bulkDeleteIntent.seriesIds);
          if (error) throw error;
        }
        if (bulkDeleteIntent.imageDeleteMode === "all" || bulkDeleteIntent.imageDeleteMode === "model_image_config") {
          const { error } = await supabase.from("model_image_config").delete().in("series_jm_id", bulkDeleteIntent.seriesIds);
          if (error) throw error;
        }
      }

      setBulkDeleteIntent({ open: false });
      setBulkDeleteConfirmText("");
      setSelectedSeriesIds(new Set());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "批量删除失败");
    } finally {
      setBulkDeleteBusy(false);
    }
  }

  async function confirmDeleteModelImages() {
    if (!modelDeleteIntent.open) return;
    if (modelDeleteBusy) return;
    if (modelDeleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setModelDeleteBusy(true);
    setError(null);
    try {
      if (modelDeleteIntent.imageDeleteMode === "all" || modelDeleteIntent.imageDeleteMode === "car_pictures") {
        const { error } = await supabase.from("car_pictures").delete().eq("model_jm_id", modelDeleteIntent.modelJmId);
        if (error) throw error;
      }
      if (modelDeleteIntent.imageDeleteMode === "all" || modelDeleteIntent.imageDeleteMode === "model_image_config") {
        const { error } = await supabase.from("model_image_config").delete().eq("model_jm_id", modelDeleteIntent.modelJmId);
        if (error) throw error;
      }

      setModelDeleteIntent({ open: false });
      setModelDeleteConfirmText("");

      const sid = modelModalSeriesJmId;
      const base = rows.find((x) => x.seriesJmId === sid);
      if (base) await openModelModal(base);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setModelDeleteBusy(false);
    }
  }

  useEffect(() => {
    loadBaseOptions()
      .then(({ brands, seriesList }) => {
        setBrands(brands);
        setSeriesList(seriesList);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载筛选项失败"));
  }, []);

  useEffect(() => {
    if (!initialLoaded.current && brands.length > 0 && seriesList.length > 0) {
      initialLoaded.current = true;
      refresh();
    }
  }, [brands.length, seriesList.length]);

  useEffect(() => {
    setSelectedSeriesIds((prev) => {
      const visible = new Set(rows.map((r) => r.seriesJmId));
      const next = new Set<number>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
      }
      return next;
    });
  }, [rows]);

  useEffect(() => {
    if (!brandFilter) {
      setSeriesFilter(null);
      return;
    }
    if (seriesFilter) {
      const s = seriesList.find((x) => x.jm_id === seriesFilter);
      if (s && s.brand_jm_id !== brandFilter) setSeriesFilter(null);
    }
  }, [brandFilter, seriesFilter, seriesList]);

  const totalSeries = rows.length;
  const totalVrSeries = rows.filter((r) => r.vr.totalImageCount > 0).length;
  const totalImageSeries = rows.filter((r) => r.images.totalCount > 0).length;

  const selectedCount = selectedSeriesIds.size;
  const selectedSeriesNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of rows) m.set(r.seriesJmId, `${r.brandName} / ${r.seriesName}`);
    return m;
  }, [rows]);

  function toggleSeries(seriesJmId: number) {
    setSelectedSeriesIds((prev) => {
      const next = new Set(prev);
      if (next.has(seriesJmId)) next.delete(seriesJmId);
      else next.add(seriesJmId);
      return next;
    });
  }

  function toggleAllVisible(checked: boolean) {
    if (!checked) {
      setSelectedSeriesIds(new Set());
      return;
    }
    setSelectedSeriesIds(new Set(rows.map((r) => r.seriesJmId)));
  }

  return (
    <div>
      <FilterBar
        brands={brands}
        seriesOptions={visibleSeriesOptions}
        onlyNormal={onlyNormal}
        onlyHasImages={onlyHasImages}
        brandFilter={brandFilter}
        seriesFilter={seriesFilter}
        keyword={keyword}
        loading={loading}
        lastUpdatedAt={lastUpdatedAt}
        stats={{ totalSeries, totalVrSeries, totalImageSeries }}
        onChangeOnlyNormal={setOnlyNormal}
        onChangeOnlyHasImages={setOnlyHasImages}
        onChangeBrand={setBrandFilter}
        onChangeSeries={setSeriesFilter}
        onChangeKeyword={setKeyword}
        onQuery={refresh}
        onReset={() => {
          setBrandFilter(null);
          setSeriesFilter(null);
          setKeyword("");
          setOnlyNormal(true);
          setOnlyHasImages(false);
        }}
      />

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-zinc-700">
          已选中 <span className="font-semibold">{selectedCount}</span> 个车系
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const ids = Array.from(selectedSeriesIds);
              const names = ids.map((id) => selectedSeriesNameById.get(id) ?? String(id));
              setBulkDeleteConfirmText("");
              setBulkDeleteIntent({ open: true, scope: "vr", seriesIds: ids, seriesNames: names, imageDeleteMode: "all" });
            }}
            disabled={selectedCount === 0 || deleteBusy || bulkDeleteBusy}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            批量删除VR
          </button>
          <button
            type="button"
            onClick={() => {
              const ids = Array.from(selectedSeriesIds);
              const names = ids.map((id) => selectedSeriesNameById.get(id) ?? String(id));
              setBulkDeleteConfirmText("");
              setBulkDeleteIntent({ open: true, scope: "images", seriesIds: ids, seriesNames: names, imageDeleteMode: "all" });
            }}
            disabled={selectedCount === 0 || deleteBusy || bulkDeleteBusy}
            className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            批量删除图片
          </button>
          <button
            type="button"
            onClick={() => setSelectedSeriesIds(new Set())}
            disabled={selectedCount === 0}
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-700 border border-zinc-200 hover:bg-zinc-50 transition-all disabled:opacity-50"
          >
            清空选择
          </button>
        </div>
      </div>

      <OverviewTable
        loading={loading}
        rows={rows}
        deleteBusy={deleteBusy}
        selectedSeriesIds={selectedSeriesIds}
        onToggleSeries={toggleSeries}
        onToggleAllVisible={toggleAllVisible}
        onOpenModels={openModelModal}
        onOpenVrDetails={(r) => {
          setVrModalTitle(`${r.brandName} / ${r.seriesName} VR 明细`);
          setVrModalSeriesJmId(r.seriesJmId);
          setVrModalOpen(true);
        }}
        onOpenDeleteVr={(r) => {
          setDeleteConfirmText("");
          setDeleteIntent({ open: true, scope: "vr", seriesJmId: r.seriesJmId, brandName: r.brandName, seriesName: r.seriesName, imageDeleteMode: "all" });
        }}
        onOpenDeleteImages={(r) => {
          setDeleteConfirmText("");
          setDeleteIntent({ open: true, scope: "images", seriesJmId: r.seriesJmId, brandName: r.brandName, seriesName: r.seriesName, imageDeleteMode: "all" });
        }}
      />

      <DeleteResourceModal
        intent={deleteIntent}
        confirmText={deleteConfirmText}
        busy={deleteBusy}
        onChangeConfirmText={setDeleteConfirmText}
        onChangeImageDeleteMode={(mode) => setDeleteIntent((prev) => (prev.open ? { ...prev, imageDeleteMode: mode } : prev))}
        onClose={() => {
          if (deleteBusy) return;
          setDeleteIntent({ open: false });
          setDeleteConfirmText("");
        }}
        onConfirm={confirmDelete}
      />

      <BulkDeleteResourceModal
        intent={bulkDeleteIntent}
        confirmText={bulkDeleteConfirmText}
        busy={bulkDeleteBusy}
        onChangeConfirmText={setBulkDeleteConfirmText}
        onChangeImageDeleteMode={(mode) => setBulkDeleteIntent((prev) => (prev.open ? { ...prev, imageDeleteMode: mode } : prev))}
        onClose={() => {
          if (bulkDeleteBusy) return;
          setBulkDeleteIntent({ open: false });
          setBulkDeleteConfirmText("");
        }}
        onConfirm={confirmBulkDelete}
      />

      <SeriesModelCoverageModal
        open={modelModalOpen}
        title={modelModalTitle}
        busy={modelModalBusy}
        error={modelModalError}
        search={modelModalSearch}
        onChangeSearch={setModelModalSearch}
        onRefresh={() => {
          const sid = modelModalSeriesJmId;
          const base = rows.find((x) => x.seriesJmId === sid);
          if (base) openModelModal(base);
        }}
        onClose={() => {
          setModelModalOpen(false);
          setModelModalSeriesJmId(null);
          setModelRows([]);
          setModelModalError(null);
        }}
        rows={modelRows}
        onDeleteModel={(m) => {
          setModelDeleteConfirmText("");
          setModelDeleteIntent({ open: true, modelJmId: m.jm_id, modelName: m.name, imageDeleteMode: "all" });
        }}
      />

      <DeleteModelImagesModal
        intent={modelDeleteIntent}
        confirmText={modelDeleteConfirmText}
        busy={modelDeleteBusy}
        onChangeConfirmText={setModelDeleteConfirmText}
        onChangeImageDeleteMode={(mode) => setModelDeleteIntent((prev) => (prev.open ? { ...prev, imageDeleteMode: mode } : prev))}
        onClose={() => {
          if (modelDeleteBusy) return;
          setModelDeleteIntent({ open: false });
          setModelDeleteConfirmText("");
        }}
        onConfirm={confirmDeleteModelImages}
      />

      <SeriesVrDetailsModal
        open={vrModalOpen}
        title={vrModalTitle}
        seriesJmId={vrModalSeriesJmId}
        onClose={() => {
          setVrModalOpen(false);
          setVrModalSeriesJmId(null);
        }}
      />
    </div>
  );
}
