import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { pageCardCls, pageTitleCls, pageDescCls, tableContainerCls, tableHeaderCls, tableRowCls } from "@/admin/AdminApp";
import i18n from "@/i18n/i18n";
import { ensureUiTranslationsForLocale } from "@/i18n/i18n";
import { TARGET_LOCALES } from "@/utils/entityTranslation";
import { useEntityTranslation } from "@/utils/useEntityTranslation";
import type { AggregateResult } from "@/utils/useEntityTranslation";

// ============================================================
// Types
// ============================================================

type UiLocaleStatus = {
  locale: string;
  total: number;
  untranslated: number;
  loading: boolean;
};

type EntityTranslationStats = {
  entityType: string;
  total: number;
  locales: Record<string, { translated: number; missing: number }>;
};

type QueueStatus = {
  pending: number;
  processing: number;
  done: number;
  error: number;
};

// ============================================================
// UI Translation Functions
// ============================================================

function getSourceKeys(): Record<string, string> {
  const bundle = i18n.getResourceBundle("zh-CN", "common") as Record<string, string> | undefined;
  return bundle ?? {};
}

function countUntranslated(locale: string): number {
  const zhKeys = getSourceKeys();
  const bundle = i18n.getResourceBundle(locale, "common") as Record<string, string> | undefined;
  if (!bundle) return Object.keys(zhKeys).length;
  let count = 0;
  for (const [k, zhVal] of Object.entries(zhKeys)) {
    const val = bundle[k];
    if (val === undefined || val === zhVal || (typeof val === "string" && val.startsWith("__MISSING_ZH__"))) count++;
  }
  return count;
}

