import { supabase } from "@/utils/supabaseClient";
import { resolveTableName } from "@/utils/entityTranslation";

export type CarPicture = {
  id: string;
  model_jm_id: number;
  category: string;
  image_url: string;
  sort_order: number;
  activity_status?: number | null;
};

export type ModelJumdata = {
  id: string;
  jm_id: number;
  series_id?: string | null;
  series_jm_id: number | null;
  brand_id?: string | null;
  brand_name?: string | null;
  series_name?: string | null;
  name: string;
  logo_url: string | null;
  yeartype: string | null;
  price: string | null;
  salestate: string | null;
  sizetype: string | null;
  displacement: string | null;
  displacement2: string | null;
  geartype: string | null;
};

export type ModelDetails = {
  id: string;
  model_id: string | null;
  model_jm_id: number;
  name: string;
  yeartype: string | null;
  price: string | null;
  sizetype: string | null;
  seatnum: string | null;
  drivemode: string | null;
  displacement2: string | null;
  geartype: string | null;
  raw: Record<string, unknown> | null;
};

export type SeriesVrExteriorGroup = {
  id: string;
  color_code: string;
  color_name: string;
  images: string[];
};

export type SeriesVrInteriorPositionGroup = {
  id: string;
  position: string;
  position_name: string;
  images: string[];
};

export type SeriesVrInteriorColorGroup = {
  id: string;
  color_name: string;
  color_value?: string;
  positions: SeriesVrInteriorPositionGroup[];
};

type ModelImageConfig = {
  model_jm_id: number;
  exterior_images: string[] | null;
  interior_images: string[] | null;
  official_images: string[] | null;
};

export async function loadModelDetailData(modelId: string, locale?: string) {
  const modelsTable = resolveTableName("models_jumdata", locale ?? "zh-CN");
  const detailsTable = resolveTableName("model_details", locale ?? "zh-CN");

  const { data, error: mErr } = await supabase
    .from(modelsTable)
    .select("*")
    .eq("id", modelId)
    .eq("activity_status", 0)
    .maybeSingle();

  if (mErr) throw mErr;
  if (!data) return { model: null as ModelJumdata | null, details: null as ModelDetails | null, pictures: [] as CarPicture[] };

  const m = data as ModelJumdata;

  const [{ data: dData, error: dErr }, { data: pData, error: pErr }, { data: cfgData, error: cfgErr }] = await Promise.all([
    supabase
      .from(detailsTable)
      .select("id, model_id, model_jm_id, name, yeartype, price, sizetype, seatnum, drivemode, displacement2, geartype, raw")
      .eq("model_id", m.id)
      .maybeSingle(),
    supabase
      .from("car_pictures")
      .select("id, model_jm_id, category, image_url, sort_order, activity_status")
      .eq("model_jm_id", m.jm_id)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("model_image_config")
      .select("model_jm_id, exterior_images, interior_images, official_images")
      .eq("model_jm_id", m.jm_id)
      .maybeSingle(),
  ]);

  if (dErr) throw dErr;
  if (pErr) throw pErr;
  if (cfgErr) throw cfgErr;

  const picturesBase = (pData as CarPicture[]) ?? [];
  const cfg = (cfgData as ModelImageConfig) ?? null;

  const hasCat = (cat: string) =>
    picturesBase.some((p) => (p.category || "").trim() === cat && typeof p.image_url === "string" && p.image_url.trim());

  const toPics = (cat: string, urls: string[]) =>
    urls
      .filter((u) => typeof u === "string" && u.trim())
      .map((u, idx) => ({
        id: `cfg_${cat}_${idx}`,
        model_jm_id: m.jm_id,
        category: cat,
        image_url: u,
        sort_order: idx,
        activity_status: 0,
      }));

  const cfgExterior = Array.isArray(cfg?.exterior_images) ? cfg!.exterior_images : [];
  const cfgInterior = Array.isArray(cfg?.interior_images) ? cfg!.interior_images : [];
  const cfgOfficial = Array.isArray(cfg?.official_images) ? cfg!.official_images : [];

  const officialFallback = cfgOfficial;

  const extras: CarPicture[] = [
    ...(hasCat("exterior") ? [] : toPics("exterior", cfgExterior)),
    ...(hasCat("interior") ? [] : toPics("interior", cfgInterior)),
    ...(hasCat("official") ? [] : toPics("official", officialFallback)),
  ];

  const dedupKey = (p: CarPicture) => `${(p.category || "").trim()}|${String(p.image_url || "").trim()}`;
  const seen = new Set<string>();
  const mergedPictures = [...picturesBase, ...extras].filter((p) => {
    const k = dedupKey(p);
    if (!k.endsWith("|")) {
      if (seen.has(k)) return false;
      seen.add(k);
    }
    return true;
  });

  return {
    model: m,
    details: (dData as ModelDetails) ?? null,
    pictures: mergedPictures,
  };
}

export type SeriesModelListItem = {
  id: string;
  name: string;
  yeartype: string | null;
  price: string | null;
  salestate: string | null;
  updated_at?: string | null;
};

export async function loadSeriesModels(seriesId: string, locale?: string) {
  const id = String(seriesId || "").trim();
  if (!id) return [] as SeriesModelListItem[];
  const table = resolveTableName("models_jumdata", locale ?? "zh-CN");
  const { data, error } = await supabase
    .from(table)
    .select("id, name, yeartype, price, salestate, updated_at")
    .eq("series_id", id)
    .eq("activity_status", 0)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id || ""),
    name: String(r.name || ""),
    yeartype: r.yeartype ?? null,
    price: r.price ?? null,
    salestate: r.salestate ?? null,
    updated_at: r.updated_at ?? null,
  })) as SeriesModelListItem[];
}

export function normalizePictures(pictures: CarPicture[]) {
  const map: Record<string, string[]> = {};
  pictures
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .forEach((p) => {
      const cat = (p.category || "").trim();
      if (!cat) return;
      if (!map[cat]) map[cat] = [];
      map[cat].push(p.image_url);
    });
  Object.keys(map).forEach((k) => {
    map[k] = map[k].filter((s) => typeof s === "string" && s.trim());
  });
  return map;
}
