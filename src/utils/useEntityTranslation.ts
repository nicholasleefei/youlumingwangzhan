// Shared hook for translating entity data (品牌/车系/车型/车型详情)
// Calls the db-translate edge function per-locale for speed and reliability
import { useState, useCallback, useRef } from "react";
import { clearEntityTranslationCache } from "./entityTranslation";
import { LOCALE_LABELS } from "@/i18n/locales";
import type { EntityType } from "./entityTranslation";

export const TARGET_LOCALES = ["en", "ar", "ru", "th", "ur", "tr", "pt-BR"] as const;

export type TranslateResult = {
  ok: boolean;
  entity_type: string;
  target_locale: string;
  total_entities: number;
  processed: number;
  details: Array<{
    entity_type: string;
    jm_id: string;
    locale: string;
    fields?: Array<{ field: string; source: string; translated: string }>;
    error?: string;
  }>;
  errors: string[];
  message?: string;
};

// Aggregate result across multiple per-locale calls
export type AggregateResult = {
  totalProcessed: number;
  totalEntities: number;
  locales: Record<string, { processed: number; errors: string[] }>;
  samples: TranslateResult["details"];
  elapsedSec: number;
};

// Callbacks for progress reporting to the UI
export type TranslationCallbacks = {
  onLog?: (msg: string) => void;
  onImportant?: (msg: string) => void;
  onProgress?: (msg: string) => void;
};

