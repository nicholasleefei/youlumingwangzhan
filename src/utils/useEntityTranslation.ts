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

export function useEntityTranslation(entityType: EntityType) {
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

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
      limit_entities: 300, // cap to avoid timeout
    };
    if (jmIds && jmIds.length > 0) {
      body.jm_ids = jmIds.map(String);
    }

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
    return data as TranslateResult;
  }, [entityType]);

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
        setProgress(`[${done + 1}/${total}] 正在翻译${entityLabel} → ${locLabel}...`);

        try {
          const singleResult = await translateSingleLocale(loc, jmIds, { cancelled: cancelRef.current });

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
          setProgress(`[${done + 1}/${total}] ${locLabel} 完成 ✓`);
        } catch (e: any) {
          aggregate.locales[loc] = { processed: 0, errors: [e.message] };
          setProgress(`[${done + 1}/${total}] ${locLabel} 失败 ✗ - ${e.message.substring(0, 50)}`);
        }
      }

      aggregate.elapsedSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));

      // Clear cache so frontend picks up translations
      clearEntityTranslationCache();

      const totalErrors = Object.values(aggregate.locales).reduce((s, l) => s + l.errors.length, 0);
      if (totalErrors > 0) {
        setProgress(`翻译完成：${aggregate.totalProcessed} 条，${totalErrors} 个错误，耗时 ${aggregate.elapsedSec}s`);
      } else {
        setProgress(`翻译完成：${aggregate.totalProcessed} 条，耗时 ${aggregate.elapsedSec}s`);
      }

      return aggregate;
    } catch (e: any) {
      const msg = e?.message || String(e) || "翻译失败";
      setError(msg);
      setProgress("");
      return null;
    } finally {
      setTranslating(false);
    }
  }, [entityType, translateSingleLocale]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { translating, progress, error, setError, translateEntities, cancel };
}
