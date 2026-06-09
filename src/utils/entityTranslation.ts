// 实体翻译获取工具 - 适配新的 32 表翻译系统
// 翻译表命名: {entity_type}s_{locale} 或 {entity_type}_{locale}

import { supabase } from "./supabaseClient";
import type { Locale } from "@/i18n/locales";
import { clearBrandSeriesCache } from "./db";

// 目标语言列表 (7种，不含 zh-CN 和 kk)
export const TARGET_LOCALES = ["en", "ar", "ru", "th", "ur", "tr", "pt-BR"] as const;

export type EntityType = "brand" | "series" | "model" | "model_detail";

export type EntityTranslationData = {
  name?: string;
  fullname?: string;
  initial?: string;
  salestate?: string;
  subcompany_name?: string;
  brand_name?: string;
  groupname?: string;
  sizetype?: string;
  displacement?: string;
  geartype?: string;
  price?: string;
  productionstate?: string;
  seatnum?: string;
  gearnum?: string;
  yeartype?: string;
  listdate?: string;
  brandname?: string;
  parentname?: string;
  environmentalstandards?: string;
  drivemode?: string;
  raw?: Record<string, unknown>;
  raw_translated?: Record<string, string>;
  source_data?: Record<string, string>;
};

// 翻译表命名映射
function getTranslationTable(entityType: EntityType, locale: string): string {
  const safeLocale = locale.toLowerCase().replace(/-/g, "_");
  if (entityType === "brand") return `brands_${safeLocale}`;
  if (entityType === "series") return `series_${safeLocale}`;
  if (entityType === "model") return `models_jumdata_${safeLocale}`;
  if (entityType === "model_detail") return `model_details_${safeLocale}`;
  return `${entityType}_${safeLocale}`;
}

// 实体类型映射 (源表名)
const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  brand: "brands",
  series: "series",
  model: "models_jumdata",
  model_detail: "model_details",
};

// In-memory cache with localStorage backing
const CACHE_PREFIX = "et_";
const MEMORY_TTL = 5 * 60 * 1000;
const STORAGE_TTL = 30 * 60 * 1000;

type CacheEntry = { rows: Map<string, EntityTranslationData>; ts: number };
const cache: Record<string, CacheEntry> = {};

function getCached(key: string): Map<string, EntityTranslationData> | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < MEMORY_TTL) {
    return entry.rows;
  }
  delete cache[key];

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as { rows: [string, EntityTranslationData][]; ts: number };
      if (Date.now() - parsed.ts < STORAGE_TTL) {
        const map = new Map<string, EntityTranslationData>(parsed.rows);
        cache[key] = { rows: map, ts: parsed.ts };
        return map;
      }
    }
  } catch { /* localStorage may be unavailable or full */ }

  return null;
}

