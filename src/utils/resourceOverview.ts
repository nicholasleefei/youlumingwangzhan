export type CarPictureRow = {
  id?: string;
  model_jm_id: number;
  category: string;
  image_url: string;
  brand_jm_id?: number | null;
  brand_name?: string | null;
  series_jm_id?: number | null;
  series_name?: string | null;
};

export type ModelImageConfigRow = {
  id?: string;
  model_jm_id: number;
  model_name?: string | null;
  brand_jm_id?: number | null;
  brand_name?: string | null;
  series_jm_id?: number | null;
  series_name?: string | null;
  exterior_images?: unknown;
  interior_images?: unknown;
  official_images?: unknown;
};

export type SeriesVrConfigRow = {
  id?: string;
  series_jm_id: number;
  brand_jm_id?: number | null;
  brand_name?: string | null;
  series_name?: string | null;
  exterior_vr?: unknown;
  interior_vr?: unknown;
  official_images?: unknown;
};

export type MergedModelCategoryStat = {
  count: number;
  source: "car_pictures" | "model_image_config" | "none";
};

export type MergedModelImageStats = {
  exterior: MergedModelCategoryStat;
  interior: MergedModelCategoryStat;
  official: MergedModelCategoryStat;
  total: number;
  hasAny: boolean;
};

export type SeriesImageOverview = {
  modelWithAnyCount: number;
  totalCount: number;
  categories: Record<string, number>;
};

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function safeStringArrayLen(v: unknown) {
  if (!Array.isArray(v)) return 0;
  let n = 0;
  for (const it of v) {
    if (isNonEmptyString(it)) n += 1;
  }
  return n;
}

export function normalizeCategory(cat: unknown) {
  return String(cat ?? "").trim();
}

export function buildCarPictureCountsByModel(pics: CarPictureRow[]) {
  const byModel = new Map<number, Map<string, number>>();

  for (const p of pics) {
    if (typeof p?.model_jm_id !== "number") continue;
    const cat = normalizeCategory(p.category);
    if (!cat) continue;
    if (!isNonEmptyString(p.image_url)) continue;

    let m = byModel.get(p.model_jm_id);
    if (!m) {
      m = new Map();
      byModel.set(p.model_jm_id, m);
    }
    m.set(cat, (m.get(cat) ?? 0) + 1);
  }

  return byModel;
}

export function mergeModelImages(params: {
  carPictureCounts: Map<string, number> | undefined;
  cfg: ModelImageConfigRow | undefined;
}) {
  const { carPictureCounts, cfg } = params;

  const carExterior = carPictureCounts?.get("exterior") ?? 0;
  const carInterior = carPictureCounts?.get("interior") ?? 0;
  const carOfficial = carPictureCounts?.get("official") ?? 0;

  const cfgExterior = safeStringArrayLen(cfg?.exterior_images);
  const cfgInterior = safeStringArrayLen(cfg?.interior_images);
  const cfgOfficial = safeStringArrayLen(cfg?.official_images);

  const exterior: MergedModelCategoryStat =
    carExterior > 0
      ? { count: carExterior, source: "car_pictures" }
      : cfgExterior > 0
        ? { count: cfgExterior, source: "model_image_config" }
        : { count: 0, source: "none" };

  const interior: MergedModelCategoryStat =
    carInterior > 0
      ? { count: carInterior, source: "car_pictures" }
      : cfgInterior > 0
        ? { count: cfgInterior, source: "model_image_config" }
        : { count: 0, source: "none" };

  const official: MergedModelCategoryStat =
    carOfficial > 0
      ? { count: carOfficial, source: "car_pictures" }
      : cfgOfficial > 0
        ? { count: cfgOfficial, source: "model_image_config" }
        : { count: 0, source: "none" };

  const total = exterior.count + interior.count + official.count;
  const hasAny = total > 0;

  const out: MergedModelImageStats = {
    exterior,
    interior,
    official,
    total,
    hasAny,
  };

  return out;
}

