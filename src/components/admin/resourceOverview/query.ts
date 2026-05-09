import { supabase } from "@/utils/supabaseClient";
import {
  buildCarPictureCountsByModel,
  countSeriesVrImages,
  mergeModelEffectiveCategories,
  mergeSeriesImageOverview,
  safeStringArrayLen,
  type CarPictureRow,
  type ModelImageConfigRow,
  type SeriesVrConfigRow,
} from "@/utils/resourceOverview";

export type BrandRow = {
  jm_id: number;
  name: string;
  depth: number;
  activity_status: number | null;
};

export type SeriesRow = {
  jm_id: number;
  name: string;
  brand_jm_id: number;
  activity_status: number | null;
};

export type ModelRow = {
  jm_id: number;
  name: string;
  brand_jm_id: number;
  series_jm_id: number;
  activity_status: number;
};

export type OverviewRow = {
  brandJmId: number;
  brandName: string;
  seriesJmId: number;
  seriesName: string;
  modelCount: number;
  vr: ReturnType<typeof countSeriesVrImages>;
  images: ReturnType<typeof mergeSeriesImageOverview>;
};

async function fetchAll<T>(q: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>, pageSize = 5000) {
  let from = 0;
  const out: T[] = [];
  while (true) {
    const { data, error } = await q(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data || []) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

export async function loadBaseOptions() {
  const [{ data: bData, error: bErr }, { data: sData, error: sErr }] = await Promise.all([
    supabase.from("brands").select("jm_id, name, depth, activity_status").eq("depth", 1).order("name"),
    supabase.from("series").select("jm_id, name, brand_jm_id, activity_status").order("name"),
  ]);
  if (bErr) throw bErr;
  if (sErr) throw sErr;
  return {
    brands: (bData || []) as BrandRow[],
    seriesList: (sData || []) as SeriesRow[],
  };
}

export async function queryOverviewData(params: {
  brands: BrandRow[];
  seriesList: SeriesRow[];
  onlyNormal: boolean;
  brandFilter: number | null;
  seriesFilter: number | null;
  keyword: string;
}) {
  const { brands, seriesList, onlyNormal, brandFilter, seriesFilter, keyword } = params;

  const brandNameById = new Map<number, string>();
  for (const b of brands) brandNameById.set(b.jm_id, b.name);

  const kw = keyword.trim();
  const seriesCandidates = seriesList
    .filter((s) => {
      if (onlyNormal && (s.activity_status ?? 0) !== 0) return false;
      if (brandFilter && s.brand_jm_id !== brandFilter) return false;
      if (seriesFilter && s.jm_id !== seriesFilter) return false;
      if (!kw) return true;
      const bn = brandNameById.get(s.brand_jm_id) ?? "";
      return bn.includes(kw) || s.name.includes(kw);
    })
    .sort((a, b) => {
      const ab = (brandNameById.get(a.brand_jm_id) ?? "").localeCompare(brandNameById.get(b.brand_jm_id) ?? "");
      if (ab !== 0) return ab;
      return a.name.localeCompare(b.name);
    });

  const seriesIdSet = new Set(seriesCandidates.map((s) => s.jm_id));

  const models = await fetchAll<ModelRow>((from, to) => {
    let q = supabase
      .from("models_jumdata")
      .select("jm_id, name, brand_jm_id, series_jm_id, activity_status")
      .range(from, to);
    if (onlyNormal) q = q.eq("activity_status", 0);
    if (brandFilter) q = q.eq("brand_jm_id", brandFilter);
    if (seriesFilter) q = q.eq("series_jm_id", seriesFilter);
    return q;
  });

  const modelCountBySeries = new Map<number, number>();
  const modelToSeries = new Map<number, number>();
  for (const m of models) {
    if (typeof m.series_jm_id !== "number") continue;
    if (seriesIdSet.size > 0 && !seriesIdSet.has(m.series_jm_id)) continue;
    modelToSeries.set(m.jm_id, m.series_jm_id);
    modelCountBySeries.set(m.series_jm_id, (modelCountBySeries.get(m.series_jm_id) ?? 0) + 1);
  }

  const [vrCfgRows, imgCfgRows, carPics] = await Promise.all([
    fetchAll<SeriesVrConfigRow>((from, to) => {
      let q = supabase
        .from("series_vr_config")
        .select("id, series_jm_id, brand_jm_id, brand_name, series_name, exterior_vr, interior_vr, official_images")
        .range(from, to);
      if (brandFilter) q = q.eq("brand_jm_id", brandFilter);
      if (seriesFilter) q = q.eq("series_jm_id", seriesFilter);
      return q;
    }),
    fetchAll<ModelImageConfigRow>((from, to) => {
      let q = supabase
        .from("model_image_config")
        .select(
          "id, model_jm_id, model_name, brand_jm_id, brand_name, series_jm_id, series_name, exterior_images, interior_images, official_images"
        )
        .range(from, to);
      if (brandFilter) q = q.eq("brand_jm_id", brandFilter);
      if (seriesFilter) q = q.eq("series_jm_id", seriesFilter);
      return q;
    }),
    fetchAll<CarPictureRow>((from, to) => {
      let q = supabase
        .from("car_pictures")
        .select("id, model_jm_id, category, image_url, brand_jm_id, brand_name, series_jm_id, series_name")
        .range(from, to);
      if (brandFilter) q = q.eq("brand_jm_id", brandFilter);
      if (seriesFilter) q = q.eq("series_jm_id", seriesFilter);
      return q;
    }),
  ]);

  const vrCfgBySeries = new Map<number, SeriesVrConfigRow>();
  for (const r of vrCfgRows) {
    if (typeof r.series_jm_id !== "number") continue;
    if (seriesIdSet.size > 0 && !seriesIdSet.has(r.series_jm_id)) continue;
    vrCfgBySeries.set(r.series_jm_id, r);
  }

  const cfgByModel = new Map<number, ModelImageConfigRow>();
  for (const r of imgCfgRows) {
    if (typeof r.model_jm_id !== "number") continue;
    const sid = typeof r.series_jm_id === "number" ? r.series_jm_id : modelToSeries.get(r.model_jm_id);
    if (typeof sid === "number" && seriesIdSet.size > 0 && !seriesIdSet.has(sid)) continue;
    cfgByModel.set(r.model_jm_id, r);
  }

  const normalizedCarPics: CarPictureRow[] = [];
  for (const p of carPics) {
    const sid = typeof p.series_jm_id === "number" ? p.series_jm_id : modelToSeries.get(p.model_jm_id) ?? null;
    if (typeof sid === "number" && seriesIdSet.size > 0 && !seriesIdSet.has(sid)) continue;
    normalizedCarPics.push({ ...p, series_jm_id: sid });
  }

  const carPicturesByModel = buildCarPictureCountsByModel(normalizedCarPics);
  const modelIdsWithAnyBySeries = new Map<number, Set<number>>();

  const addModelToSeries = (modelJmId: number, seriesJmId: number) => {
    let set = modelIdsWithAnyBySeries.get(seriesJmId);
    if (!set) {
      set = new Set();
      modelIdsWithAnyBySeries.set(seriesJmId, set);
    }
    set.add(modelJmId);
  };

  for (const modelJmId of carPicturesByModel.keys()) {
    const sid = modelToSeries.get(modelJmId);
    if (typeof sid === "number") addModelToSeries(modelJmId, sid);
  }

  for (const [modelJmId, cfg] of cfgByModel.entries()) {
    const sid = typeof cfg.series_jm_id === "number" ? cfg.series_jm_id : modelToSeries.get(modelJmId);
    if (typeof sid !== "number") continue;
    const total = safeStringArrayLen(cfg.exterior_images) + safeStringArrayLen(cfg.interior_images) + safeStringArrayLen(cfg.official_images);
    if (total > 0) addModelToSeries(modelJmId, sid);
  }

  const rows: OverviewRow[] = seriesCandidates.map((s) => {
    const brandName = brandNameById.get(s.brand_jm_id) ?? String(s.brand_jm_id);
    const vr = countSeriesVrImages(vrCfgBySeries.get(s.jm_id));
    const modelIds = Array.from(modelIdsWithAnyBySeries.get(s.jm_id) ?? new Set<number>());
    const cfg = vrCfgBySeries.get(s.jm_id);
    const images = mergeSeriesImageOverview({
      modelJmIds: modelIds,
      carPicturesByModel,
      cfgByModel,
      seriesOfficialImages: (cfg as any)?.official_images,
      seriesModelCount: modelCountBySeries.get(s.jm_id) ?? 0,
    });
    return {
      brandJmId: s.brand_jm_id,
      brandName,
      seriesJmId: s.jm_id,
      seriesName: s.name,
      modelCount: modelCountBySeries.get(s.jm_id) ?? 0,
      vr,
      images,
    };
  });

  return {
    rows,
    lastUpdatedAt: new Date().toLocaleString(),
  };
}

export async function loadModelCoverage(params: { seriesJmId: number }) {
  const { seriesJmId } = params;
  const models = await fetchAll<ModelRow>((from, to) =>
    supabase
      .from("models_jumdata")
      .select("jm_id, name, brand_jm_id, series_jm_id, activity_status")
      .eq("series_jm_id", seriesJmId)
      .eq("activity_status", 0)
      .order("name")
      .range(from, to)
  );

  const [pics, cfgs] = await Promise.all([
    fetchAll<CarPictureRow>((from, to) =>
      supabase
        .from("car_pictures")
        .select("model_jm_id, category, image_url, series_jm_id")
        .eq("series_jm_id", seriesJmId)
        .range(from, to)
    ),
    fetchAll<ModelImageConfigRow>((from, to) =>
      supabase
        .from("model_image_config")
        .select("model_jm_id, series_jm_id, exterior_images, interior_images, official_images")
        .eq("series_jm_id", seriesJmId)
        .range(from, to)
    ),
  ]);

  const carPicturesByModel = buildCarPictureCountsByModel(pics);
  const cfgByModel = new Map<number, ModelImageConfigRow>();
  for (const r of cfgs) {
    if (typeof r.model_jm_id === "number") cfgByModel.set(r.model_jm_id, r);
  }

  const items = models
    .map((m) => {
      const car = carPicturesByModel.get(m.jm_id);
      const cfg = cfgByModel.get(m.jm_id);

      const eff = mergeModelEffectiveCategories({ carPictureCounts: car, cfg });

      return {
        jm_id: m.jm_id,
        name: m.name,
        source: eff.source,
        total: eff.total,
        categories: eff.categories,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return items;
}
