import { supabase } from "./supabaseClient";
import type { Locale } from "@/i18n/locales";
import { fetchEntityTranslations, applyBrandTranslations, applySeriesTranslations } from "./entityTranslation";
import type { EntityTranslationData } from "./entityTranslation";

export type BrandRow = {
  id: string;
  jm_id: number;
  name: string;
  fullname: string | null;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  activity_status: number;
  created_at: string;
  updated_at: string;
};

export type SeriesRow = {
  id: string;
  jm_id: number;
  brand_jm_id: number;
  brand_id: string;
  name: string;
  fullname: string | null;
  initial: string | null;
  logo_url: string | null;
  salestate: string | null;
  depth: number;
  subcompany_name: string | null;
  subcompany_jm_id: number | null;
  activity_status: number;
  created_at: string;
  updated_at: string;
};

export type ModelRow = {
  id: string;
  slug: string | null;
  name: string;
  fullname: string | null;
  brand: string | null;
  vehicle_class: string | null;
  energy_type: string | null;
  year: number | null;
  fob_price_min: number | null;
  fob_price_max: number | null;
  currency: string;
  is_hot: boolean;
  is_active: boolean;
  manufacturer: string | null;
  level: string | null;
  cltc_range: number | null;
  charging_time_fast: string | null;
  charging_time_slow: string | null;
  fast_charge_percentage: number | null;
  motor_type: string | null;
  transmission: string | null;
  motor_horsepower: number | null;
  motor_total_power: number | null;
  motor_total_torque: number | null;
  body_type: string | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  wheelbase_mm: number | null;
  max_speed: number | null;
  acceleration_0_100: number | null;
  seats: number | null;
  series_id: string | null;
  specs: Record<string, unknown>;
  activity_status: number;
  created_at: string;
  updated_at: string;
  exterior_images?: string[] | null;
  interior_images?: string[] | null;
};

