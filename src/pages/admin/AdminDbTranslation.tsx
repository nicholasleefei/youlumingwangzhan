import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";
import { pageCardCls, pageTitleCls, pageDescCls, primaryButtonCls, secondaryButtonCls, inputCls, labelCls } from "@/admin/AdminApp";

type DbTranslationConfig = {
  enabled?: boolean;
  source_locale?: string;
  target_locales?: string[];
  model?: string;
  endpoint?: string;
};

export default function AdminDbTranslation() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<DbTranslationConfig>({
    enabled: false,
    source_locale: "zh-CN",
    target_locales: ["en"],
    model: "doubao-seed-2-0-lite-260428",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3/responses",
  });
  const [arkApiKey, setArkApiKey] = useState("");
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(0);

  const localeOptions = useMemo(() => {
    return SUPPORTED_LOCALES.filter((l) => l !== "zh-CN");
  }, []);

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
        model: String(config.model || "doubao-seed-2-0-lite-260428"),
        endpoint: String(config.endpoint || "https://ark.cn-beijing.volces.com/api/v3/responses"),
      };

      const { error: cfgErr } = await supabase
        .from("site_config")
        .upsert({ key: "db_translation_ai", value }, { onConflict: "key" });
      if (cfgErr) throw cfgErr;

      if (arkApiKey.trim()) {
        const { error: keyErr } = await supabase
          .from("admin_secrets")
          .upsert({ key: "ark_api_key", value: arkApiKey.trim() }, { onConflict: "key" });
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
      await refreshStatus();
    } catch (e: any) {
      setError(e?.message || String(e) || "执行失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>数据库翻译</h3>
        <p className={pageDescCls()}>
          将数据库中的品牌/车系/车型详细字段自动翻译为多语言，并在前台按语言展示
        </p>
      </div>

      {message ? (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700">{error}</div>
      ) : null}

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
                placeholder="doubao-seed-2-0-lite-260428"
              />
            </div>

            <div>
              <label className={labelCls()}>API Endpoint</label>
              <input
                className={inputCls()}
                value={String(config.endpoint || "")}
                onChange={(e) => setConfig((p) => ({ ...p, endpoint: e.target.value }))}
                placeholder="https://ark.cn-beijing.volces.com/api/v3/responses"
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
              <label className={labelCls()}>Ark API Key（仅保存到后台安全表）</label>
              <input
                type="password"
                className={inputCls()}
                value={arkApiKey}
                onChange={(e) => setArkApiKey(e.target.value)}
                placeholder="粘贴 ARK_API_KEY"
              />
              <div className="mt-2 text-xs text-zinc-500">
                不会在页面回显已保存的 Key；如需更新请重新填写并保存
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
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">待翻译</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{pending}</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs text-zinc-500">失败</div>
              <div className="mt-1 text-2xl font-semibold text-zinc-900">{failed}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" className={primaryButtonCls()} disabled={loading || pending <= 0} onClick={() => void runOnce()}>
              处理 3 条
            </button>
            <button
              type="button"
              className={secondaryButtonCls()}
              disabled={loading}
              onClick={() => void supabase.functions.invoke("db-translate", { body: { action: "run", limit: 20 } }).then(() => refreshStatus())}
            >
              处理 20 条
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

