import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { pageCardCls, pageTitleCls, pageDescCls, primaryButtonCls, secondaryButtonCls, inputCls, labelCls, subTabCls, tableContainerCls, tableHeaderCls, tableRowCls } from "@/admin/AdminApp";
import i18n from "@/i18n/i18n";
import { clearEntityTranslationCache } from "@/utils/entityTranslation";
import { ensureUiTranslationsForLocale } from "@/i18n/i18n";

type DbTranslationConfig = {
  enabled?: boolean;
  source_locale?: string;
  target_locales?: string[];
  model?: string;
  endpoint?: string;
};

type SubTab = "db" | "ui";

type UiLocaleStatus = {
  locale: string;
  total: number;
  untranslated: number;
  loading: boolean;
};

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
    // Untranslated: missing or still equals Chinese source (or sentinel)
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

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            `You are an expert translator for YOLUMI, a B2B China auto export platform (professional China auto bulk supply, connecting global markets). ` +
            `Translate these UI strings from Chinese to ${langName} (locale: ${targetLocale}). ` +
            `Use natural, professional ${langName} phrasing appropriate for a B2B automotive website. ` +
            `CRITICAL: Keep all {{placeholders}}, HTML tags, CSS class names, and special tokens EXACTLY unchanged. ` +
            `For automotive terms, ensure industry-standard translations in the target language: ` +
            `品牌→Brand, 车系→Series, 车型→Model, 纯电动→BEV, 插电式混合动力→PHEV, 续航里程→Range, 动力系统→Powertrain, ` +
            `询价→Inquiry, 报价→Quote, FOB价格→FOB Price, 规格参数→Specifications, 出口→Export. ` +
            `Return ONLY a valid JSON object with identical keys and translated values. No markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Translate this json:\n${JSON.stringify(sourceTexts, null, 2)}`,
        },
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

