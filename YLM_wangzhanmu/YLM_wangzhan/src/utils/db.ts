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
  created_at: string;
  updated_at: string;
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
  const cacheKey = `listModels_${locale}_${search || ''}_${onlyHot || false}`;

  // 检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let q = supabase
    .from("models")
    .select("*")
    .eq("is_active", true)
    .order("is_hot", { ascending: false })
    .order("updated_at", { ascending: false });

  if (onlyHot) q = q.eq("is_hot", true);
  if (search) q = q.ilike("name", `%${search}%`);

  const [{ data: models, error: modelErr }, { data: translations, error: trErr }, { data: images, error: imgErr }] = await Promise.all([
    q,
    supabase.from("model_translations").select("*").eq("locale", locale),
    supabase.from("model_images").select("*").order("sort_order", { ascending: true }),
  ]);

  if (modelErr) throw modelErr;
  if (trErr) throw trErr;
  if (imgErr) throw imgErr;

  const trMap = new Map<string, ModelTranslationRow>();
  (translations ?? []).forEach((t) => trMap.set(t.model_id, t));

  const coverMap = new Map<string, string>();
  (images ?? []).forEach((img) => {
    const existing = coverMap.get(img.model_id);
    if (!existing) {
      coverMap.set(img.model_id, img.path);
    } else if (img.is_cover) {
      coverMap.set(img.model_id, img.path);
    }
  });

  const items: ModelListItem[] = (models ?? []).map((m) => {
    const tr = trMap.get(m.id);
    return {
      ...m,
      display_name: pickDisplayName(m, tr),
      summary: tr?.summary ?? null,
      cover_image: coverMap.get(m.id) ?? null,
      fuel_type: m.energy_type,
    };
  });

  // 缓存结果
  setCachedData(cacheKey, items);
  return items;
}

export async function getModelBySlug(params: { slug: string; locale: Locale }) {
  const { slug, locale } = params;
  const cacheKey = `getModelBySlug_${slug}_${locale}`;

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
    .maybeSingle();

  if (modelErr) throw modelErr;
  if (!model) return null;

  const [{ data: tr }, { data: images }] = await Promise.all([
    supabase.from("model_translations").select("*").eq("model_id", model.id).eq("locale", locale).maybeSingle(),
    supabase.from("model_images").select("*").eq("model_id", model.id).order("sort_order", { ascending: true }),
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
  const cacheKey = `listSeries_${brandId || ''}_${brandJmId || ''}_v2`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If both provided, we need to do two separate queries and combine
  let data: SeriesRow[] = [];

  if (brandId && brandJmId) {
    // Query by brand_id
    const { data: data1, error: err1 } = await supabase
      .from("series")
      .select("*")
      .eq("brand_id", brandId)
      .order("name", { ascending: true });
    if (err1) throw err1;

    // Query by brand_jm_id
    const { data: data2, error: err2 } = await supabase
      .from("series")
      .select("*")
      .eq("brand_jm_id", brandJmId)
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
      .order("name", { ascending: true });
    if (error) throw error;
    data = result || [];
  } else if (brandJmId) {
    const { data: result, error } = await supabase
      .from("series")
      .select("*")
      .eq("brand_jm_id", brandJmId)
      .order("name", { ascending: true });
    if (error) throw error;
    data = result || [];
  } else {
    const { data: result, error } = await supabase
      .from("series")
      .select("*")
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

  if (error) throw error;
  return data as (SeriesRow & { brands: BrandRow }) | null;
}

export async function listModelsBySeriesId(params: {
  seriesId: string;
  locale: Locale;
}) {
  const { seriesId, locale } = params;
  const cacheKey = `listModelsBySeriesId_${seriesId}_${locale}`;

  // 检查缓存
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // 首先获取该series_id下的所有models
  const { data: models, error: modelErr } = await supabase
    .from("models")
    .select("*")
    .eq("series_id", seriesId)
    .eq("is_active", true)
    .order("is_hot", { ascending: false })
    .order("updated_at", { ascending: false });

  if (modelErr) throw modelErr;

  const [{ data: translations, error: trErr }, { data: images, error: imgErr }] = await Promise.all([
    supabase.from("model_translations").select("*").eq("locale", locale),
    supabase.from("model_images").select("*").order("sort_order", { ascending: true }),
  ]);

  if (trErr) throw trErr;
  if (imgErr) throw imgErr;

  const trMap = new Map<string, ModelTranslationRow>();
  (translations ?? []).forEach((t) => trMap.set(t.model_id, t));

  const coverMap = new Map<string, string>();
  (images ?? []).forEach((img) => {
    const existing = coverMap.get(img.model_id);
    if (!existing) {
      coverMap.set(img.model_id, img.path);
    } else if (img.is_cover) {
      coverMap.set(img.model_id, img.path);
    }
  });

  const items: ModelListItem[] = (models ?? []).map((m) => {
    const tr = trMap.get(m.id);
    return {
      ...m,
      display_name: pickDisplayName(m, tr),
      summary: tr?.summary ?? null,
      cover_image: coverMap.get(m.id) ?? null,
      fuel_type: m.energy_type,
    };
  });

  // 缓存结果
  setCachedData(cacheKey, items);
  return items;
}


// ==================== 知识库相关函数 ====================

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
