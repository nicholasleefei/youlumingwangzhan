// Centralized access to admin API secrets stored in the admin_secrets table.
// Replaces localStorage for jumdata, deepseek, and volcengine credentials.
import { supabase } from "./supabaseClient";

const cache = new Map<string, { value: string; ts: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getSecret(key: string): Promise<string> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.value;
  const { data } = await supabase
    .from("admin_secrets")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  const val = typeof (data as any)?.value === "string" ? (data as any).value : "";
  cache.set(key, { value: val, ts: Date.now() });
  return val;
}

export const getJumdataAppId = () => getSecret("jumdata_app_id");
export const getJumdataAppSecret = () => getSecret("jumdata_app_secret");
export const getDeepseekApiKey = () => getSecret("deepseek_api_key");
export const getVolcengineAccessKey = () => getSecret("volcengine_access_key");
export const getVolcengineSecretKey = () => getSecret("volcengine_secret_key");

export async function saveSecret(key: string, value: string) {
  await supabase
    .from("admin_secrets")
    .upsert({ key, value }, { onConflict: "key" });
  cache.delete(key);
}

export async function saveJumdataCredentials(appId: string, appSecret: string) {
  await Promise.all([
    saveSecret("jumdata_app_id", appId),
    saveSecret("jumdata_app_secret", appSecret),
  ]);
}