export default function AdminDbTranslation() {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState<SubTab>("db");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // DB config
  const [config, setConfig] = useState<DbTranslationConfig>({
    enabled: false,
    source_locale: "zh-CN",
    target_locales: ["en"],
    model: "deepseek-v4-flash",
    endpoint: "https://api.deepseek.com/chat/completions",
  });
  const [deepseekApiKey, setDeepseekApiKey] = useState("");
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);
  const [done, setDone] = useState(0);
  const [translations, setTranslations] = useState(0);

  // Progress tracking
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [logs, setLogs] = useState<Array<{ time: string; type: "info" | "success" | "error"; msg: string }>>([]);
  const abortRef = useRef(false);

  // UI translation
  const [uiStatus, setUiStatus] = useState<UiLocaleStatus[]>([]);
  const [uiTranslating, setUiTranslating] = useState<string | null>(null);
  const [uiProgress, setUiProgress] = useState("");

  const localeOptions = useMemo(() => {
    return SUPPORTED_LOCALES.filter((l) => l !== "zh-CN");
  }, []);

  // ─── DB translation ─────────────────────────────────────

  async function refreshStatus() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-translate", {
        body: { action: "status" },
      });
      if (error) throw error;
      if (data?.config) setConfig((prev) => ({ ...prev, ...(data.config as DbTranslationConfig) }));
      setPending(Number(data?.pending || 0));
      setFailed(Number(data?.error || 0));
      setDone(Number(data?.done || 0));
      setTranslations(Number(data?.translations || 0));
    } catch (e: any) {
      setError(e?.message || String(e) || "状态获取失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const value = {
        enabled: Boolean(config.enabled),
        source_locale: String(config.source_locale || "zh-CN"),
        target_locales: Array.isArray(config.target_locales) ? config.target_locales : ["en"],
        model: String(config.model || "deepseek-v4-flash"),
        endpoint: String(config.endpoint || "https://api.deepseek.com/chat/completions"),
      };

      const { error: cfgErr } = await supabase
        .from("site_config")
        .upsert({ key: "db_translation_ai", value }, { onConflict: "key" });
      if (cfgErr) throw cfgErr;

      if (deepseekApiKey.trim()) {
        const { error: keyErr } = await supabase
          .from("admin_secrets")
          .upsert({ key: "deepseek_api_key", value: deepseekApiKey.trim() }, { onConflict: "key" });
        if (keyErr) throw keyErr;
      }

      setMessage("已保存");
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || String(e) || "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function runOnce() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-translate", {
        body: { action: "run", limit: 3 },
      });
      if (error) throw error;
      setMessage(`已处理 ${data?.processed ?? 0} 条任务`);
      const details = data?.details as any[] | undefined;
      if (details?.length) {
        for (const d of details) {
          addLog("info", `[${d.entityType}] ${d.entityName} → ${d.locale}: ${d.key} | ${d.source?.substring(0, 30)} → ${d.translated?.substring(0, 30)}`);
        }
      }
      clearEntityTranslationCache();
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || String(e) || "执行失败");
    } finally {
      setLoading(false);
    }
  }

  function addLog(type: "info" | "success" | "error", msg: string) {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setLogs((prev) => [...prev.slice(-199), { time, type, msg }]);
  }

  async function runBatch(limit: number) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-translate", {
        body: { action: "run", limit },
      });
      if (error) throw error;
      setMessage(`处理完成：${data?.processed ?? 0} 条成功${data?.failed ? "，" + data.failed + " 条失败" : ""}`);
      const details = data?.details as any[] | undefined;
      if (details?.length) {
        for (const d of details) {
          addLog("info", `[${d.entityType}] ${d.entityName} → ${d.locale}: ${d.key} | ${d.source?.substring(0, 30)} → ${d.translated?.substring(0, 30)}`);
        }
      }
      clearEntityTranslationCache();
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || String(e) || "执行失败");
    } finally {
      setLoading(false);
    }
  }

  async function runWithProgress(batchSize: number) {
    setIsProcessing(true);
    abortRef.current = false;
    setError(null);
    setMessage(null);
    setLogs([]);
    setProgressCurrent(0);

    try {
      addLog("info", `开始处理翻译任务，每批 ${batchSize} 条...`);

      let totalProcessed = 0;
      while (!abortRef.current) {
        const { data, error } = await supabase.functions.invoke("db-translate", {
          body: { action: "run", limit: batchSize },
        });
        if (error) throw error;

        const ok = Number(data?.processed || 0);
        const fail = Number(data?.failed || 0);
        if (ok === 0 && fail === 0) break; // No more pending jobs

        totalProcessed += ok + fail;
        setProgressCurrent(totalProcessed);

        if (ok > 0) addLog("success", `已处理 ${totalProcessed} 条（+${ok} 成功${fail > 0 ? "，" + fail + " 失败" : ""}）`);
        if (fail > 0) addLog("error", `批次中有 ${fail} 条失败`);

        // Display translation details
        const details = data?.details as any[] | undefined;
        if (details && details.length > 0) {
          for (const d of details) {
            const label = d.entityType === "brand" ? "品牌" : d.entityType === "series" ? "车系" : d.entityType === "model_detail" ? "车型" : d.entityType;
            addLog("info", `[${label}] ${d.entityName} → ${d.locale}: ${d.key} | ${d.source.substring(0, 30)} → ${d.translated.substring(0, 30)}`);
          }
        }
      }

      if (abortRef.current) {
        addLog("info", `已停止，共处理 ${totalProcessed} 条`);
      } else {
        addLog("success", `全部完成！共处理 ${totalProcessed} 条`);
      }

      clearEntityTranslationCache();
      await refreshStatus();
    } catch (e: any) {
      addLog("error", `错误：${e?.message || String(e)}`);
      setError(e?.message || String(e) || "执行失败");
    } finally {
      setIsProcessing(false);
      abortRef.current = false;
    }
  }

  function stopProcessing() {
    abortRef.current = true;
    addLog("info", "正在停止...");
  }

  async function createAllJobs() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-translate", {
        body: { action: "create_all_jobs" },
      });
      if (error) throw error;
      setMessage(`已创建 ${data?.created ?? 0} 条翻译任务`);
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || String(e) || "创建失败");
    } finally {
      setLoading(false);
    }
  }

  // ─── UI translation ─────────────────────────────────────

  const refreshUiStatus = useCallback(async () => {
    // Load DB translations into i18n bundles before counting
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
    const cfg = (siteCfg?.value as DbTranslationConfig) ?? {};
    const key = typeof secrets?.value === "string" ? secrets.value : "";
    return {
      apiKey: key || deepseekApiKey,
      endpoint: String(cfg.endpoint || config.endpoint || "https://api.deepseek.com/chat/completions"),
      model: String(cfg.model || config.model || "deepseek-v4-flash"),
    };
  }

  async function translateUiLocale(locale: string) {
    setUiTranslating(locale);
    setError(null);
    setMessage(null);
    try {
      const creds = await loadApiCredentials();
      if (!creds.apiKey) throw new Error("请先在数据库翻译页面保存 DeepSeek API Key");

      const zhKeys = getSourceKeys();
      const bundle = i18n.getResourceBundle(locale, "common") as Record<string, string> | undefined;

      // Collect keys that need translation (still Chinese or missing)
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

      // Stream results: save to DB one-by-one and show progress
      const translatedEntries = Object.entries(translated);
      let done = 0;
      const bundle2 = i18n.getResourceBundle(locale, "common") as Record<string, string>;

      for (const [k, v] of translatedEntries) {
        done++;

        // Save to DB immediately
        await supabase
          .from("ui_translations")
          .upsert({ locale, key: k, value: v, updated_at: new Date().toISOString() }, { onConflict: "locale,key" });

        // Update localStorage
        try {
          const cacheKey = "ui_tr_" + locale;
          const raw = localStorage.getItem(cacheKey);
          const existing = raw ? JSON.parse(raw) : { data: {}, ts: Date.now() };
          existing.data[k] = v;
          existing.ts = Date.now();
          localStorage.setItem(cacheKey, JSON.stringify(existing));
        } catch { /* ignore */ }

        // Patch runtime bundle immediately
        if (bundle2) bundle2[k] = v;

        // Show progress: 原词 → 翻译结果
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

      const { data, error } = await supabase
        .from("ui_translations")
        .select("key");

      if (error) throw error;

      const allKeys: string[] = [...new Set<string>((data ?? []).map((r: any) => String(r.key ?? "")))];
      const orphanKeys = allKeys.filter((k) => !validKeys.includes(k));

      if (orphanKeys.length === 0) {
        setMessage("没有无效翻译需要清理");
        return;
      }

      const { error: delErr } = await supabase
        .from("ui_translations")
        .delete()
        .in("key", orphanKeys);

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

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    if (subTab === "ui") { refreshUiStatus(); }
  }, [subTab]);

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-6">
        <h3 className={pageTitleCls()}>翻译管理</h3>
        <p className={pageDescCls()}>
          管理数据库实体翻译与界面文本翻译，支持 AI 自动翻译
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button type="button" className={subTabCls(subTab === "db")} onClick={() => setSubTab("db")}>
          数据库翻译
        </button>
        <button type="button" className={subTabCls(subTab === "ui")} onClick={() => setSubTab("ui")}>
          界面翻译
        </button>
      </div>

      {message ? (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 text-sm">{message}</div>
      ) : null}
      {error ? (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      ) : null}

      {/* ─── DB Translation ──────────────────────────────── */}
      {subTab === "db" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold text-zinc-900 mb-4">AI 配置</div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={Boolean(config.enabled)}
                  onChange={(e) => setConfig((p) => ({ ...p, enabled: e.target.checked }))}
                />
                启用数据库翻译
              </label>

              <div>
                <label className={labelCls()}>模型名称</label>
                <input
                  className={inputCls()}
                  value={String(config.model || "")}
                  onChange={(e) => setConfig((p) => ({ ...p, model: e.target.value }))}
                  placeholder="deepseek-v4-flash"
                />
              </div>

              <div>
                <label className={labelCls()}>API Endpoint</label>
                <input
                  className={inputCls()}
                  value={String(config.endpoint || "")}
                  onChange={(e) => setConfig((p) => ({ ...p, endpoint: e.target.value }))}
                  placeholder="https://api.deepseek.com/chat/completions"
                />
              </div>

              <div>
                <label className={labelCls()}>目标语言</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {localeOptions.map((l) => {
                    const checked = (config.target_locales || []).includes(l);
                    return (
                      <label key={l} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(config.target_locales || []);
                            if (e.target.checked) next.add(l);
                            else next.delete(l);
                            setConfig((p) => ({ ...p, target_locales: Array.from(next) }));
                          }}
                        />
                        {LOCALE_LABELS[l as Locale]}
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-zinc-500">源语言固定为 zh-CN（数据库原文）</div>
              </div>

              <div>
                <label className={labelCls()}>DeepSeek API Key</label>
                <input
                  type="password"
                  className={inputCls()}
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="粘贴 DEEPSEEK_API_KEY"
                />
                <div className="mt-2 text-xs text-zinc-500">
                  Key 仅存储于 admin_secrets 安全表，页面不回显
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" className={primaryButtonCls()} disabled={loading} onClick={() => void saveConfig()}>
                  {loading ? "处理中..." : "保存配置"}
                </button>
                <button type="button" className={secondaryButtonCls()} disabled={loading} onClick={() => void refreshStatus()}>
                  刷新状态
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="text-sm font-semibold text-zinc-900 mb-4">任务状态</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs text-zinc-500">待翻译</div>
                <div className="mt-1 text-xl font-semibold text-zinc-900">{pending}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs text-zinc-500">已完成</div>
                <div className="mt-1 text-xl font-semibold text-green-700">{done}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs text-zinc-500">翻译结果</div>
                <div className="mt-1 text-xl font-semibold text-blue-700">{translations}</div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-xs text-zinc-500">失败</div>
                <div className="mt-1 text-xl font-semibold text-red-700">{failed}</div>
              </div>
            </div>

            {/* Progress bar */}
            {isProcessing ? (
              <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-800">
                    翻译中... 已处理 {progressCurrent} 条
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full animate-pulse"
                    style={{ width: "100%" }}
                  />
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 transition-all"
                  onClick={stopProcessing}
                >
                  停止
                </button>
              </div>
            ) : null}

            {/* Log panel */}
            {logs.length > 0 ? (
              <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-900 p-3 max-h-48 overflow-y-auto font-mono text-xs">
                {logs.map((l, i) => (
                  <div key={i} className={
                    l.type === "success" ? "text-green-400" :
                    l.type === "error" ? "text-red-400" : "text-zinc-400"
                  }>
                    [{l.time}] {l.msg}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={primaryButtonCls()} disabled={loading || pending <= 0} onClick={() => void runOnce()}>
                处理 3 条
              </button>
              <button type="button" className={secondaryButtonCls()} disabled={loading} onClick={() => void runBatch(20)}>
                处理 20 条
              </button>
              <button type="button" className={secondaryButtonCls()} disabled={loading} onClick={() => void runBatch(50)}>
                处理 50 条
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-200">
              <div className="text-xs text-zinc-500 mb-2">一键翻译</div>
              <button
                type="button"
                className={primaryButtonCls()}
                disabled={isProcessing}
                onClick={async () => {
                  setMessage(null);
                  setError(null);
                  addLog("info", "准备翻译全部数据...");
                  // Step 1: Create jobs for everything
                  const { data: createData, error: createErr } = await supabase.functions.invoke("db-translate", { body: { action: "create_all_jobs" } });
                  if (createErr) { setError(createErr.message); return; }
                  addLog("info", `已创建/更新 ${createData?.created ?? 0} 条翻译任务`);
                  await refreshStatus();
                  // Step 2: Start translating
                  void runWithProgress(3);
                }}
              >
                {isProcessing ? "翻译中..." : "一键翻译全部数据"}
              </button>
              {!isProcessing ? (
                <button
                  type="button"
                  className={"ml-2 " + secondaryButtonCls()}
                  disabled={isProcessing || pending <= 0}
                  onClick={() => void runWithProgress(3)}
                >
                  仅处理现有任务
                </button>
              ) : null}
              <div className="mt-2 text-xs text-zinc-400">
                自动为所有品牌/车系/车型（含 raw 详细参数）创建翻译任务并逐批翻译。每批 3 条，可随时停止。
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── UI Translation ───────────────────────────────── */}
      {subTab === "ui" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-zinc-500">
              共 {SUPPORTED_LOCALES.length - 1} 个目标语言 · {uiStatus.reduce((s, st) => s + st.untranslated, 0)} 个待翻译 key
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={secondaryButtonCls()}
                onClick={refreshUiStatus}
                disabled={!!uiTranslating}
              >
                刷新状态
              </button>
              <button
                type="button"
                className={primaryButtonCls()}
                disabled={!!uiTranslating || uiStatus.every((s) => s.untranslated === 0)}
                onClick={() => void translateAllUi()}
              >
                翻译全部
              </button>
              <button
                type="button"
                className={secondaryButtonCls()}
                disabled={!!uiTranslating}
                onClick={() => void cleanOrphanedUiTranslations()}
              >
                清理无效翻译
              </button>
            </div>
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
      ) : null}
    </div>
  );
}