async function callArkApi(params: {
  apiKey: string;
  endpoint: string;
  model: string;
  targetLocale: string;
  sourceTexts: Record<string, string>;
}): Promise<Record<string, string>> {
  const { apiKey, endpoint, model, targetLocale, sourceTexts } = params;
  const langName = LOCALE_LABELS[targetLocale as Locale] || targetLocale;

  const localeRules: Record<string, string> = {
    "ar": "RTL (right-to-left) language. Ensure text alignment is correct in UI.",
    "ur": "RTL (right-to-left) language. Use Urdu script with proper diacritics.",
    "ru": "Cyrillic script. Use professional Russian automotive terminology.",
    "kk": "Cyrillic script. Use Kazakh automotive terminology.",
    "th": "Thai script. Transliterate brand names to Thai characters.",
    "tr": "Use proper Turkish diacritics (ç, ğ, ı, ö, ş, ü).",
    "pt-BR": "Use Brazilian Portuguese with appropriate automotive terminology.",
    "en": "Use international English terms for brands where standard."
  };
  const rules = localeRules[targetLocale] || "";

  const systemPrompt = [
    `You are an expert translator for YOLUMI, a B2B China auto export platform (professional China auto bulk supply, connecting global markets).`,
    ``,
    `Translate UI strings from Chinese to ${langName} (locale: ${targetLocale}).`,
    rules ? `SPECIAL RULES: ${rules}` : "",
    ``,
    `CRITICAL: Keep all {{placeholders}}, HTML tags, CSS class names, and special tokens EXACTLY unchanged.`,
    ``,
    `Automotive terms mapping:`,
    `  品牌→Brand, 车系→Series, 车型→Model, 纯电动→BEV, 插电式混合动力→PHEV`,
    `  续航里程→Range, 动力系统→Powertrain, 询价→Inquiry, 报价→Quote`,
    `  FOB价格→FOB Price, 规格参数→Specifications, 出口→Export`,
    `  SUV→SUV, MPV→MPV, 轿车→Sedan, 皮卡→Pickup`,
    ``,
    `Return ONLY a valid JSON object with identical keys and translated values. No markdown, no explanation.`,
  ].filter(Boolean).join("\n");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Translate this json:\n${JSON.stringify(sourceTexts, null, 2)}` },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`API ${res.status}: ${txt.slice(0, 300)}`);

  const payload = JSON.parse(txt);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("API returned empty content");
  const parsed = JSON.parse(content);
  if (typeof parsed !== "object" || parsed === null) throw new Error("API returned non-object");

  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === "string") result[k] = v;
  }
  return result;
}

// ============================================================
// Main Component
// ============================================================

export default function AdminDbTranslation() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [volcengineApiKey, setVolcengineApiKey] = useState("");
  const [volcengineApiSecret, setVolcengineApiSecret] = useState("");
  const [useVolcengine, setUseVolcengine] = useState(true); // 默认使用火山引擎

  // UI translation
  const [uiStatus, setUiStatus] = useState<UiLocaleStatus[]>([]);
  const [uiTranslating, setUiTranslating] = useState<string | null>(null);
  const [uiProgress, setUiProgress] = useState("");

  // Database translation
  const [dbStats, setDbStats] = useState<EntityTranslationStats[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, processing: 0, done: 0, error: 0 });
  const [dbLoading, setDbLoading] = useState(false);
  const [translatingEntities, setTranslatingEntities] = useState(false);

  // 四个实体类型的独立翻译 hooks，注入日志回调
  const { translating: transBrand, progress: transBrandProgress, translateEntities: transBrandFn } = useEntityTranslation("brand", { onLog: addDebugLog, onImportant: addDebugLogImportant });
  const { translating: transSeries, progress: transSeriesProgress, translateEntities: transSeriesFn } = useEntityTranslation("series", { onLog: addDebugLog, onImportant: addDebugLogImportant });
  const { translating: transModel, progress: transModelProgress, translateEntities: transModelFn } = useEntityTranslation("model", { onLog: addDebugLog, onImportant: addDebugLogImportant });
  const { translating: transDetail, progress: transDetailProgress, translateEntities: transDetailFn } = useEntityTranslation("model_detail", { onLog: addDebugLog, onImportant: addDebugLogImportant });

  // 每个实体类型的翻译按钮处理函数
  async function handleTranslateEntity(entityType: string, fn: (locales: string[], jmIds?: (string | number)[]) => Promise<AggregateResult | null>) {
    const label = entityType === "brand" ? "品牌" : entityType === "series" ? "车系" : entityType === "model" ? "车型" : "车型详情";
    const emoji = entityType === "brand" ? "🏭" : entityType === "series" ? "🚗" : entityType === "model" ? "🔧" : "📋";
    setDebugLogs([]);
    addDebugLogImportant(`${emoji} 🚀 启动翻译【${label}】`);
    addDebugLog(`📋 目标语言：${TARGET_LOCALES.map(l => LOCALE_LABELS[l as keyof typeof LOCALE_LABELS] || l).join("、")}`);
    addDebugLog(`⏳ 翻译引擎：火山引擎 (Volcengine)`);
    const startTime = Date.now();

    // Fixed: pass individual locale strings from TARGET_LOCALES (readonly array), not the readonly tuple
    const result = await fn([...TARGET_LOCALES] as string[]);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (result) {
      addDebugLogImportant(`✅ 【${label}】全部翻译完成！总耗时: ${elapsed}s`);
      addDebugLog(`📊 源实体: ${result.totalEntities} · 处理条目: ${result.totalProcessed} · 覆盖语言: ${Object.keys(result.locales || {}).length}`);
      addDebugLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      // Per-locale stats
      for (const [loc, st] of Object.entries(result.locales || {})) {
        const locLabel = LOCALE_LABELS[loc as keyof typeof LOCALE_LABELS] || loc;
        if (st.errors.length > 0) {
          addDebugLog(`  ${locLabel.padEnd(20)} ${String(st.processed).padStart(4)} 条  ⚠️ ${st.errors.length} 错误`);
        } else {
          addDebugLog(`  ${locLabel.padEnd(20)} ${String(st.processed).padStart(4)} 条  ✅`);
        }
      }
      addDebugLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      await fetchDbTranslationStats();
    } else {
      addDebugLogImportant(`❌ 【${label}】翻译失败，请检查引擎配置和网络连接`);
    }
  }

  const localeOptions = useMemo(() => {
    return SUPPORTED_LOCALES.filter((l) => l !== "zh-CN");
  }, []);

  // ============================================================
  // UI Translation Functions
  // ============================================================

  const refreshUiStatus = useCallback(async () => {
    await Promise.all(localeOptions.map((loc) => ensureUiTranslationsForLocale(loc)));

    const zhKeys = getSourceKeys();
    const total = Object.keys(zhKeys).length;
    const statuses: UiLocaleStatus[] = localeOptions.map((loc) => ({
      locale: loc,
      total,
      untranslated: countUntranslated(loc),
      loading: false,
    }));
    setUiStatus(statuses);
  }, [localeOptions]);

  async function loadApiCredentials() {
    const [{ data: siteCfg }, { data: secrets }] = await Promise.all([
      supabase.from("site_config").select("value").eq("key", "db_translation_ai").maybeSingle(),
      supabase.from("admin_secrets").select("value").eq("key", "deepseek_api_key").maybeSingle(),
    ]);
    const cfg = (siteCfg as any)?.value ?? {};
    const key = typeof secrets?.value === "string" ? secrets.value : "";
    return {
      apiKey: key || deepseekApiKey,
      endpoint: String(cfg.endpoint || "https://api.deepseek.com/chat/completions"),
      model: String(cfg.model || "deepseek-v4-flash"),
    };
  }

  async function translateUiLocale(locale: string) {
    setUiTranslating(locale);
    setError(null);
    setMessage(null);
    try {
      const creds = await loadApiCredentials();
      if (!creds.apiKey) throw new Error("请先保存 DeepSeek API Key");

      const zhKeys = getSourceKeys();
      const bundle = i18n.getResourceBundle(locale, "common") as Record<string, string> | undefined;

      const toTranslate: Record<string, string> = {};
      for (const [k, zhVal] of Object.entries(zhKeys)) {
        const val = bundle?.[k];
        if (val === undefined || val === zhVal || (typeof val === "string" && val.startsWith("__MISSING_ZH__"))) {
          toTranslate[k] = zhVal;
        }
      }

      const keysToTranslate = Object.keys(toTranslate);
      if (keysToTranslate.length === 0) {
        setMessage(`${LOCALE_LABELS[locale as Locale] || locale} 全部已翻译`);
        return;
      }

      setUiProgress(`正在翻译 ${LOCALE_LABELS[locale as Locale] || locale}（${keysToTranslate.length} 个 key）...`);

      const translated = await callArkApi({
        apiKey: creds.apiKey,
        endpoint: creds.endpoint,
        model: creds.model,
        targetLocale: locale,
        sourceTexts: toTranslate,
      });

      const translatedEntries = Object.entries(translated);
      let done = 0;
      const bundle2 = i18n.getResourceBundle(locale, "common") as Record<string, string>;

      for (const [k, v] of translatedEntries) {
        done++;

        await supabase
          .from("ui_translations")
          .upsert({ locale, key: k, value: v, updated_at: new Date().toISOString() }, { onConflict: "locale,key" });

        try {
          const cacheKey = "ui_tr_" + locale;
          const raw = localStorage.getItem(cacheKey);
          const existing = raw ? JSON.parse(raw) : { data: {}, ts: Date.now() };
          existing.data[k] = v;
          existing.ts = Date.now();
          localStorage.setItem(cacheKey, JSON.stringify(existing));
        } catch { /* ignore */ }

        if (bundle2) bundle2[k] = v;

        const zhOriginal = String(toTranslate[k] ?? "").substring(0, 40);
        const trResult = String(v ?? "").substring(0, 40);
        setUiProgress(`${done}/${translatedEntries.length}  ${zhOriginal} → ${trResult}`);
      }

      setMessage(`${LOCALE_LABELS[locale as Locale] || locale} 翻译完成：${translatedEntries.length} 个 key`);
      void refreshUiStatus();
    } catch (e: any) {
      setError(e?.message || String(e) || `${locale} 翻译失败`);
    } finally {
      setUiTranslating(null);
      setUiProgress("");
    }
  }

  async function cleanOrphanedUiTranslations() {
    setError(null);
    setMessage(null);
    try {
      const enKeys = getSourceKeys();
      const validKeys = Object.keys(enKeys);

      const { data, error } = await supabase.from("ui_translations").select("key");
      if (error) throw error;

      const allKeys: string[] = [...new Set<string>((data ?? []).map((r: any) => String(r.key ?? "")))];
      const orphanKeys = allKeys.filter((k) => !validKeys.includes(k));

      if (orphanKeys.length === 0) {
        setMessage("没有无效翻译需要清理");
        return;
      }

      const { error: delErr } = await supabase.from("ui_translations").delete().in("key", orphanKeys);
      if (delErr) throw delErr;
      setMessage(`已清理 ${orphanKeys.length} 条无效翻译`);
    } catch (e: any) {
      setError(e?.message || String(e) || "清理失败");
    }
  }

  async function translateAllUi() {
    setError(null);
    setMessage(null);
    const toDo = uiStatus.filter((s) => s.untranslated > 0);
    if (toDo.length === 0) {
      setMessage("所有语言已翻译完成");
      return;
    }
    for (const st of toDo) {
      await translateUiLocale(st.locale);
    }
    setMessage("全部语言翻译完成");
  }

  async function saveApiKey() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      // 保存 DeepSeek API Key
      if (deepseekApiKey.trim()) {
        const { error: keyErr } = await supabase
          .from("admin_secrets")
          .upsert({ key: "deepseek_api_key", value: deepseekApiKey.trim() }, { onConflict: "key" });
        if (keyErr) throw keyErr;
      }

      // 保存火山引擎 API Key 和 Secret
      if (volcengineApiKey.trim()) {
        const { error: volcKeyErr } = await supabase
          .from("admin_secrets")
          .upsert({ key: "volcengine_api_key", value: volcengineApiKey.trim() }, { onConflict: "key" });
        if (volcKeyErr) throw volcKeyErr;
      }

      if (volcengineApiSecret.trim()) {
        const { error: volcSecretErr } = await supabase
          .from("admin_secrets")
          .upsert({ key: "volcengine_api_secret", value: volcengineApiSecret.trim() }, { onConflict: "key" });
        if (volcSecretErr) throw volcSecretErr;
      }

      // 更新 site_config 中的翻译配置
      const { data: siteCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "db_translation_ai")
        .maybeSingle();

      const currentConfig = (siteCfg?.value as any) || {};
      const newConfig = {
        ...currentConfig,
        use_volcengine: useVolcengine,
        enabled: true,
      };

      const { error: configErr } = await supabase
        .from("site_config")
        .upsert({ key: "db_translation_ai", value: newConfig }, { onConflict: "key" });
      if (configErr) throw configErr;

      setMessage(`API Key 已保存，使用 ${useVolcengine ? "火山引擎" : "DeepSeek"} 翻译`);
    } catch (e: any) {
      setError(e?.message || String(e) || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  // Database Translation Functions
  // ============================================================

  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  function addDebugLog(message: string) {
    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const log = `[${timestamp}] ${message}`;
    console.log(log);
    setDebugLogs(prev => [...prev.slice(-200), log]); // 保留最近200条
  }
  function addDebugLogImportant(message: string) {
    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const log = `[${timestamp}] 🔥 ${message}`;
    console.log(log);
    setDebugLogs(prev => [...prev.slice(-200), log]);
  }

  async function fetchDbTranslationStats() {
    setDbLoading(true);
    setDbError(null);
    try {
      const stats: EntityTranslationStats[] = [];
      const entityTypes = ["brand", "series", "model", "model_detail"];
      const entityTableMap: Record<string, string> = {
        brand: "brands",
        series: "series",
        model: "models_jumdata",
        model_detail: "model_details",
      };

      for (const entityType of entityTypes) {
        const tableName = entityTableMap[entityType];
        const { count: total, error: totalErr } = await supabase
          .from(tableName)
          .select("jm_id", { count: "exact", head: true })
          .eq("activity_status", 0);

        if (totalErr) {
          console.error(`Failed to query ${tableName} for total:`, totalErr);
          stats.push({ entityType, total: 0, locales: {} });
          continue;
        }

        const locales: Record<string, { translated: number; missing: number }> = {};

        for (const locale of TARGET_LOCALES) {
          const safeLoc = locale.toLowerCase().replace(/-/g, "_");
          const transTable = `${entityType === "model" ? "models_jumdata" : entityType === "brand" ? "brands" : entityType === "series" ? "series" : "model_details"}_${safeLoc}`;
          const { count: translated, error: trErr } = await supabase
            .from(transTable)
            .select("jm_id", { count: "exact", head: true });

          if (trErr) {
            console.warn(`Failed to query ${transTable}:`, trErr.message, trErr.code);
            locales[locale] = { translated: 0, missing: total ?? 0 };
            continue;
          }
          const tCount = translated ?? 0;
          locales[locale] = {
            translated: tCount,
            missing: Math.max(0, (total ?? 0) - tCount),
          };
        }

        stats.push({ entityType, total: total ?? 0, locales });
      }

      setDbStats(stats);

      // 获取队列状态
      const { data: queueData } = await supabase
        .from("translation_jobs")
        .select("status")
        .order("created_at", { ascending: false })
        .limit(1000);

      const qStatus: QueueStatus = { pending: 0, processing: 0, done: 0, error: 0 };
      for (const job of (queueData ?? [])) {
        if (job.status === "pending") qStatus.pending++;
        else if (job.status === "processing") qStatus.processing++;
        else if (job.status === "done") qStatus.done++;
        else if (job.status === "error") qStatus.error++;
      }
      setQueueStatus(qStatus);
    } catch (e: any) {
      console.error("Failed to fetch db translation stats:", e);
      setDbError(e?.message || String(e));
    } finally {
      setDbLoading(false);
    }
  }

  async function triggerManualSync() {
    setMessage(null);
    setError(null);
    setDbLoading(true);
    setDebugLogs([]); // 清空日志

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const endpoint = `${supabaseUrl}/functions/v1/db-translate`;

      addDebugLog(`1. 开始手动同步检测...`);
      addDebugLog(`   API Endpoint: ${endpoint}`);

      // 调用 Edge Function 触发同步
      addDebugLog(`2. 调用 Edge Function: manual_sync`);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "manual_sync" }),
      });

      addDebugLog(`   Response Status: ${response.status}`);
      addDebugLog(`   Response Headers: ${JSON.stringify([...response.headers.entries()].reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {}))}`);

      const responseText = await response.text();
      addDebugLog(`   Response Body: ${responseText.substring(0, 500)}`);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        addDebugLog(`   ❌ JSON 解析失败: ${parseErr}`);
        throw new Error(`响应格式错误: ${responseText.substring(0, 200)}`);
      }

      addDebugLog(`   Parsed Result: ${JSON.stringify(result, null, 2)}`);

      if (result.ok) {
        addDebugLog(`3. ✅ 同步成功`);
        addDebugLog(`   pendingJobs: ${result.pendingJobs}`);
        setMessage(`同步完成，待处理任务: ${result.pendingJobs}`);

        // 刷新状态
        addDebugLog(`4. 刷新翻译统计...`);
        await fetchDbTranslationStats();
        addDebugLog(`5. ✅ 完成`);
      } else {
        addDebugLog(`   ❌ 同步失败: ${result.error}`);
        setError(result.error || "同步失败");
      }
    } catch (e: any) {
      addDebugLog(`   ❌ 异常: ${e?.message || String(e)}`);
      setError(e?.message || "同步失败");
    } finally {
      setDbLoading(false);
    }
  }

  async function processTranslationQueue() {
    setTranslatingEntities(true);
    setMessage(null);
    setError(null);
    setDebugLogs([]);

    let totalProcessed = 0;
    let iterations = 0;
    const BATCH_SIZE = 30; // 每批处理30条
    const LOG_EVERY = 5;  // 每5个批次打印一次详情

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const endpoint = `${supabaseUrl}/functions/v1/db-translate`;

      while (true) {
        iterations++;
        addDebugLog(`Batch #${iterations} (${BATCH_SIZE} items)...`);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "process_queue", limit: BATCH_SIZE }),
        });

        if (!response.ok) {
          addDebugLog(`HTTP ${response.status}`);
          break;
        }

        const responseText = await response.text();
        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          addDebugLog(`Invalid JSON response`);
          break;
        }

        if (result.processed === 0 || result.remaining === 0) {
          addDebugLog(`Queue empty. Total processed: ${totalProcessed}`);
          break;
        }

        totalProcessed += result.processed;

        // 只在每 LOG_EVERY 个批次或第一条时显示详情
        if (iterations <= 2 || iterations % LOG_EVERY === 0) {
          if (result.details && Array.isArray(result.details)) {
            const sample = result.details.slice(0, 3);
            for (const item of sample) {
              if (item.error) {
                addDebugLog(`  ❌ ${item.entity_type}#${item.jm_id} (${item.locale}): ${item.error}`);
              } else if (item.fields) {
                const names = item.fields.map((f) => `${f.field}: "${f.source}"→"${f.translated}"`).join(' | ');
                addDebugLog(`  ${item.entity_type}#${item.jm_id} (${item.locale}): ${names}`);
              }
            }
            if (result.details.length > 3) {
              addDebugLog(`  ... (+${result.details.length - 3} more items)`);
            }
          }
        }

        addDebugLog(`  processed=${result.processed}, rem=${result.remaining}, total=${totalProcessed}`);
      }

      setMessage(`翻译完成: 共 ${totalProcessed} 条`);
      await fetchDbTranslationStats();
    } catch (e: any) {
      addDebugLog(`Error: ${e?.message || String(e)}`);
      setError(e?.message || "处理失败");
    } finally {
      setTranslatingEntities(false);
    }
  }

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    void refreshUiStatus();
    void fetchDbTranslationStats();
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-6">
        <h3 className={pageTitleCls()}>翻译管理</h3>
        <p className={pageDescCls()}>
          管理界面文本翻译和数据库实体翻译
        </p>
      </div>

      {message ? (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 text-sm">{message}</div>
      ) : null}
      {error ? (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      ) : null}

      {/* API Key 配置 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 mb-6">
        <div className="text-sm font-semibold text-zinc-900 mb-4">翻译引擎配置</div>

        {/* 翻译引擎选择 */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-700 mb-2">选择翻译引擎</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!useVolcengine}
                onChange={() => setUseVolcengine(false)}
                className="w-4 h-4"
              />
              <span className="text-sm">DeepSeek AI</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={useVolcengine}
                onChange={() => setUseVolcengine(true)}
                className="w-4 h-4"
              />
              <span className="text-sm">火山引擎翻译</span>
            </label>
          </div>
        </div>

        {useVolcengine ? (
          /* 火山引擎配置 */
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-700 mb-1">Access Key ID</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm"
                value={volcengineApiKey}
                onChange={(e) => setVolcengineApiKey(e.target.value)}
                placeholder="粘贴火山引擎 Access Key ID"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-700 mb-1">Secret Access Key</label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm"
                value={volcengineApiSecret}
                onChange={(e) => setVolcengineApiSecret(e.target.value)}
                placeholder="粘贴火山引擎 Secret Access Key"
              />
            </div>
            <div className="text-xs text-zinc-500">
              Key 仅存储于 admin_secrets 安全表 · 区域默认: cn-north-1
            </div>
          </div>
        ) : (
          /* DeepSeek 配置 */
          <div>
            <label className="block text-sm text-zinc-700 mb-1">DeepSeek API Key</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-sm"
              value={deepseekApiKey}
              onChange={(e) => setDeepseekApiKey(e.target.value)}
              placeholder="粘贴 DEEPSEEK_API_KEY"
            />
            <div className="mt-1 text-xs text-zinc-500">Key 仅存储于 admin_secrets 安全表</div>
          </div>
        )}

        <button
          type="button"
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          disabled={loading}
          onClick={() => void saveApiKey()}
        >
          {loading ? "保存中..." : "保存配置"}
        </button>
      </div>

      {/* Database Translation Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-zinc-900">数据库实体翻译库</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              disabled={dbLoading}
              onClick={() => void fetchDbTranslationStats()}
            >
              刷新状态
            </button>
          </div>
        </div>

        {/* Error */}
        {dbError && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">翻译统计加载失败: {dbError}</div>}

        {/* 翻译进度提示 */}
        {(transBrand || transSeries || transModel || transDetail) && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
            {transBrand && transBrandProgress ? transBrandProgress :
             transSeries && transSeriesProgress ? transSeriesProgress :
             transModel && transModelProgress ? transModelProgress :
             transDetail && transDetailProgress ? transDetailProgress : "正在翻译..."}
          </div>
        )}

        {/* Debug Log - 始终显示在翻译过程中 */}
        {(debugLogs.length > 0) && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-900 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-zinc-300">📋 翻译日志</div>
              <button type="button" className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200" onClick={() => setDebugLogs([])}>清空</button>
            </div>
            <div className="font-mono text-xs text-green-400 whitespace-pre-wrap max-h-64 overflow-y-auto" id="translation-debug-log">
              {debugLogs.map((log, i) => <div key={i} className="py-0.5">{log}</div>)}
            </div>
          </div>
        )}

        {/* Stats Table */}
        {dbLoading ? (
          <div className="text-center py-8 text-zinc-500">加载中...</div>
        ) : dbStats.length > 0 ? (
          <div className={tableContainerCls()}>
            <div className={tableHeaderCls()} style={{ gridTemplateColumns: "100px 80px repeat(7, 1fr) 120px" }}>
              <div>实体类型</div>
              <div>总数</div>
              {TARGET_LOCALES.map((l) => (
                <div key={l} className="text-center">{LOCALE_LABELS[l as Locale] || l}</div>
              ))}
              <div className="text-center">操作</div>
            </div>

            {dbStats.map((stat) => {
              const isTransBrand = stat.entityType === "brand";
              const isTransSeries = stat.entityType === "series";
              const isTransModel = stat.entityType === "model";
              const isTransDetail = stat.entityType === "model_detail";
              const transBusy = (isTransBrand && transBrand) || (isTransSeries && transSeries) || (isTransModel && transModel) || (isTransDetail && transDetail);
              const transProg = isTransBrand ? transBrandProgress : isTransSeries ? transSeriesProgress : isTransModel ? transModelProgress : isTransDetail ? transDetailProgress : "";
              const transFn = isTransBrand ? transBrandFn : isTransSeries ? transSeriesFn : isTransModel ? transModelFn : isTransDetail ? transDetailFn : null;

              return (
              <div key={stat.entityType} className={tableRowCls(false)} style={{ gridTemplateColumns: "100px 80px repeat(7, 1fr) 120px" }}>
                <div className="font-medium">
                  {stat.entityType === "brand" ? "品牌" :
                   stat.entityType === "series" ? "车系" :
                   stat.entityType === "model" ? "车型" : "车型详情"}
                </div>
                <div className="text-zinc-500">{stat.total}</div>
                {TARGET_LOCALES.map((locale) => {
                  const localeStats = stat.locales[locale] || { translated: 0, missing: 0 };
                  const pct = stat.total > 0 ? Math.round((localeStats.translated / stat.total) * 100) : 0;
                  return (
                    <div key={locale} className="text-center">
                      <div className="text-xs text-zinc-500">{localeStats.translated}/{stat.total}</div>
                      <div className="w-full bg-zinc-200 rounded-full h-1.5 mt-1">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{pct}%</div>
                    </div>
                  );
                })}
                <div className="text-center">
                  <button
                    type="button"
                    disabled={transBusy || stat.total === 0}
                    onClick={() => handleTranslateEntity(stat.entityType, transFn!)}
                    className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {transBusy ? "翻译中..." : "翻译"}
                  </button>
                  {transBusy && transProg ? (
                    <div className="text-xs text-zinc-500 mt-1">{transProg}</div>
                  ) : null}
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">暂无数据，点击"刷新状态"加载</div>
        )}
      </div>

      {/* Debug Log Section */}
      {debugLogs.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-zinc-300">🔍 调试日志</div>
            <button
              type="button"
              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              onClick={() => setDebugLogs([])}
            >
              清空
            </button>
          </div>
          <div className="font-mono text-xs text-green-400 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {debugLogs.map((log, i) => (
              <div key={i} className="py-0.5">{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* UI Translation Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-zinc-900">界面文本翻译 (UI)</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              onClick={() => void refreshUiStatus()}
              disabled={!!uiTranslating}
            >
              刷新状态
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!uiTranslating || uiStatus.every((s) => s.untranslated === 0)}
              onClick={() => void translateAllUi()}
            >
              翻译全部
            </button>
            <button
              type="button"
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
              disabled={!!uiTranslating}
              onClick={() => void cleanOrphanedUiTranslations()}
            >
              清理无效翻译
            </button>
          </div>
        </div>

        <div className="text-sm text-zinc-500 mb-4">
          共 {SUPPORTED_LOCALES.length - 1} 个目标语言 · {uiStatus.reduce((s, st) => s + st.untranslated, 0)} 个待翻译 key
        </div>

        {uiProgress ? (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">{uiProgress}</div>
        ) : null}

        <div className={tableContainerCls()}>
          <div className={tableHeaderCls()} style={{ gridTemplateColumns: "1fr 80px 80px 120px" }}>
            <div>语言</div>
            <div>总数</div>
            <div>待翻译</div>
            <div>操作</div>
          </div>

          {uiStatus.map((st) => (
            <div key={st.locale} className={tableRowCls(false)} style={{ gridTemplateColumns: "1fr 80px 80px 120px" }}>
              <div className="font-medium">{LOCALE_LABELS[st.locale as Locale] || st.locale}</div>
              <div className="text-zinc-500">{st.total}</div>
              <div>
                {st.untranslated > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
                    {st.untranslated}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs font-semibold">
                    0
                  </span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!uiTranslating || st.untranslated === 0}
                  onClick={() => void translateUiLocale(st.locale)}
                >
                  {uiTranslating === st.locale ? "翻译中..." : "翻译"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}