function setCached(key: string, rows: Map<string, EntityTranslationData>) {
  cache[key] = { rows, ts: Date.now() };
  try {
    const plain = Array.from(rows.entries());
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ rows: plain, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

export function clearEntityTranslationCache() {
  Object.keys(cache).forEach((k) => {
    try { localStorage.removeItem(CACHE_PREFIX + k); } catch { /* ignore */ }
    delete cache[k];
  });
  clearBrandSeriesCache();
}

// 兼容旧版 entity_type 名称
function normalizeEntityType(entityType: string): EntityType {
  if (entityType === "model_detail") return "model_detail";
  if (entityType === "model" || entityType === "models_jumdata") return "model";
  if (entityType === "brand" || entityType === "brands") return "brand";
  if (entityType === "series") return "series";
  return entityType as EntityType;
}

export async function fetchEntityTranslations(
  entityType: EntityType | string,
  jmIds: (string | number)[],
  locale: Locale,
): Promise<Map<string, EntityTranslationData>> {
  // zh-CN 不需要翻译
  if (locale === "zh-CN") return new Map();

  // 检查是否是支持的目标语言
  if (!TARGET_LOCALES.includes(locale as typeof TARGET_LOCALES[number])) {
    return new Map();
  }

  const normalizedType = normalizeEntityType(entityType);
  const uniq = Array.from(new Set(jmIds.map((n) => String(n)).filter((s) => s.length > 0)));
  if (uniq.length === 0) return new Map();

  const key = `${normalizedType}_${locale}`;
  const cached = getCached(key);
  if (cached) {
    const missing = uniq.filter((id) => !cached.has(id));
    if (missing.length === 0 && cached.size > 0) {
      const result = new Map<string, EntityTranslationData>();
      for (const id of uniq) {
        const row = cached.get(id);
        if (row) result.set(id, row);
      }
      return result;
    }
  }

  const transTable = getTranslationTable(normalizedType, locale as string);

  // 尝试从翻译表查询
  let { data, error } = await supabase
    .from(transTable)
    .select("*")
    .in("jm_id", uniq);

  // 如果翻译表不存在或查询失败，尝试旧表 entity_translations (兼容)
  if (error || !data?.length) {
    // 兼容旧表结构
    const { data: oldData } = await supabase
      .from("entity_translations")
      .select("jm_id, data")
      .eq("entity_type", normalizedType === "model_detail" ? "model_detail" : normalizedType)
      .eq("locale", locale)
      .in("jm_id", uniq);

    if (oldData?.length) {
      const allRows = new Map<string, EntityTranslationData>();
      for (const row of oldData as any[]) {
        allRows.set(String(row.jm_id), row.data || {});
      }
      if (allRows.size > 0) setCached(key, allRows);

      const result = new Map<string, EntityTranslationData>();
      for (const id of uniq) {
        const row = allRows.get(id);
        if (row) result.set(id, row);
      }
      return result;
    }

    return new Map();
  }

  // 转换翻译表数据为统一格式
  const allRows = new Map<string, EntityTranslationData>();
  for (const row of data as Record<string, any>[]) {
    const jmId = String(row.jm_id);
    // 提取翻译字段（排除元数据字段）
    const translationData: EntityTranslationData = {};
    const metaFields = ["id", "jm_id", "source_data", "source_updated_at", "model", "created_at", "updated_at"];

    for (const [key, value] of Object.entries(row)) {
      if (!metaFields.includes(key) && value !== null && value !== undefined) {
        (translationData as any)[key] = typeof value === "string" ? value : (value !== null ? String(value) : undefined);
      }
    }

    allRows.set(jmId, translationData);
  }

  if (allRows.size > 0) setCached(key, allRows);

  const result = new Map<string, EntityTranslationData>();
  for (const id of uniq) {
    const row = allRows.get(id);
    if (row) result.set(id, row);
  }

  return result;
}

// 获取翻译状态统计
export async function fetchTranslationStats(): Promise<Record<string, {
  total: number;
  translated: number;
  missing: number;
  locales: Record<string, { translated: number; missing: number }>;
}>> {
  const stats: Record<string, any> = {};
  const entityTypes: EntityType[] = ["brand", "series", "model", "model_detail"];

  for (const entityType of entityTypes) {
    const tableName = ENTITY_TABLE_MAP[entityType];

    // 获取总数
    const { count: total } = await supabase
      .from(tableName)
      .select("jm_id", { count: "exact", head: true })
      .eq("activity_status", 0);

    stats[entityType] = {
      total: total ?? 0,
      translated: 0,
      missing: total ?? 0,
      locales: {},
    };

    // 获取每种语言的翻译数量
    for (const locale of TARGET_LOCALES) {
      const transTable = getTranslationTable(entityType, locale);
      const { count: translated } = await supabase
        .from(transTable)
        .select("jm_id", { count: "exact", head: true });

      const tCount = translated ?? 0;
      stats[entityType].locales[locale] = {
        translated: tCount,
        missing: Math.max(0, (total ?? 0) - tCount),
      };
      stats[entityType].translated += tCount;
      stats[entityType].missing = Math.max(0, (total ?? 0) - stats[entityType].translated);
    }
  }

  return stats;
}

// 获取单个实体的翻译
export async function fetchSingleEntityTranslation(
  entityType: EntityType,
  jmId: string | number,
  locale: Locale,
): Promise<EntityTranslationData | null> {
  if (locale === "zh-CN") return null;
  if (!TARGET_LOCALES.includes(locale as typeof TARGET_LOCALES[number])) return null;

  const transTable = getTranslationTable(entityType, locale);

  const { data, error } = await supabase
    .from(transTable)
    .select("*")
    .eq("jm_id", jmId)
    .maybeSingle();

  if (error || !data) return null;

  const translationData: EntityTranslationData = {};
  const metaFields = ["id", "jm_id", "source_data", "source_updated_at", "model", "created_at", "updated_at"];

  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (!metaFields.includes(key) && value !== null && value !== undefined) {
      (translationData as any)[key] = typeof value === "string" ? value : (value !== null ? String(value) : undefined);
    }
  }

  return translationData;
}

// 辅助函数：获取翻译字段值
export function getTranslatedField(
  translations: Map<string, EntityTranslationData> | undefined,
  jmId: string | number | null | undefined,
  field: keyof EntityTranslationData,
  fallback: string,
): string {
  if (jmId == null) return fallback;
  const data = translations?.get(String(jmId ?? ""));
  if (!data) return fallback;
  const val = data[field];
  return typeof val === "string" && val.trim() ? val : fallback;
}

// 应用品牌翻译
export function applyBrandTranslations(
  brands: Array<{ jm_id: string | number; name: string; fullname?: string | null }>,
  translations: Map<string, EntityTranslationData> | undefined,
): Array<{ jm_id: string | number; name: string; fullname?: string | null }> {
  if (!translations || translations.size === 0) return brands;
  return brands.map((b) => ({
    ...b,
    name: getTranslatedField(translations, b.jm_id, "name", b.name),
    fullname: getTranslatedField(translations, b.jm_id, "fullname", b.fullname ?? ""),
  }));
}

// 应用车系翻译
export function applySeriesTranslations(
  series: Array<{ jm_id: string | number; name: string; fullname?: string | null; subcompany_name?: string | null }>,
  translations: Map<string, EntityTranslationData> | undefined,
): Array<{ jm_id: string | number; name: string; fullname?: string | null; subcompany_name?: string | null }> {
  if (!translations || translations.size === 0) return series;
  return series.map((s) => ({
    ...s,
    name: getTranslatedField(translations, s.jm_id, "name", s.name),
    fullname: getTranslatedField(translations, s.jm_id, "fullname", s.fullname ?? ""),
    subcompany_name: getTranslatedField(translations, s.jm_id, "subcompany_name", s.subcompany_name ?? ""),
  }));
}

// 应用车型翻译
export function applyModelTranslations(
  models: Array<{ jm_id: string | number; name: string; groupname?: string | null }>,
  translations: Map<string, EntityTranslationData> | undefined,
): Array<{ jm_id: string | number; name: string; groupname?: string | null }> {
  if (!translations || translations.size === 0) return models;
  return models.map((m) => ({
    ...m,
    name: getTranslatedField(translations, m.jm_id, "name", m.name),
    groupname: getTranslatedField(translations, m.jm_id, "groupname", m.groupname ?? ""),
  }));
}

// 应用车型详情翻译
export function applyModelDetailTranslations(
  details: Array<{ jm_id: string | number; name: string; brandname?: string | null }>,
  translations: Map<string, EntityTranslationData> | undefined,
): Array<{ jm_id: string | number; name: string; brandname?: string | null }> {
  if (!translations || translations.size === 0) return details;
  return details.map((d) => ({
    ...d,
    name: getTranslatedField(translations, d.jm_id, "name", d.name),
    brandname: getTranslatedField(translations, d.jm_id, "brandname", d.brandname ?? ""),
  }));
}

// 合并 raw 翻译
export function mergeRawTranslations(
  originalRaw: Record<string, unknown> | null | undefined,
  translatedRaw: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!originalRaw) return null;
  if (!translatedRaw || Object.keys(translatedRaw).length === 0) return originalRaw;

  const merged = { ...originalRaw };
  const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const targetValue = target[key];
        if (typeof targetValue === "object" && targetValue !== null && !Array.isArray(targetValue)) {
          const next = { ...(targetValue as Record<string, unknown>) };
          deepMerge(next, value as Record<string, unknown>);
          target[key] = next;
        } else {
          target[key] = { ...(value as Record<string, unknown>) };
        }
      } else {
        target[key] = value;
      }
    }
  };
  deepMerge(merged, translatedRaw);
  return merged;
}