export function mergeModelEffectiveCategories(params: {
  carPictureCounts: Map<string, number> | undefined;
  cfg: ModelImageConfigRow | undefined;
}) {
  const { carPictureCounts, cfg } = params;

  const categories: Record<string, number> = {};

  let carTotal = 0;
  if (carPictureCounts) {
    for (const [k, v] of carPictureCounts.entries()) {
      if (typeof v === "number" && v > 0) {
        categories[k] = (categories[k] ?? 0) + v;
        carTotal += v;
      }
    }
  }

  if (carTotal > 0) {
    return {
      categories,
      total: carTotal,
      hasAny: true,
      source: "car_pictures" as const,
    };
  }

  const cfgExterior = safeStringArrayLen(cfg?.exterior_images);
  const cfgInterior = safeStringArrayLen(cfg?.interior_images);
  const cfgOfficial = safeStringArrayLen(cfg?.official_images);

  if (cfgExterior > 0) categories.exterior = cfgExterior;
  if (cfgInterior > 0) categories.interior = cfgInterior;
  if (cfgOfficial > 0) categories.official = cfgOfficial;

  const total = cfgExterior + cfgInterior + cfgOfficial;

  return {
    categories,
    total,
    hasAny: total > 0,
    source: total > 0 ? ("model_image_config" as const) : ("none" as const),
  };
}

export function countSeriesVrImages(cfg: SeriesVrConfigRow | null | undefined) {
  let exteriorGroupCount = 0;
  let exteriorImageCount = 0;

  const exterior = cfg?.exterior_vr;
  if (Array.isArray(exterior)) {
    for (const g of exterior) {
      const images = (g as any)?.images;
      const n = safeStringArrayLen(images);
      if (n > 0) {
        exteriorGroupCount += 1;
        exteriorImageCount += n;
      }
    }
  }

  let interiorColorCount = 0;
  let interiorImageCount = 0;

  const interior = cfg?.interior_vr;
  if (Array.isArray(interior)) {
    for (const c of interior) {
      const positions = (c as any)?.positions;
      let foundAny = false;
      if (Array.isArray(positions)) {
        for (const p of positions) {
          const images = (p as any)?.images;
          const n = safeStringArrayLen(images);
          if (n > 0) {
            foundAny = true;
            interiorImageCount += n;
          }
        }
      }
      if (foundAny) interiorColorCount += 1;
    }
  }

  return {
    hasExterior: exteriorImageCount > 0,
    hasInterior: interiorImageCount > 0,
    exteriorGroupCount,
    exteriorImageCount,
    interiorColorCount,
    interiorImageCount,
    totalImageCount: exteriorImageCount + interiorImageCount,
  };
}

export function mergeSeriesImageOverview(params: {
  modelJmIds: number[];
  carPicturesByModel: Map<number, Map<string, number>>;
  cfgByModel: Map<number, ModelImageConfigRow>;
  seriesOfficialImages?: unknown;
  seriesModelCount?: number;
}) {
  const { modelJmIds, carPicturesByModel, cfgByModel, seriesOfficialImages, seriesModelCount } = params;

  const categories: Record<string, number> = {};

  let modelWithAnyCount = 0;
  let totalCount = 0;

  for (const modelJmId of modelJmIds) {
    const stats = mergeModelEffectiveCategories({ carPictureCounts: carPicturesByModel.get(modelJmId), cfg: cfgByModel.get(modelJmId) });
    if (stats.hasAny) modelWithAnyCount += 1;
    for (const [k, v] of Object.entries(stats.categories)) {
      categories[k] = (categories[k] ?? 0) + v;
    }
    totalCount += stats.total;
  }

  const seriesOfficialCount = safeStringArrayLen(seriesOfficialImages);
  if (seriesOfficialCount > 0) {
    categories.official = (categories.official ?? 0) + seriesOfficialCount;
    totalCount += seriesOfficialCount;
    const mc = typeof seriesModelCount === "number" && seriesModelCount > 0 ? seriesModelCount : 0;
    if (mc > modelWithAnyCount) modelWithAnyCount = mc;
  }

  const out: SeriesImageOverview = {
    modelWithAnyCount,
    totalCount,
    categories,
  };

  return out;
}