export type ModelImageRow = {
  id: string;
  model_id: string;
  path: string;
  alt: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type ModelTranslationRow = {
  id: string;
  model_id: string;
  locale: string;
  name: string;
  summary: string | null;
  description: string | null;
  seo: Record<string, unknown>;
  updated_at: string;
};

export type InquiryInsert = {
  locale: string;
  company_name: string;
  contact_name: string;
  email: string;
  whatsapp?: string | null;
  country_region?: string | null;
  incoterm?: string | null;
  destination_port?: string | null;
  total_quantity?: number | null;
  need_by?: string | null;
  note?: string | null;
};

export type InquiryRow = {
  id: string;
  inquiry_no: string;
  locale: string | null;
  company_name: string;
  contact_name: string;
  email: string;
  whatsapp: string | null;
  country_region: string | null;
  incoterm: string | null;
  destination_port: string | null;
  total_quantity: number | null;
  need_by: string | null;
  note: string | null;
  status: "new" | "contacted" | "qualified" | "quoting" | "quoted" | "negotiating" | "won" | "lost";
  admin_note: string | null;
  customer_id?: string | null;
  assigned_admin_id?: string | null;
  next_follow_up_at?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  updated_by_admin_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type InquiryItemInsert = {
  inquiry_id: string;
  model_id: string | null;
  series_id?: string | null;
  item_type?: "model" | "series";
  quantity?: number | null;
  note?: string | null;
};

export type CountrySalesRow = {
  id: string;
  country_name: string;
  sales_volume: number;
  created_at: string;
  updated_at: string;
};

// 知识库类型
export type KnowledgeBaseCategoryRow = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type KnowledgeBaseCategoryInsert = {
  name: string;
  sort_order?: number;
};

export type KnowledgeBaseCategoryUpdate = Partial<KnowledgeBaseCategoryInsert> & {
  id: string;
};

export type KnowledgeBaseRow = {
  id: string;
  title: string;
  content_type: 'text' | 'file';
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  category: string | null;
  tags: string[] | null;
  is_active: boolean;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeBaseInsert = {
  title: string;
  content_type: 'text' | 'file';
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_active?: boolean;
  embedding?: number[] | null;
};

export type KnowledgeBaseUpdate = Partial<KnowledgeBaseInsert> & {
  id: string;
};

export type ModelListItem = ModelRow & {
  display_name: string;
  summary: string | null;
  cover_image: string | null;
  fuel_type: string | null;
  series_name: string | null;
};

export type InquirySelectedModel = {
  id: string;
  display_name: string;
  brand: string | null;
  series_name: string | null;
};

function buildInquiryDisplayName(name: string, yeartype: string | null) {
  const n = String(name ?? "").trim();
  const y = String(yeartype ?? "").trim();
  if (!n) return "";
  if (!y) return n;
  return n.includes(y) ? n : `${y} ${n}`;
}

function pickDisplayName(model: ModelRow, tr: ModelTranslationRow | undefined) {
  return tr?.name ?? model.name;
}

// Cache — keyed by locale; wiped on translation updates
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

export function clearBrandSeriesCache() {
  Object.keys(cache).forEach(k => {
    if (k.startsWith("listBrands_") || k.startsWith("listSeries_")) delete cache[k];
  });
}

function getCachedData(key: string) {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  delete cache[key];
  return null;
}

function setCachedData(key: string, data: any) {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
}

export async function listModels(params: {
  locale: Locale;
  search?: string;
  onlyHot?: boolean;
}) {
  const { locale, search, onlyHot } = params;
  const cacheKey = `listModels_${locale}_${search || ''}_${onlyHot || false}_v2`;

  // 检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let q = supabase
    .from("models")
    .select("*")
    .eq("is_active", true)
    .in("activity_status", [0])
    .order("is_hot", { ascending: false })
    .order("updated_at", { ascending: false });

  if (onlyHot) q = q.eq("is_hot", true);
  if (search) q = q.ilike("name", `%${search}%`);

  const [{ data: models, error: modelErr }, { data: translations, error: trErr }, { data: seriesList, error: seriesErr }, { data: brands, error: brandErr }] = await Promise.all([
    q,
    supabase.from("model_translations").select("*").eq("locale", locale),
    supabase.from("series").select("id, jm_id, activity_status, brand_id, name, fullname"),
    supabase.from("brands").select("id, jm_id, activity_status, name"),
  ]);

  if (modelErr) throw modelErr;
  if (trErr) throw trErr;
  if (seriesErr) throw seriesErr;
  if (brandErr) throw brandErr;

  const modelJmIds = (models ?? []).map((m: any) => m?.jm_id).filter((x: any) => typeof x === "number" && Number.isFinite(x));
  const { data: images, error: imgErr } =
    modelJmIds.length > 0
      ? await supabase
          .from("car_pictures")
          .select("model_jm_id, image_url, sort_order")
          .eq("category", "official")
          .in("model_jm_id", modelJmIds)
          .order("sort_order", { ascending: true })
      : ({ data: [], error: null } as any);
  if (imgErr) throw imgErr;

  // 构建状态检查的Map
  const seriesStatusMap = new Map<string, { jm_id?: number; activity_status: number; brand_id: string | null; name: string; fullname: string | null }>();
  (seriesList ?? []).forEach((s) => seriesStatusMap.set(s.id, { jm_id: s.jm_id ?? undefined, activity_status: s.activity_status, brand_id: s.brand_id, name: s.name, fullname: s.fullname ?? null }));

  const brandStatusMap = new Map<string, number>();
  (brands ?? []).forEach((b) => brandStatusMap.set(b.id, b.activity_status));

  // 过滤掉品牌或车系状态无效的车型
  const validModels = (models ?? []).filter((model) => {
    if (!model.series_id) return true;
    const series = seriesStatusMap.get(model.series_id);
    if (!series) return true;
    if (series.activity_status !== 0) return false;
    if (!series.brand_id) return true;
    const brandStatus = brandStatusMap.get(series.brand_id);
    return brandStatus === undefined || brandStatus === 0;
  });

  const trMap = new Map<string, ModelTranslationRow>();
  (translations ?? []).forEach((t) => trMap.set(t.model_id, t));

  const coverMap = new Map<number, string>();
  (images ?? []).forEach((img: any) => {
    const mid = typeof img?.model_jm_id === "number" ? img.model_jm_id : null;
    const url = typeof img?.image_url === "string" ? img.image_url : null;
    if (!mid || !url) return;
    if (!coverMap.has(mid)) coverMap.set(mid, url);
  });

  // Fetch entity translations for brand & series names
  const brandJmIds: number[] = [];
  const seriesJmIds: number[] = [];
  (seriesList ?? []).forEach((s: any) => {
    if (typeof s.jm_id === "number") seriesJmIds.push(s.jm_id);
  });
  (brands ?? []).forEach((b: any) => {
    if (typeof b.jm_id === "number") brandJmIds.push(b.jm_id);
  });

  const [brandTr, seriesTr] = await Promise.all([
    brandJmIds.length > 0 ? fetchEntityTranslations("brand", brandJmIds, locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
    seriesJmIds.length > 0 ? fetchEntityTranslations("series", seriesJmIds, locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
  ]);

  // Build brand-id -> name map for series brand lookup
  const brandNameOfId = new Map<string, string>();
  (brands ?? []).forEach((b: any) => {
    const translated = brandTr.get(String(b.jm_id))?.name ?? b.name;
    brandNameOfId.set(b.id, translated);
  });

  const items: ModelListItem[] = validModels.map((m: any) => {
    const tr = trMap.get(m.id);
    const seriesInfo = m.series_id ? seriesStatusMap.get(m.series_id) : null;
    const rawSeriesName = seriesInfo ? (seriesInfo.fullname || seriesInfo.name) : null;
    const translatedSeriesName = seriesInfo ? (seriesTr.get(String(seriesInfo.jm_id))?.name ?? seriesTr.get(String(seriesInfo.jm_id))?.fullname ?? rawSeriesName) : null;
    const seriesName = translatedSeriesName ?? rawSeriesName;

    const jmExterior = Array.isArray(m.exterior_images) ? m.exterior_images.filter((u: any) => typeof u === "string" && u.trim()) : [];
    const jumeFallback = (jmExterior[0] as string | undefined) ?? null;

    // Translate brand name if possible, else use raw value
    const rawBrand = typeof m.brand === "string" ? m.brand : null;
    const translatedBrand = (seriesInfo && seriesInfo.brand_id) ? (brandNameOfId.get(seriesInfo.brand_id) ?? rawBrand) : rawBrand;

    return {
      ...m,
      display_name: pickDisplayName(m, tr),
      summary: tr?.summary ?? null,
      cover_image: coverMap.get(m.jm_id) ?? jumeFallback,
      fuel_type: m.energy_type,
      series_name: seriesName,
      brand: translatedBrand,
    };
  });

  // 缓存结果
  setCachedData(cacheKey, items);
  return items;
}

export async function listModelsByIds(params: {
  ids: string[];
  locale: Locale;
}) {
  const { ids, locale } = params;
  const uniqIds = Array.from(new Set(ids.map((x) => String(x || "").trim()).filter(Boolean)));
  if (uniqIds.length === 0) return [] as InquirySelectedModel[];

  const cacheKey = `listModelsByIds_inquiry_${uniqIds.slice().sort().join("|")}_${locale}_v2`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    const order = new Map(ids.map((id, idx) => [String(id), idx] as const));
    return (cachedData as InquirySelectedModel[]).slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  const { data: details, error: detErr } = await supabase
    .from("model_details")
    .select("model_id, name, yeartype, brandname, parentname, brand_jm_id, series_jm_id, jm_id")
    .in("model_id", uniqIds)
    .eq("activity_status", 0)
    .limit(5000);
  if (detErr) throw detErr;

  const byId = new Map<string, any>();
  const allBrandJmIds: number[] = [];
  const allSeriesJmIds: number[] = [];
  const allModelJmIds: number[] = [];
  (details ?? []).forEach((r: any) => {
    const id = String(r?.model_id ?? "").trim();
    if (!id) return;
    if (byId.has(id)) return;
    byId.set(id, r);
    if (typeof r.brand_jm_id === "number") allBrandJmIds.push(r.brand_jm_id);
    if (typeof r.series_jm_id === "number") allSeriesJmIds.push(r.series_jm_id);
    if (typeof r.jm_id === "number") allModelJmIds.push(r.jm_id);
  });

  const missingIds = uniqIds.filter((id) => !byId.has(id));
  if (missingIds.length > 0) {
    const { data: jmRows, error: jmErr } = await supabase
      .from("models_jumdata")
      .select("id, name, brand_name, series_name, brand_jm_id, series_jm_id")
      .in("id", missingIds)
      .eq("activity_status", 0)
      .limit(5000);
    if (jmErr) throw jmErr;
    (jmRows ?? []).forEach((r: any) => {
      const id = String(r?.id ?? "").trim();
      if (!id) return;
      if (byId.has(id)) return;
      byId.set(id, {
        model_id: id,
        name: r?.name ?? null,
        yeartype: null,
        brandname: r?.brand_name ?? null,
        parentname: r?.series_name ?? null,
        brand_jm_id: r?.brand_jm_id ?? null,
        series_jm_id: r?.series_jm_id ?? null,
        jm_id: r?.id ?? null,
      });
      if (typeof r.brand_jm_id === "number") allBrandJmIds.push(r.brand_jm_id);
      if (typeof r.series_jm_id === "number") allSeriesJmIds.push(r.series_jm_id);
      if (typeof r.id === "number") allModelJmIds.push(r.id);
    });
  }

  const [brandTr, seriesTr, modelTr] = await Promise.all([
    allBrandJmIds.length > 0 ? fetchEntityTranslations("brand", allBrandJmIds, locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
    allSeriesJmIds.length > 0 ? fetchEntityTranslations("series", allSeriesJmIds, locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
    allModelJmIds.length > 0 ? fetchEntityTranslations("model_detail", allModelJmIds, locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
  ]);

  const items: InquirySelectedModel[] = uniqIds
    .map((id) => {
      const r = byId.get(id);
      if (!r) return null;
      const rawBrand = r?.brandname ? String(r.brandname) : null;
      const rawSeries = r?.parentname ? String(r.parentname) : null;
      const rawName = String(r?.name ?? "");

      const translatedBrand = typeof r.brand_jm_id === "number" && brandTr.get(String(r.brand_jm_id))?.name
        ? brandTr.get(String(r.brand_jm_id))!.name!
        : rawBrand;
      const translatedSeries = typeof r.series_jm_id === "number" && seriesTr.get(String(r.series_jm_id))?.name
        ? seriesTr.get(String(r.series_jm_id))!.name!
        : rawSeries;
      const translatedName = typeof r.jm_id === "number"
        ? (modelTr.get(String(r.jm_id))?.name ?? rawName)
        : rawName;

      return {
        id,
        display_name: buildInquiryDisplayName(translatedName, r?.yeartype ?? null),
        brand: translatedBrand,
        series_name: translatedSeries,
      };
    })
    .filter(Boolean) as InquirySelectedModel[];

  setCachedData(cacheKey, items);
  const order = new Map(ids.map((id, idx) => [String(id), idx] as const));
  return items.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function listSeriesByIds(params: { ids: string[]; locale?: Locale }) {
  const { ids, locale } = params;
  const uniqIds = Array.from(new Set(ids.map((x) => String(x || "").trim()).filter(Boolean)));
  if (uniqIds.length === 0) return [] as Array<{ id: string; name: string; fullname: string | null; brand_name: string | null }>;

  const cacheKey = `listSeriesByIds_inquiry_${uniqIds.slice().sort().join("|")}_${locale ?? "none"}_v2`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    const order = new Map(ids.map((id, idx) => [String(id), idx] as const));
    return (cachedData as Array<{ id: string; name: string; fullname: string | null; brand_name: string | null }>).slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  const { data, error } = await supabase
    .from("series")
    .select("id, name, fullname, brand_name, jm_id")
    .in("id", uniqIds)
    .eq("activity_status", 0)
    .limit(5000);
  if (error) throw error;

  let items = (data ?? []) as Array<{ id: string; name: string; fullname: string | null; brand_name: string | null; jm_id?: number }>;

  if (locale && locale !== "zh-CN" && items.length > 0) {
    const jmIds = items.map((s: any) => s.jm_id as number).filter((n) => typeof n === "number" && Number.isFinite(n));
    if (jmIds.length > 0) {
      const translations = await fetchEntityTranslations("series", jmIds, locale);
      items = items.map((s: any) => ({
        ...s,
        name: translations.get(String(s.jm_id))?.name ?? s.name,
        fullname: translations.get(String(s.jm_id))?.fullname ?? s.fullname,
        brand_name: translations.get(String(s.jm_id))?.brandname ?? s.brand_name,
      }));
    }
  }

  setCachedData(cacheKey, items);
  const order = new Map(ids.map((id, idx) => [String(id), idx] as const));
  return items.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function getModelBySlug(params: { slug: string; locale: Locale }) {
  const { slug, locale } = params;
  const cacheKey = `getModelBySlug_${slug}_${locale}_v2`;

  // 检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const { data: model, error: modelErr } = await supabase
    .from("models")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .in("activity_status", [0])
    .maybeSingle();

  if (modelErr) throw modelErr;
  if (!model) return null;

  // 检查车系和品牌状态
  if (model.series_id) {
    const { data: series } = await supabase
      .from("series")
      .select("activity_status, brand_id")
      .eq("id", model.series_id)
      .single();
    
    if (!series || series.activity_status !== 0) {
      return null;
    }
    
    if (series.brand_id) {
      const { data: brand } = await supabase
        .from("brands")
        .select("activity_status")
        .eq("id", series.brand_id)
        .single();
      
      if (!brand || brand.activity_status !== 0) {
        return null;
      }
    }
  }

  const [{ data: tr }, { data: images }, seriesData, brandData] = await Promise.all([
    supabase.from("model_translations").select("*").eq("model_id", model.id).eq("locale", locale).maybeSingle(),
    supabase.from("car_pictures").select("*").eq("model_jm_id", model.jm_id).order("sort_order", { ascending: true }),
    model.series_id
      ? supabase.from("series").select("id, jm_id, name, fullname, brand_id").eq("id", model.series_id).single()
      : Promise.resolve({ data: null, error: null }),
    model.series_id
      ? supabase.from("series").select("brand_id").eq("id", model.series_id).single().then(({ data: s }) =>
          s?.brand_id
            ? supabase.from("brands").select("id, jm_id, name").eq("id", s.brand_id).single()
            : Promise.resolve({ data: null, error: null }),
        )
      : Promise.resolve({ data: null, error: null }),
  ]);

  // Fetch translations for the related brand and series
  let seriesNameTr: string | null = null;
  let brandNameTr: string | null = null;
  if (locale !== "zh-CN") {
    const brandJmId = brandData?.data?.jm_id as number | undefined;
    const seriesJmId = seriesData?.data?.jm_id as number | undefined;
    if (brandJmId || seriesJmId) {
      const [bt, st] = await Promise.all([
        brandJmId ? fetchEntityTranslations("brand", [brandJmId], locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
        seriesJmId ? fetchEntityTranslations("series", [seriesJmId], locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
      ]);
      if (brandJmId) brandNameTr = bt.get(String(brandJmId))?.name ?? null;
      if (seriesJmId) seriesNameTr = st.get(String(seriesJmId))?.name ?? st.get(String(seriesJmId))?.fullname ?? null;
    }
  }

  const result = {
    model,
    translation: tr ?? null,
    images: images ?? [],
    seriesNameTranslated: seriesNameTr,
    brandNameTranslated: brandNameTr,
  };

  // 缓存结果
  setCachedData(cacheKey, result);
  return result;
}

export async function createInquiry(params: {
  inquiry: InquiryInsert;
  items: Array<
    | { item_type?: "model"; model_id: string; quantity?: number | null; note?: string | null }
    | { item_type: "series"; series_id: string; quantity?: number | null; note?: string | null }
  >;
}) {
  const { inquiry, items } = params;

  const { data: inserted, error: insErr } = await supabase
    .from("inquiries")
    .insert(inquiry)
    .select("*")
    .single();

  if (insErr) throw insErr;

  const insertItems: InquiryItemInsert[] = items
    .map((it) => {
      if ((it as any)?.item_type === "series") {
        const sid = String((it as any)?.series_id ?? "").trim();
        if (!sid) return null;
        return {
          inquiry_id: inserted.id,
          item_type: "series",
          series_id: sid,
          model_id: null,
          quantity: (it as any).quantity ?? null,
          note: (it as any).note ?? null,
        } satisfies InquiryItemInsert;
      }

      const mid = String((it as any)?.model_id ?? "").trim();
      if (!mid) return null;
      return {
        inquiry_id: inserted.id,
        item_type: "model",
        series_id: null,
        model_id: mid,
        quantity: (it as any).quantity ?? null,
        note: (it as any).note ?? null,
      } satisfies InquiryItemInsert;
    })
    .filter(Boolean) as InquiryItemInsert[];

  if (insertItems.length > 0) {
    const { error: itemsErr } = await supabase.from("inquiry_items").insert(insertItems);
    if (itemsErr) throw itemsErr;
  }

  return inserted as InquiryRow;
}

export async function listBrands(params?: { locale?: Locale }) {
  const locale = params?.locale;
  const cacheKey = `listBrands_${locale ?? "none"}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .in("activity_status", [0])
    .order("name", { ascending: true });

  if (error) throw error;

  let result = data as BrandRow[];

  if (locale && locale !== "zh-CN" && result.length > 0) {
    const jmIds = result.map((b) => b.jm_id).filter((n) => typeof n === "number" && Number.isFinite(n));
    if (jmIds.length > 0) {
      const translations = await fetchEntityTranslations("brand", jmIds, locale);
      const translated = applyBrandTranslations(result, translations) as BrandRow[];
      setCachedData(cacheKey, translated);
      return translated;
    }
  }

  setCachedData(cacheKey, result);
  return result;
}

export async function listSeries(params: {
  brandId?: string;
  brandJmId?: number;
  locale?: Locale;
}) {
  const { brandId, brandJmId, locale } = params;
  const cacheKey = `listSeries_${brandId || ''}_${brandJmId || ''}_${locale ?? "none"}_v4`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If both provided, we need to do two separate queries and combine
  let data: SeriesRow[] = [];

  // 先获取品牌信息，检查品牌状态
  let brandStatusValid = true;
  if (brandId) {
    const { data: brand } = await supabase
      .from("brands")
      .select("activity_status")
      .eq("id", brandId)
      .single();
    if (brand && brand.activity_status !== null && brand.activity_status !== 0) {
      brandStatusValid = false;
    }
  } else if (brandJmId) {
    const { data: brand } = await supabase
      .from("brands")
      .select("activity_status")
      .eq("jm_id", brandJmId)
      .single();
    if (brand && brand.activity_status !== null && brand.activity_status !== 0) {
      brandStatusValid = false;
    }
  }

  // 如果品牌状态无效，直接返回空数组
  if (!brandStatusValid) {
    return [];
  }

  if (brandId && brandJmId) {
    // Query by brand_id
    const { data: data1, error: err1 } = await supabase
      .from("series")
      .select("*")
      .eq("brand_id", brandId)
      .or("activity_status.is.null,activity_status.eq.0")
      .order("name", { ascending: true });
    if (err1) throw err1;

    // Query by brand_jm_id
    const { data: data2, error: err2 } = await supabase
      .from("series")
      .select("*")
      .eq("brand_jm_id", brandJmId)
      .or("activity_status.is.null,activity_status.eq.0")
      .order("name", { ascending: true });
    if (err2) throw err2;

    // Combine and deduplicate by id
    const combined = [...(data1 || []), ...(data2 || [])];
    const seen = new Set<string>();
    data = combined.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } else if (brandId) {
    const { data: result, error } = await supabase
      .from("series")
      .select("*")
      .eq("brand_id", brandId)
      .or("activity_status.is.null,activity_status.eq.0")
      .order("name", { ascending: true });
    if (error) throw error;
    data = result || [];
  } else if (brandJmId) {
    const { data: result, error } = await supabase
      .from("series")
      .select("*")
      .eq("brand_jm_id", brandJmId)
      .or("activity_status.is.null,activity_status.eq.0")
      .order("name", { ascending: true });
    if (error) throw error;
    data = result || [];
  } else {
    const { data: result, error } = await supabase
      .from("series")
      .select("*")
      .or("activity_status.is.null,activity_status.eq.0")
      .order("name", { ascending: true });
    if (error) throw error;
    data = result || [];
  }

  // Only cache if we actually got data
  let result = data as SeriesRow[];

  if (locale && locale !== "zh-CN" && result.length > 0) {
    const jmIds = result.map((s) => s.jm_id).filter((n) => typeof n === "number" && Number.isFinite(n));
    if (jmIds.length > 0) {
      const translations = await fetchEntityTranslations("series", jmIds, locale);
      const translated = applySeriesTranslations(result, translations) as SeriesRow[];
      setCachedData(cacheKey, translated);
      return translated;
    }
  }

  if (data.length > 0) {
    setCachedData(cacheKey, result);
  }
  return result;
}

export async function getSeriesById(id: string, locale?: Locale) {
  const { data, error } = await supabase
    .from("series")
    .select("*, brands(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const result = data as (SeriesRow & { brands: BrandRow }) | null;
  if (!result) return null;

  if (locale && locale !== "zh-CN") {
    const brandJmId = result.brands?.jm_id;
    const seriesJmId = result.jm_id;

    const [brandTr, seriesTr] = await Promise.all([
      brandJmId ? fetchEntityTranslations("brand", [brandJmId], locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
      seriesJmId ? fetchEntityTranslations("series", [seriesJmId], locale) : Promise.resolve(new Map<string, EntityTranslationData>()),
    ]);

    if (brandTr.size > 0 && result.brands) {
      result.brands.name = brandTr.get(String(brandJmId!))?.name ?? result.brands.name;
    }
    if (seriesTr.size > 0) {
      result.name = seriesTr.get(String(seriesJmId))?.name ?? result.name;
      result.fullname = seriesTr.get(String(seriesJmId))?.fullname ?? result.fullname;
      result.subcompany_name = seriesTr.get(String(seriesJmId))?.subcompany_name ?? result.subcompany_name;
    }
  }

  return result;
}

export async function listModelsBySeriesId(params: {
  seriesId: string;
  locale: Locale;
}) {
  const { seriesId, locale } = params;
  const cacheKey = `listModelsBySeriesId_${seriesId}_${locale}_v5`;

  // 检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const { data: rows, error } = await supabase
      .from("models_jumdata")
      .select("id")
      .eq("series_id", seriesId)
      .eq("activity_status", 0)
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (error) return [];

    const ids = (rows ?? []).map((r: any) => String(r?.id ?? "").trim()).filter(Boolean);
    const items = await listModelsByIds({ ids, locale });

    setCachedData(cacheKey, items);
    return items;
  } catch {
    return [];
  }
}

// ==================== 知识库相关函数 ====================

export async function listKnowledgeBaseCategories() {
  const { data, error } = await supabase
    .from("knowledge_base_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as KnowledgeBaseCategoryRow[];
}

export async function createKnowledgeBaseCategory(item: KnowledgeBaseCategoryInsert) {
  const { data, error } = await supabase
    .from("knowledge_base_categories")
    .insert(item)
    .select("*")
    .single();

  if (error) throw error;
  return data as KnowledgeBaseCategoryRow;
}

export async function updateKnowledgeBaseCategory(id: string, item: KnowledgeBaseCategoryUpdate) {
  const { data, error } = await supabase
    .from("knowledge_base_categories")
    .update(item)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as KnowledgeBaseCategoryRow;
}

export async function deleteKnowledgeBaseCategory(id: string) {
  const { error } = await supabase
    .from("knowledge_base_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function listKnowledgeBase(params?: {
  contentType?: 'text' | 'file';
  category?: string;
  isActive?: boolean;
  search?: string;
}) {
  let q = supabase
    .from("knowledge_base")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.contentType) q = q.eq("content_type", params.contentType);
  if (params?.category) q = q.eq("category", params.category);
  if (params?.isActive !== undefined) q = q.eq("is_active", params.isActive);
  if (params?.search) q = q.ilike("title", `%${params.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data as KnowledgeBaseRow[];
}

export async function getKnowledgeBaseById(id: string) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as KnowledgeBaseRow | null;
}

export async function createKnowledgeBase(item: KnowledgeBaseInsert) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .insert(item)
    .select("*")
    .single();

  if (error) throw error;
  return data as KnowledgeBaseRow;
}

export async function updateKnowledgeBase(id: string, item: KnowledgeBaseUpdate) {
  const { data, error } = await supabase
    .from("knowledge_base")
    .update(item)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as KnowledgeBaseRow;
}

export async function deleteKnowledgeBase(id: string) {
  // 先删除存储桶中的文件
  const { data: item } = await supabase
    .from("knowledge_base")
    .select("file_url")
    .eq("id", id)
    .single();

  if (item?.file_url) {
    const filePath = item.file_url.split('/').pop();
    if (filePath) {
      await supabase.storage.from("knowledge_base").remove([filePath]);
    }
  }

  const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function uploadKnowledgeBaseFile(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("knowledge_base")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from("knowledge_base")
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl,
  };
}
