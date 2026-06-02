import { supabase } from "./supabaseClient";
import type { Locale } from "@/i18n/locales";
import { clearBrandSeriesCache } from "./db";

export type EntityType = "brand" | "series" | "model_detail" | "knowledge_base" | "knowledge_base_category";

export type EntityTranslationData = {
  name?: string;
  fullname?: string;
  brandname?: string;
  parentname?: string;
  groupname?: string;
  subcompany_name?: string;
  title?: string;
  content?: string;
  raw?: Record<string, Record<string, string>>;
};

type EntityTranslationRow = {
  id: string;
  entity_type: EntityType;
  jm_id: string | number;
  locale: string;
  data: Record<string, string>;
};

// In-memory cache with localStorage backing
const CACHE_PREFIX = "et_";
const MEMORY_TTL = 5 * 60 * 1000;
const STORAGE_TTL = 30 * 60 * 1000;

const cache: Record<string, { rows: Map<string, EntityTranslationRow>; ts: number }> = {};

function getCached(key: string): Map<string, EntityTranslationRow> | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < MEMORY_TTL) {
    return entry.rows;
  }
  delete cache[key];

  // Fall back to localStorage
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as { rows: [string, EntityTranslationRow][]; ts: number };
      if (Date.now() - parsed.ts < STORAGE_TTL) {
        const map = new Map<string, EntityTranslationRow>(parsed.rows);
        cache[key] = { rows: map, ts: parsed.ts };
        return map;
      }
    }
  } catch { /* localStorage may be unavailable or full */ }

  return null;
}

function setCached(key: string, rows: Map<string, EntityTranslationRow>) {
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

export async function fetchEntityTranslations(
  entityType: EntityType,
  jmIds: (string | number)[],
  locale: Locale,
): Promise<Map<string, EntityTranslationData>> {
  if (locale === "zh-CN") return new Map();
  const uniq = Array.from(new Set(jmIds.map((n) => String(n)).filter((s) => s.length > 0)));
  if (uniq.length === 0) return new Map();

  const key = `${entityType}_${locale}`;
  const cached = getCached(key);
  if (cached) {
    // Only use cache if it has data for all requested IDs
    const missing = uniq.filter((id) => !cached.has(id));
    if (missing.length === 0 && cached.size > 0) {
      const result = new Map<string, EntityTranslationData>();
      for (const id of uniq) {
        const row = cached.get(id);
        if (row) result.set(id, row.data);
      }
      return result;
    }
  }

  // Targeted query for small requests — avoids fetching all rows
  if (uniq.length <= 200) {
    const { data, error } = await supabase
      .from("entity_translations")
      .select("id, entity_type, jm_id, locale, data")
      .eq("entity_type", entityType)
      .eq("locale", locale)
      .in("jm_id", uniq);

    if (error) return new Map();
    if (!data?.length) return new Map();

    const allRows = new Map<string, EntityTranslationRow>();
    for (const row of data as EntityTranslationRow[]) {
      if (!allRows.has(String(row.jm_id))) allRows.set(String(row.jm_id), row);
    }
    if (allRows.size > 0) setCached(key, allRows);

    const result = new Map<string, EntityTranslationData>();
    for (const id of uniq) {
      const row = allRows.get(id);
      if (row) result.set(id, row.data);
    }
    return result;
  }

  // For large requests, fetch all and cache
  const allRows = new Map<string, EntityTranslationRow>();

  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("entity_translations")
      .select("id, entity_type, jm_id, locale, data")
      .eq("entity_type", entityType)
      .eq("locale", locale)
      .range(offset, offset + limit - 1);

    if (error) break;
    if (!data || data.length === 0) { hasMore = false; break; }

    for (const row of data as EntityTranslationRow[]) {
      if (!allRows.has(String(row.jm_id))) allRows.set(String(row.jm_id), row);
    }

    if (data.length < limit) { hasMore = false; } else { offset += limit; }
  }

  if (allRows.size > 0) setCached(key, allRows);

  const result = new Map<string, EntityTranslationData>();
  for (const id of uniq) {
    const row = allRows.get(id);
    if (row) result.set(id, row.data);
  }
  return result;
}

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