export function useEntityTranslation(
  entityType: EntityType,
  callbacks?: TranslationCallbacks,
) {
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const log = useCallback((msg: string) => callbacks?.onLog?.(msg), [callbacks]);
  const important = useCallback((msg: string) => callbacks?.onImportant?.(msg), [callbacks]);
  const prog = useCallback((msg: string) => {
    setProgress(msg);
    callbacks?.onProgress?.(msg);
  }, [callbacks]);

  const translateSingleLocale = useCallback(async (
    targetLocale: string,
    jmIds?: (string | number)[],
    signal?: { cancelled: boolean },
  ): Promise<TranslateResult | null> => {
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
    if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL not configured");

    const body: Record<string, unknown> = {
      action: "translate_entities",
      entity_type: entityType,
      target_locale: targetLocale,
      limit_entities: 300,
    };
    if (jmIds && jmIds.length > 0) {
      body.jm_ids = jmIds.map(String);
    }

    const locLabel = LOCALE_LABELS[targetLocale as keyof typeof LOCALE_LABELS] || targetLocale;
    log(`   📡 发起翻译请求 → ${locLabel}`);
    log(`   📦 数据量: ${jmIds?.length || '全部'} 个实体, 目标: ${locLabel}`);

    const response = await fetch(`${supabaseUrl}/functions/v1/db-translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (signal?.cancelled) return null;

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error((data as any).error || `HTTP ${response.status}`);
    }

    // Detailed per-locale logging
    if (data.details?.length) {
      log(`   📝 ${locLabel} 翻译详情 (共 ${data.details.length} 条记录):`);
      for (const d of data.details.slice(0, 8)) {
        if (d.fields?.length) {
          const fieldInfo = d.fields.slice(0, 4).map((f: any) =>
            `${f.field}:"${f.source?.substring(0,25)}"→"${f.translated?.substring(0,25)}"`
          ).join(" | ");
          log(`     #${d.jm_id}: ${fieldInfo}`);
        } else if (d.error) {
          log(`     ❌ #${d.jm_id}: ${d.error}`);
        }
      }
      if (data.details.length > 8) {
        log(`     ... 还有 ${data.details.length - 8} 条`);
      }
    }

    if (data.errors?.length > 0) {
      important(`   ⚠️ ${locLabel} 出现 ${data.errors.length} 个错误:`);
      for (const err of data.errors.slice(0, 3)) {
        important(`     ❌ ${err}`);
      }
    }

    return data as TranslateResult;
  }, [entityType, log, important]);

  const translateEntities = useCallback(async (
    targetLocales: string[],
    jmIds?: (string | number)[],
  ): Promise<AggregateResult | null> => {
    if (targetLocales.length === 0) {
      setError("请至少选择一种目标语言");
      return null;
    }

    setTranslating(true);
    setError(null);
    cancelRef.current = false;
    const startTime = Date.now();

    const entityLabel =
      entityType === "brand" ? "品牌" :
      entityType === "series" ? "车系" :
      entityType === "model" ? "车型" : "车型详情";

    const aggregate: AggregateResult = {
      totalProcessed: 0,
      totalEntities: 0,
      locales: {},
      samples: [],
      elapsedSec: 0,
    };

    try {
      for (let i = 0; i < targetLocales.length; i++) {
        if (cancelRef.current) break;
        const loc = targetLocales[i];
        const locLabel = LOCALE_LABELS[loc as keyof typeof LOCALE_LABELS] || loc;
        const done = i;
        const total = targetLocales.length;
        const localeStart = Date.now();

        important(`🌐 [${done + 1}/${total}] 开始翻译${entityLabel} → ${locLabel}`);
        prog(`[${done + 1}/${total}] 正在翻译${entityLabel} → ${locLabel}...`);

        try {
          const singleResult = await translateSingleLocale(loc, jmIds, { cancelled: cancelRef.current });

          const localeElapsed = ((Date.now() - localeStart) / 1000).toFixed(1);

          if (singleResult) {
            aggregate.totalProcessed += singleResult.processed;
            aggregate.totalEntities = Math.max(aggregate.totalEntities, singleResult.total_entities);
            aggregate.locales[loc] = {
              processed: singleResult.processed,
              errors: singleResult.errors || [],
            };
            // Collect a few samples
            if (singleResult.details?.length && aggregate.samples.length < 10) {
              aggregate.samples.push(...singleResult.details.slice(0, 3));
            }
          }
          log(`   ✅ [${done + 1}/${total}] ${locLabel} 完成 (${singleResult?.processed || 0} 条, ${localeElapsed}s)`);
          prog(`[${done + 1}/${total}] ${locLabel} 完成 ✓ (${localeElapsed}s)`);
        } catch (e: any) {
          aggregate.locales[loc] = { processed: 0, errors: [e.message] };
          important(`   ❌ [${done + 1}/${total}] ${locLabel} 失败: ${e.message}`);
          prog(`[${done + 1}/${total}] ${locLabel} 失败 ✗`);
        }
      }

      aggregate.elapsedSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));

      // Clear cache so frontend picks up translations
      clearEntityTranslationCache();

      const totalErrors = Object.values(aggregate.locales).reduce((s, l) => s + l.errors.length, 0);
      const successLocales = Object.entries(aggregate.locales).filter(([, s]) => s.errors.length === 0);
      const failedLocales = Object.entries(aggregate.locales).filter(([, s]) => s.errors.length > 0);

      important(`🏁 翻译汇总: ${aggregate.totalProcessed} 条, ${successLocales.length} 语言成功, ${failedLocales.length} 语言失败, 耗时 ${aggregate.elapsedSec}s`);
      if (failedLocales.length > 0) {
        for (const [loc, st] of failedLocales) {
          important(`   ❌ ${LOCALE_LABELS[loc as keyof typeof LOCALE_LABELS] || loc}: ${st.errors.join(", ")}`);
        }
      }

      if (totalErrors > 0) {
        prog(`翻译完成：${aggregate.totalProcessed} 条，${totalErrors} 个错误，耗时 ${aggregate.elapsedSec}s`);
      } else {
        prog(`翻译完成：${aggregate.totalProcessed} 条，耗时 ${aggregate.elapsedSec}s`);
      }

      return aggregate;
    } catch (e: any) {
      const msg = e?.message || String(e) || "翻译失败";
      setError(msg);
      prog("");
      return null;
    } finally {
      setTranslating(false);
    }
  }, [entityType, translateSingleLocale, log, important, prog]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { translating, progress, error, setError, translateEntities, cancel };
}
