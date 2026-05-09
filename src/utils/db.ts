import { supabase } from "./supabaseClient";
import type { Locale } from "@/i18n/locales";

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
  status: "new" | "contacted" | "quoting" | "won" | "lost";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type InquiryItemInsert = {
  inquiry_id: string;
  model_id: string;
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

function pickDisplayName(model: ModelRow, tr: ModelTranslationRow | undefined) {
  return tr?.name ?? model.name;
}

// 缓存存储
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

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
    supabase.from("series").select("id, activity_status, brand_id, name, fullname"),
    supabase.from("brands").select("id, activity_status, name"),
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
  const seriesStatusMap = new Map<string, { activity_status: number; brand_id: string | null; name: string; fullname: string | null }>();
  (seriesList ?? []).forEach((s) => seriesStatusMap.set(s.id, { activity_status: s.activity_status, brand_id: s.brand_id, name: s.name, fullname: s.fullname ?? null }));

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

  const items: ModelListItem[] = validModels.map((m: any) => {
    const tr = trMap.get(m.id);
    const seriesInfo = m.series_id ? seriesStatusMap.get(m.series_id) : null;
    const seriesName = seriesInfo ? (seriesInfo.fullname || seriesInfo.name) : null;

    const jmExterior = Array.isArray(m.exterior_images) ? m.exterior_images.filter((u: any) => typeof u === "string" && u.trim()) : [];
    const jumeFallback = (jmExterior[0] as string | undefined) ?? null;

    return {
      ...m,
      display_name: pickDisplayName(m, tr),
      summary: tr?.summary ?? null,
      cover_image: coverMap.get(m.jm_id) ?? jumeFallback,
      fuel_type: m.energy_type,
      series_name: seriesName,
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
  if (uniqIds.length === 0) return [] as ModelListItem[];

  const cacheKey = `listModelsByIds_${locale}_${uniqIds.sort().join("|")}_v1`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    const order = new Map(ids.map((id, idx) => [String(id), idx] as const));
    return (cachedData as ModelListItem[]).slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  const { data: models, error: modelErr } = await supabase
    .from("models")
    .select("*")
    .in("id", uniqIds)
    .eq("is_active", true)
    .in("activity_status", [0])
    .limit(5000);
  if (modelErr) throw modelErr;

  const modelRows = (models ?? []) as ModelRow[];
  const seriesIds = Array.from(new Set(modelRows.map((m: any) => (m.series_id ? String(m.series_id) : null)).filter(Boolean))) as string[];
  const brandIds = Array.from(new Set(modelRows.map((m: any) => (m.brand_id ? String(m.brand_id) : null)).filter(Boolean))) as string[];
  const modelJmIds = modelRows.map((m: any) => m?.jm_id).filter((x: any) => typeof x === "number" && Number.isFinite(x));

  const [{ data: translations, error: trErr }, { data: seriesList, error: seriesErr }, { data: brands, error: brandErr }] = await Promise.all([
    supabase.from("model_translations").select("*").eq("locale", locale).in("model_id", uniqIds),
    seriesIds.length > 0 ? supabase.from("series").select("id, name, fullname").in("id", seriesIds) : Promise.resolve({ data: [], error: null } as any),
    brandIds.length > 0 ? supabase.from("brands").select("id, name").in("id", brandIds) : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (trErr) throw trErr;
  if (seriesErr) throw seriesErr;
  if (brandErr) throw brandErr;

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

  const trMap = new Map<string, ModelTranslationRow>();
  (translations ?? []).forEach((t: any) => trMap.set(String(t.model_id), t as ModelTranslationRow));

  const seriesNameMap = new Map<string, string>();
  (seriesList ?? []).forEach((s: any) => {
    const id = String(s.id || "");
    if (!id) return;
    seriesNameMap.set(id, String(s.fullname || s.name || "").trim());
  });

  const brandNameMap = new Map<string, string>();
  (brands ?? []).forEach((b: any) => {
    const id = String(b.id || "");
    if (!id) return;
    brandNameMap.set(id, String(b.name || "").trim());
  });

  const coverMap = new Map<number, string>();
  (images ?? []).forEach((img: any) => {
    const mid = typeof img?.model_jm_id === "number" ? img.model_jm_id : null;
    const url = typeof img?.image_url === "string" ? img.image_url : null;
    if (!mid || !url) return;
    if (!coverMap.has(mid)) coverMap.set(mid, url);
  });

  const items: ModelListItem[] = modelRows.map((m: any) => {
    const tr = trMap.get(String(m.id));
    const seriesName = m.series_id ? (seriesNameMap.get(String(m.series_id)) ?? null) : null;
    const brandName = m.brand_id ? (brandNameMap.get(String(m.brand_id)) ?? m.brand ?? null) : (m.brand ?? null);

    const jmExterior = Array.isArray(m.exterior_images) ? m.exterior_images.filter((u: any) => typeof u === "string" && u.trim()) : [];
    const jumeFallback = (jmExterior[0] as string | undefined) ?? null;

    return {
      ...m,
      display_name: pickDisplayName(m, tr),
      summary: (tr as any)?.summary ?? null,
      cover_image: coverMap.get(m.jm_id) ?? jumeFallback,
      fuel_type: m.energy_type,
      series_name: seriesName,
      brand: brandName,
    } as ModelListItem;
  });

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

  const [{ data: tr }, { data: images }] = await Promise.all([
    supabase.from("model_translations").select("*").eq("model_id", model.id).eq("locale", locale).maybeSingle(),
    supabase.from("car_pictures").select("*").eq("model_jm_id", model.jm_id).order("sort_order", { ascending: true }),
  ]);

  const result = {
    model,
    translation: tr ?? null,
    images: images ?? [],
  };

  // 缓存结果
  setCachedData(cacheKey, result);
  return result;
}

export async function createInquiry(params: {
  inquiry: InquiryInsert;
  items: { model_id: string; quantity?: number | null; note?: string | null }[];
}) {
  const { inquiry, items } = params;

  const { data: inserted, error: insErr } = await supabase
    .from("inquiries")
    .insert(inquiry)
    .select("*")
    .single();

  if (insErr) throw insErr;

  const insertItems: InquiryItemInsert[] = items.map((it) => ({
    inquiry_id: inserted.id,
    model_id: it.model_id,
    quantity: it.quantity ?? null,
    note: it.note ?? null,
  }));

  if (insertItems.length > 0) {
    const { error: itemsErr } = await supabase.from("inquiry_items").insert(insertItems);
    if (itemsErr) throw itemsErr;
  }

  return inserted as InquiryRow;
}

export async function listBrands() {
  const cacheKey = "listBrands";
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

  setCachedData(cacheKey, data);
  return data as BrandRow[];
}

export async function listSeries(params: {
  brandId?: string;
  brandJmId?: number;
}) {
  const { brandId, brandJmId } = params;
  const cacheKey = `listSeries_${brandId || ''}_${brandJmId || ''}_v3`;
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
  if (data.length > 0) {
    setCachedData(cacheKey, data);
  }
  return data as SeriesRow[];
}

export async function getSeriesById(id: string) {
  const { data, error } = await supabase
    .from("series")
    .select("*, brands(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  
  return data as (SeriesRow & { brands: BrandRow }) | null;
}

export async function listModelsBySeriesId(params: {
  seriesId: string;
  locale: Locale;
}) {
  const { seriesId, locale } = params;
  const cacheKey = `listModelsBySeriesId_${seriesId}_${locale}_v4`;

  // 检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // 首先获取车系信息，包括关联的品牌
    const { data: seriesData, error: seriesError } = await supabase
      .from("series")
      .select("*, brands(*)")
      .eq("id", seriesId)
      .maybeSingle();

    if (seriesError) {
      return [];
    }

    if (!seriesData) {
      return [];
    }

    const brandName = seriesData.brands?.name;

    // 查询车型，按品牌名称匹配
    let { data: models, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .order("is_hot", { ascending: false })
      .order("updated_at", { ascending: false });

    if (modelError) {
      models = [];
    } else {
      // 过滤出与当前品牌匹配的车型
      if (brandName && models) {
        models = models.filter(m => {
          const modelBrand = m.brand?.toLowerCase().trim();
          const targetBrand = brandName.toLowerCase().trim();
          const match = modelBrand?.includes(targetBrand) || targetBrand.includes(modelBrand);
          return match;
        });
      }
    }

    const modelJmIds = (models ?? []).map((m: any) => m?.jm_id).filter((x: any) => typeof x === "number" && Number.isFinite(x));
    const [{ data: translations, error: trErr }, { data: images, error: imgErr }] = await Promise.all([
      supabase.from("model_translations").select("*").eq("locale", locale),
      modelJmIds.length > 0
        ? supabase
            .from("car_pictures")
            .select("model_jm_id, image_url, sort_order")
            .eq("category", "official")
            .in("model_jm_id", modelJmIds)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    const trMap = new Map<string, ModelTranslationRow>();
    (translations ?? []).forEach((t) => trMap.set(t.model_id, t));

    const coverMap = new Map<number, string>();
    (images ?? []).forEach((img: any) => {
      const mid = typeof img?.model_jm_id === "number" ? img.model_jm_id : null;
      const url = typeof img?.image_url === "string" ? img.image_url : null;
      if (!mid || !url) return;
      if (!coverMap.has(mid)) coverMap.set(mid, url);
    });

    const items: ModelListItem[] = (models ?? []).map((m: any) => {
      const tr = trMap.get(m.id);
      const jmExterior = Array.isArray(m.exterior_images) ? m.exterior_images.filter((u: any) => typeof u === "string" && u.trim()) : [];
      const jumeFallback = (jmExterior[0] as string | undefined) ?? null;
      return {
        ...m,
        display_name: pickDisplayName(m, tr),
        summary: tr?.summary ?? null,
        cover_image: coverMap.get(m.jm_id) ?? jumeFallback,
        fuel_type: m.energy_type ?? null,
      };
    });

    // 缓存结果
    setCachedData(cacheKey, items);
    return items;
  } catch (error) {
    // 出错时返回空数组，避免页面崩溃
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
