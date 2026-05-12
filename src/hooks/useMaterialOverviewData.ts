import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  countSeriesVrImages,
  mergeModelImages,
  safeStringArrayLen,
  type CarPictureRow,
  type ModelImageConfigRow,
  type SeriesVrConfigRow,
} from "@/utils/resourceOverview";
import type { DbBrand, DbModel, DbSeries, ModelImageStats, NodeType } from "@/components/admin/materialOverview/types";

export type SeriesAssetStatus = { hasExteriorVr: boolean; hasInteriorVr: boolean; hasOfficial: boolean };
export type ModelAssetStatus = { hasExteriorImages: boolean; hasInteriorImages: boolean; hasDetails: boolean };

export default function useMaterialOverviewData(options?: { onlyNormal?: boolean }) {
  const onlyNormal = options?.onlyNormal ?? false;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [brands, setBrands] = useState<DbBrand[]>([]);
  const [seriesByBrand, setSeriesByBrand] = useState<Map<number, DbSeries[]>>(new Map());
  const [modelsBySeries, setModelsBySeries] = useState<Map<number, DbModel[]>>(new Map());

  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());
  const [expandedSeries, setExpandedSeries] = useState<Set<number>>(new Set());

  const [seriesVrBySeries, setSeriesVrBySeries] = useState<Map<number, SeriesVrConfigRow>>(new Map());
  const [modelImgByModel, setModelImgByModel] = useState<Map<number, ModelImageStats>>(new Map());
  const [modelHasDetails, setModelHasDetails] = useState<Set<number>>(new Set());
  const [modelHotSaleByModel, setModelHotSaleByModel] = useState<Map<number, boolean>>(new Map());

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      let q = supabase.from("brands").select("id, jm_id, name, activity_status").eq("depth", 1);
      if (onlyNormal) q = q.or("activity_status.eq.0,activity_status.is.null");
      const { data, error } = await q.order("name");
      if (error) throw error;
      setBrands((data || []) as DbBrand[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载品牌失败");
    } finally {
      setLoading(false);
    }
  }, [onlyNormal]);

  const resetCaches = useCallback(() => {
    setSeriesByBrand(new Map());
    setModelsBySeries(new Map());
    setExpandedBrands(new Set());
    setExpandedSeries(new Set());
    setSeriesVrBySeries(new Map());
    setModelImgByModel(new Map());
    setModelHasDetails(new Set());
    setModelHotSaleByModel(new Map());
  }, []);

  const ensureSeriesLoaded = useCallback(
    async (brandJmId: number) => {
      if (seriesByBrand.has(brandJmId)) return;
      let q = supabase.from("series").select("id, jm_id, brand_jm_id, name, activity_status").eq("brand_jm_id", brandJmId);
      if (onlyNormal) q = q.or("activity_status.eq.0,activity_status.is.null");
      const { data, error } = await q.order("name");
      if (error) throw error;
      const rows = (data || []) as DbSeries[];
      setSeriesByBrand((prev) => {
        const next = new Map(prev);
        next.set(brandJmId, rows);
        return next;
      });

      const seriesJmIds = rows.map((s) => s.jm_id);
      if (seriesJmIds.length === 0) return;
      const { data: vrData, error: vrErr } = await supabase
        .from("series_vr_config")
        .select("series_jm_id, exterior_vr, interior_vr, official_images")
        .in("series_jm_id", seriesJmIds);
      if (vrErr) throw vrErr;

      setSeriesVrBySeries((prev) => {
        const next = new Map(prev);
        for (const r of (vrData || []) as SeriesVrConfigRow[]) {
          if (typeof r.series_jm_id === "number") next.set(r.series_jm_id, r);
        }
        return next;
      });
    },
    [onlyNormal, seriesByBrand]
  );

  const ensureModelsLoaded = useCallback(
    async (seriesJmId: number) => {
      if (modelsBySeries.has(seriesJmId)) return;
      let q = supabase
        .from("models_jumdata")
        .select("id, jm_id, series_jm_id, brand_jm_id, name, activity_status")
        .eq("series_jm_id", seriesJmId);
      if (onlyNormal) q = q.or("activity_status.eq.0,activity_status.is.null");
      const { data, error } = await q.order("name");
      if (error) throw error;
      const rows = (data || []) as DbModel[];
      setModelsBySeries((prev) => {
        const next = new Map(prev);
        next.set(seriesJmId, rows);
        return next;
      });

      const modelJmIds = rows.map((m) => m.jm_id).filter((x) => typeof x === "number");
      if (modelJmIds.length === 0) return;

      const [{ data: cfgData, error: cfgErr }, { data: picData, error: picErr }, { data: detailData, error: detailErr }] =
        await Promise.all([
          supabase
            .from("model_image_config")
            .select("model_jm_id, exterior_images, interior_images, official_images")
            .in("model_jm_id", modelJmIds),
          supabase
            .from("car_pictures")
            .select("model_jm_id, category, image_url")
            .in("model_jm_id", modelJmIds),
          supabase.from("model_details").select("model_jm_id, hot_sale").in("model_jm_id", modelJmIds),
        ]);
      if (cfgErr) throw cfgErr;
      if (picErr) throw picErr;
      if (detailErr) throw detailErr;

      const cfgByModel = new Map<number, ModelImageConfigRow>();
      for (const r of (cfgData || []) as ModelImageConfigRow[]) {
        if (typeof r.model_jm_id === "number") cfgByModel.set(r.model_jm_id, r);
      }

      const picCounts = new Map<number, Map<string, number>>();
      for (const p of (picData || []) as CarPictureRow[]) {
        if (typeof p.model_jm_id !== "number") continue;
        const cat = String(p.category ?? "").trim();
        if (!cat) continue;
        const url = String(p.image_url ?? "").trim();
        if (!url) continue;
        let m = picCounts.get(p.model_jm_id);
        if (!m) {
          m = new Map();
          picCounts.set(p.model_jm_id, m);
        }
        m.set(cat, (m.get(cat) ?? 0) + 1);
      }

      const details = new Set<number>();
      const hotMap = new Map<number, boolean>();
      for (const d of (detailData || []) as Array<{ model_jm_id: number; hot_sale?: boolean | null }>) {
        if (typeof d.model_jm_id === "number") {
          details.add(d.model_jm_id);
          hotMap.set(d.model_jm_id, Boolean(d.hot_sale));
        }
      }

      setModelImgByModel((prev) => {
        const next = new Map(prev);
        for (const id of modelJmIds) {
          next.set(id, mergeModelImages({ carPictureCounts: picCounts.get(id), cfg: cfgByModel.get(id) }));
        }
        return next;
      });

      setModelHasDetails((prev) => {
        const next = new Set(prev);
        for (const id of details) next.add(id);
        return next;
      });

      setModelHotSaleByModel((prev) => {
        const next = new Map(prev);
        for (const id of modelJmIds) next.set(id, hotMap.get(id) ?? false);
        return next;
      });
    },
    [onlyNormal, modelsBySeries]
  );

  const toggleBrandExpanded = useCallback(
    async (brandJmId: number) => {
      setError(null);
      setNotice(null);
      const expanded = expandedBrands.has(brandJmId);
      if (!expanded) {
        await ensureSeriesLoaded(brandJmId);
        setExpandedBrands((prev) => new Set(prev).add(brandJmId));
      } else {
        setExpandedBrands((prev) => {
          const next = new Set(prev);
          next.delete(brandJmId);
          return next;
        });
      }
    },
    [ensureSeriesLoaded, expandedBrands]
  );

  const toggleSeriesExpanded = useCallback(
    async (seriesJmId: number) => {
      setError(null);
      setNotice(null);
      const expanded = expandedSeries.has(seriesJmId);
      if (!expanded) {
        await ensureModelsLoaded(seriesJmId);
        setExpandedSeries((prev) => new Set(prev).add(seriesJmId));
      } else {
        setExpandedSeries((prev) => {
          const next = new Set(prev);
          next.delete(seriesJmId);
          return next;
        });
      }
    },
    [ensureModelsLoaded, expandedSeries]
  );

  const getSeriesForBrand = useCallback((brandJmId: number) => seriesByBrand.get(brandJmId) || [], [seriesByBrand]);
  const getModelsForSeries = useCallback((seriesJmId: number) => modelsBySeries.get(seriesJmId) || [], [modelsBySeries]);

  const getSeriesAssetStatus = useCallback(
    (seriesJmId: number): SeriesAssetStatus => {
      const vr = countSeriesVrImages(seriesVrBySeries.get(seriesJmId));
      const hasOfficial = safeStringArrayLen(seriesVrBySeries.get(seriesJmId)?.official_images) > 0;
      return { hasExteriorVr: vr.hasExterior, hasInteriorVr: vr.hasInterior, hasOfficial };
    },
    [seriesVrBySeries]
  );

  const getModelAssetStatus = useCallback(
    (modelJmId: number): ModelAssetStatus => {
      const stats = modelImgByModel.get(modelJmId);
      const hasExteriorImages = (stats?.exterior.count ?? 0) > 0;
      const hasInteriorImages = (stats?.interior.count ?? 0) > 0;
      const hasDetails = modelHasDetails.has(modelJmId);
      return { hasExteriorImages, hasInteriorImages, hasDetails };
    },
    [modelHasDetails, modelImgByModel]
  );

  const getModelHotSale = useCallback((modelJmId: number) => modelHotSaleByModel.get(modelJmId) ?? false, [modelHotSaleByModel]);

  const setModelHotSale = useCallback(
    async (modelJmId: number, hot: boolean) => {
      setError(null);
      setNotice(null);
      const { error } = await supabase.from("model_details").update({ hot_sale: hot }).eq("model_jm_id", modelJmId);
      if (error) throw error;
      setModelHotSaleByModel((prev) => {
        const next = new Map(prev);
        next.set(modelJmId, hot);
        return next;
      });
      setNotice("热销状态已保存");
    },
    [setError, setNotice]
  );

  const batchSetModelHotSale = useCallback(
    async (modelJmIds: number[], hot: boolean) => {
      if (modelJmIds.length === 0) return;
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const { error } = await supabase.from("model_details").update({ hot_sale: hot }).in("model_jm_id", modelJmIds);
        if (error) throw error;
        setModelHotSaleByModel((prev) => {
          const next = new Map(prev);
          for (const id of modelJmIds) next.set(id, hot);
          return next;
        });
        setNotice(`已更新 ${modelJmIds.length} 个车型的热销状态`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "更新热销状态失败");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const setSingleStatus = useCallback(async (type: NodeType, id: string, status: number) => {
    setError(null);
    setNotice(null);
    try {
      if (type === "brand") {
        const { error } = await supabase.from("brands").update({ activity_status: status }).eq("id", id);
        if (error) throw error;
      }
      if (type === "series") {
        const { error } = await supabase.from("series").update({ activity_status: status, activity_status_manual: true }).eq("id", id);
        if (error) throw error;
      }
      if (type === "model") {
        const { error } = await supabase.from("models_jumdata").update({ activity_status: status }).eq("id", id);
        if (error) throw error;
      }
      setNotice("状态已保存");
      await loadBrands();
      resetCaches();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  }, [loadBrands, resetCaches]);

  const batchSetStatus = useCallback(async (params: { brandIds: string[]; seriesIds: string[]; modelIds: string[]; status: number; total: number }) => {
    const { brandIds, seriesIds, modelIds, status, total } = params;
    if (total === 0) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (brandIds.length > 0) {
        const { error } = await supabase.from("brands").update({ activity_status: status }).in("id", brandIds);
        if (error) throw error;
      }
      if (seriesIds.length > 0) {
        const { error } = await supabase
          .from("series")
          .update({ activity_status: status, activity_status_manual: true })
          .in("id", seriesIds);
        if (error) throw error;
      }
      if (modelIds.length > 0) {
        const { error } = await supabase.from("models_jumdata").update({ activity_status: status }).in("id", modelIds);
        if (error) throw error;
      }
      setNotice(`已更新 ${total} 个节点状态`);
      await loadBrands();
      resetCaches();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新状态失败");
    } finally {
      setLoading(false);
    }
  }, [loadBrands, resetCaches]);

  const deleteSeriesAssets = useCallback(async (seriesJmIds: number[], kind: "exterior_vr" | "interior_vr" | "official_images") => {
    if (seriesJmIds.length === 0) return;
    setError(null);
    setNotice(null);
    const patch = kind === "exterior_vr" ? { exterior_vr: [] } : kind === "interior_vr" ? { interior_vr: [] } : { official_images: [] };
    const { error } = await supabase.from("series_vr_config").update(patch as any).in("series_jm_id", seriesJmIds);
    if (error) throw error;
  }, []);

  const deleteModelImages = useCallback(async (modelJmIds: number[], kind: "exterior" | "interior") => {
    if (modelJmIds.length === 0) return;
    const [{ error: picErr }, { error: cfgErr }] = await Promise.all([
      supabase.from("car_pictures").delete().in("model_jm_id", modelJmIds).eq("category", kind),
      supabase
        .from("model_image_config")
        .update(kind === "exterior" ? { exterior_images: [] } : { interior_images: [] })
        .in("model_jm_id", modelJmIds),
    ]);
    if (picErr) throw picErr;
    if (cfgErr) throw cfgErr;
  }, []);

  const reloadKeepExpanded = useCallback(
    async (keepBrands: Set<number>, keepSeries: Set<number>) => {
      await loadBrands();
      setSeriesByBrand(new Map());
      setModelsBySeries(new Map());
      setSeriesVrBySeries(new Map());
      setModelImgByModel(new Map());
      setModelHasDetails(new Set());
      setModelHotSaleByModel(new Map());
      setExpandedBrands(new Set());
      setExpandedSeries(new Set());

      for (const b of keepBrands) {
        await ensureSeriesLoaded(b);
      }
      setExpandedBrands(new Set(keepBrands));

      for (const s of keepSeries) {
        await ensureModelsLoaded(s);
      }
      setExpandedSeries(new Set(keepSeries));
    },
    [ensureModelsLoaded, ensureSeriesLoaded, loadBrands]
  );

  useEffect(() => {
    loadBrands();
    resetCaches();
  }, [loadBrands, resetCaches]);

  return {
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
  };
}
