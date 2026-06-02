import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function containsChinese(text: string): boolean {
  return /[一-鿿㐀-䶿豈-﫿]|[\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}]/u.test(text);
}

function isTranslatableString(val: unknown): val is string {
  if (typeof val !== "string") return false;
  const s = val.trim();
  if (!s) return false;
  // Skip pure numbers, measurements, color codes, URLs
  if (/^\d+(\.\d+)?(km\/h|km|mm|kg|秒|万|kWh|V|kW|N·m|rpm)?$/.test(s)) return false;
  if (/^[#0-9A-Fa-f,\s]+$/.test(s)) return false;
  if (/^https?:\/\//.test(s)) return false;
  if (s === "-" || s === "●" || s === "○" || s === "暂无") return false;
  return containsChinese(s);
}

function extractTranslatableValues(
  obj: unknown,
  prefix = ""
): Record<string, string> {
  const result: Record<string, string> = {};
  if (obj === null || obj === undefined) return result;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      if (typeof item === "object" && item !== null) {
        // For arrays of objects with "name"/"value" pattern, extract both
        if ("name" in item && isTranslatableString(item.name)) {
          result[`${prefix}[${idx}].name`] = item.name;
        }
        if ("value" in item && isTranslatableString(item.value)) {
          result[`${prefix}[${idx}].value`] = item.value;
        }
        if ("groupname" in item && isTranslatableString(item.groupname)) {
          result[`${prefix}[${idx}].groupname`] = item.groupname;
        }
        // Recurse into other object properties
        Object.entries(item as Record<string, unknown>).forEach(([k, v]) => {
          if (!["name", "value", "groupname"].includes(k)) {
            Object.assign(result, extractTranslatableValues(v, `${prefix}[${idx}].${k}`));
          }
        });
      } else if (isTranslatableString(item)) {
        result[`${prefix}[${idx}]`] = item;
      }
    });
    return result;
  }
  if (typeof obj === "object") {
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (isTranslatableString(val)) {
        result[path] = val;
      } else if (typeof val === "object" && val !== null) {
        Object.assign(result, extractTranslatableValues(val, path));
      }
    }
  }
  return result;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callTranslateApi(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  sourceLocale: string;
  targetLocale: string;
  data: Record<string, string>;
}): Promise<Record<string, string>> {
  const { endpoint, apiKey, model, sourceLocale, targetLocale, data } = params;
  const keys = Object.keys(data);
  if (keys.length === 0) return {};

  const system = [
    "You are an expert automotive translator for YOLUMI, a B2B China auto export platform connecting global markets with Chinese vehicles.",
    "",
    `Translate ALL Chinese text into natural, professional ${targetLocale}.`,
    "",
    "CRITICAL RULES:",
    "",
    "1. BRAND AND MODEL NAMES — MUST use the LOCAL script/orthography of the target locale, NOT always Latin letters:",
    "   - For Latin-script locales (English, French, Spanish, German, etc.): use the standard international form (比亚迪→BYD, 吉利→Geely, 长安→Changan, etc.)",
    "   - For Cyrillic-script locales (Russian, Kazakh, Kyrgyz, Tajik, etc.): TRANSLITERATE brand names into Cyrillic letters (比亚迪→БЙД, 吉利→Джили, 长安→Чанъань, 奥迪→Ауди, 丰田→Тойота, 奔驰→Мерседес-Бенц, 宝马→БМВ, etc.)",
    `   - For Arabic-script locales (Arabic, Persian, Urdu, Pashto, Kurdish, Uyghur, etc.): TRANSLITERATE brand names into Arabic script (比亚迪→بي واي دي, 吉利→جيلي, 长安→تشانجان, 奥迪→أودي, 丰田→تويوتا, 奔驰→مرسيدس-بنز, 宝马→بي إم دبليو, etc.)`,
    "   - For Hebrew: TRANSLITERATE into Hebrew script (比亚迪→בי ווי די, 吉利→ג'ילי, 长安→צ'אנגאן, 奥迪→אאודי, etc.)",
    "   - For Georgian (ka): TRANSLITERATE into Georgian Mkhedruli script (比亚迪→BYD, 吉利→გეელი, 长安→ჩანგანი, 奥迪→აუდი, etc.)",
    "   - For Armenian (hy): TRANSLITERATE into Armenian script (比亚迪→ԲԻԴի, 吉利→Գիլի, 长安→Չանգան, 奥迪→Աուդի, etc.)",
    "   - For Thai (th): TRANSLITERATE into Thai script (比亚迪→บีวายดี, 吉利→จีลี่, 长安→ฉางอาน, 奥迪→ออดี้, 丰田→โตโยต้า, etc.)",
    "   - For Lao (lo): TRANSLITERATE into Lao script (比亚迪→ບີວາຍດີ, 吉利→ຈີລີ, 长安→ຈາງອານ, 奥迪→ອູດີ, etc.)",
    `   - For Turkish (tr), Uzbek (uz), Turkmen (tk): use the standard Latin-script international names OR local Turkish/Latin orthography as appropriate for the target market.`,
    "",
    "2. AUTOMOTIVE TERMS — translate ALL labels/terminology into the target locale's native language and script:",
    "   纯电动, 插电式混合动力, 增程式, 混合动力, 燃油, 续航里程, 最大功率, 最大扭矩, 变速箱, 车身结构,",
    "   轴距, 最高车速, 官方指导价, 电池类型, 快充时间, 慢充时间, 纯电续航, 百公里加速, 电机, 发动机,",
    "   排量, 驱动方式, 前悬架, 后悬架, 长×宽×高, 级别, 品牌, 车系, 车型 — these ALL must be in the target language.",
    "",
    "3. SPEC VALUES — keep numbers, units (km/h, mm, kWh, N·m, rpm, kg, V, kW), symbols (●, ○, -), and HTML/markup exactly as-is. Translate surrounding labels only.",
    "   Example: \"最大功率 380kW\" → English: \"Max Power 380kW\", Russian: \"Макс. мощность 380kW\", Arabic: \"الطاقة القصوى 380kW\"",
    "",
    "4. Return ONLY a valid JSON object with identical keys and translated values. No markdown, no explanation.",
    "",
    "EXAMPLES by locale:",
    `English (en):    {"name": "奥迪A6L", "brandname": "奥迪", "energy_type": "纯电动"} → {"name": "Audi A6L", "brandname": "Audi", "energy_type": "BEV"}`,
    `Russian (ru):    {"name": "奥迪A6L", "brandname": "奥迪", "energy_type": "纯电动"} → {"name": "Ауди A6L", "brandname": "Ауди", "energy_type": "Электромобиль"}`,
    `Arabic (ar):     {"name": "奥迪A6L", "brandname": "奥迪", "energy_type": "纯电动"} → {"name": "أودي A6L", "brandname": "أودي", "energy_type": "كهربائية"}`,
    `Thai (th):       {"name": "比亚迪汉", "brandname": "比亚迪"} → {"name": "บีวายดี ฮั่น", "brandname": "บีวายดี"}`,
    `Persian (fa):    {"name": "长安CS75", "brandname": "长安"} → {"name": "چانگان CS75", "brandname": "چانگان"}`,
    "",
    `REMEMBER: For this request, the target locale is "${targetLocale}". Use the NATIVE script/orthography for that locale. DO NOT default everything to Latin letters.`,
  ].join("\n");

  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Translate this json:\n${JSON.stringify(data)}` },
    ],
    response_format: { type: "json_object" },
    stream: false,
  };

  // Split large payloads into chunks of 25 keys
  if (keys.length > 25) {
    let merged: Record<string, string> = {};
    for (let i = 0; i < keys.length; i += 25) {
      const chunkKeys = keys.slice(i, i + 25);
      const chunk: Record<string, string> = {};
      for (const k of chunkKeys) chunk[k] = data[k];

      const r = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, messages: [{ role: "system", content: system }, { role: "user", content: `Translate this json:\n${JSON.stringify(chunk)}` }] }),
      }, 30000);
      const raw = await r.text();
      if (!r.ok) throw new Error(`API error (${r.status}): ${raw.slice(0, 300)}`);
      const resp = JSON.parse(raw);
      const outText = resp?.choices?.[0]?.message?.content ?? null;
      if (typeof outText !== "string" || !outText.trim()) throw new Error("API returned empty content");
      const chunkResult = parseJsonObject(outText);
      merged = { ...merged, ...chunkResult };
    }
    return merged;
  }

  const r = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, 30000);
  const raw = await r.text();
  if (!r.ok) throw new Error(`API error (${r.status}): ${raw.slice(0, 300)}`);
  const resp = JSON.parse(raw);
  const outText = resp?.choices?.[0]?.message?.content ?? null;
  if (typeof outText !== "string" || !outText.trim()) throw new Error("API returned empty content");
  return parseJsonObject(outText);
}

async function callTranslateApiWithRetry(
  params: Parameters<typeof callTranslateApi>[0],
  maxRetries = 1,
): Promise<Record<string, string>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callTranslateApi(params);
    } catch (e: any) {
      if (attempt === maxRetries) throw e;
      const msg = String(e?.message || e);
      const isRetryable = msg.includes("429") || msg.includes("503") || msg.includes("502") || msg.includes("timeout") || msg.includes("aborted");
      if (!isRetryable) throw e;
      const delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${msg.slice(0, 100)}`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

function parseJsonObject(raw: string): Record<string, string> {
  const s = String(raw || "").trim();
  if (!s) throw new Error("Empty model output");
  try {
    const p = JSON.parse(s);
    if (typeof p === "object" && p !== null) return p as Record<string, string>;
  } catch { /* fall through */ }

  // Bracket-depth counting to find matching outermost { }
  let depth = 0, start = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "{") { if (depth === 0) start = i; depth++; }
    else if (s[i] === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        return JSON.parse(s.slice(start, i + 1));
      }
    }
  }

  console.error("Failed to parse JSON. Raw output (first 1000 chars):", s.slice(0, 1000));
  throw new Error("Failed to parse JSON output");
}

function unflattenToNested(flat: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split(".");
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = val;
  }
  return result;
}

async function processWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<{ success: boolean; error?: string }>,
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  const queue = [...items];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()!;
      const result = await fn(item);
      if (result.success) processed++;
      else failed++;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return { processed, failed };
}

type JobRow = {
  id: string;
  entity_type: "brand" | "series" | "model_detail" | "knowledge_base" | "knowledge_base_category";
  jm_id: string;
  source_locale: string;
  target_locales: string[];
  fields: string[];
  source_updated_at: string;
  status: "pending" | "processing" | "done" | "error";
  attempts: number;
};

async function loadEntitySource(
  supabaseClient: any,
  entityType: JobRow["entity_type"],
  jmId: string,
  fields: string[]
): Promise<{ updated_at: string; data: Record<string, string> } | null> {
  const needsRaw = fields.includes("raw");

  if (entityType === "brand") {
    const { data, error } = await supabaseClient
      .from("brands")
      .select("jm_id,name,fullname,updated_at")
      .eq("jm_id", jmId)
      .maybeSingle();
    if (error || !data) return null;
    const result: Record<string, string> = {};
    result["@updated_at"] = String(data.updated_at);
    if (fields.includes("name")) result["name"] = data.name ?? "";
    if (fields.includes("fullname") && data.fullname) result["fullname"] = data.fullname;
    return { updated_at: String(data.updated_at), data: result };
  }

  if (entityType === "series") {
    const { data, error } = await supabaseClient
      .from("series")
      .select("jm_id,name,fullname,subcompany_name,updated_at")
      .eq("jm_id", jmId)
      .maybeSingle();
    if (error || !data) return null;
    const result: Record<string, string> = {};
    result["@updated_at"] = String(data.updated_at);
    if (fields.includes("name")) result["name"] = data.name ?? "";
    if (fields.includes("fullname") && data.fullname) result["fullname"] = data.fullname;
    if (fields.includes("subcompany_name") && data.subcompany_name) result["subcompany_name"] = data.subcompany_name;
    return { updated_at: String(data.updated_at), data: result };
  }

  if (entityType === "knowledge_base") {
    const { data, error } = await supabaseClient
      .from("knowledge_base")
      .select("id,title,content,updated_at")
      .eq("id", jmId)
      .maybeSingle();
    if (error || !data) return null;
    const result: Record<string, string> = {};
    result["@updated_at"] = String(data.updated_at);
    if (fields.includes("title")) result["title"] = data.title ?? "";
    if (fields.includes("content") && data.content) result["content"] = data.content;
    return { updated_at: String(data.updated_at), data: result };
  }

  if (entityType === "knowledge_base_category") {
    const { data, error } = await supabaseClient
      .from("knowledge_base_categories")
      .select("id,name,updated_at")
      .eq("id", jmId)
      .maybeSingle();
    if (error || !data) return null;
    const result: Record<string, string> = {};
    result["@updated_at"] = String(data.updated_at);
    if (fields.includes("name")) result["name"] = data.name ?? "";
    return { updated_at: String(data.updated_at), data: result };
  }

  // model_detail
  const selectCols = ["jm_id", "name", "brandname", "parentname", "groupname", "updated_at"];
  if (needsRaw) selectCols.push("raw");
  const { data, error } = await supabaseClient
    .from("model_details")
    .select(selectCols.join(","))
    .eq("jm_id", jmId)
    .maybeSingle();
  if (error || !data) return null;

  const result: Record<string, string> = {};
  result["@updated_at"] = String(data.updated_at);
  if (fields.includes("name")) result["name"] = data.name ?? "";
  if (fields.includes("brandname") && data.brandname) result["brandname"] = data.brandname;
  if (fields.includes("parentname") && data.parentname) result["parentname"] = data.parentname;
  if (fields.includes("groupname") && data.groupname) result["groupname"] = data.groupname;

  // Extract translatable values from raw JSONB (hard cap to avoid OOM)
  if (needsRaw && (data as any).raw) {
    const rawVals = extractTranslatableValues((data as any).raw, "raw");
    const limited: Record<string, string> = {};
    let rawCount = 0;
    for (const [k, v] of Object.entries(rawVals)) {
      if (rawCount >= 40) break;
      limited[k] = v;
      rawCount++;
    }
    Object.assign(result, limited);
  }

  return { updated_at: String(data.updated_at), data: result };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Missing Supabase env vars" }, 500);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || "status");

    // ─── STATUS ───────────────────────────────────────────
    if (action === "status") {
      const { data: cfgRow } = await supabaseClient.from("site_config").select("value").eq("key", "db_translation_ai").maybeSingle();
      const cfg = (cfgRow as any)?.value ?? null;

      const { count: pending } = await supabaseClient
        .from("entity_translation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const { count: errorCount } = await supabaseClient
        .from("entity_translation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "error");
      const { count: doneCount } = await supabaseClient
        .from("entity_translation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "done");

      // Count existing translations
      const { count: trCount } = await supabaseClient
        .from("entity_translations")
        .select("id", { count: "exact", head: true });

      return jsonResponse({
        ok: true,
        config: cfg,
        pending: pending ?? 0,
        error: errorCount ?? 0,
        done: doneCount ?? 0,
        translations: trCount ?? 0,
      });
    }

    // ─── REQUEUE ──────────────────────────────────────────
    if (action === "requeue") {
      const entityType = String(payload?.entityType || "");
      const jmId = String(payload?.jmId ?? "");
      if (!entityType || !jmId) return jsonResponse({ error: "Missing entityType/jmId" }, 400);

      await supabaseClient
        .from("entity_translation_jobs")
        .update({ status: "pending", error: null })
        .eq("entity_type", entityType)
        .eq("jm_id", jmId);
      return jsonResponse({ ok: true });
    }

    // ─── CREATE JOBS for all untranslated entities ────────
    if (action === "create_all_jobs") {
      const config = await loadConfig(supabaseClient);
      const targetLocales = config.target_locales;

      const batchRows: any[] = [];
      let created = 0;

      // Brands
      const { data: brands } = await supabaseClient.from("brands").select("jm_id,name,fullname,updated_at").eq("activity_status", 0);
      for (const b of brands ?? []) {
        batchRows.push({
          entity_type: "brand",
          jm_id: String(b.jm_id),
          source_locale: "zh-CN",
          target_locales: targetLocales,
          fields: ["name", "fullname"].filter(f => (b as any)[f] != null),
          source_updated_at: (b as any).updated_at,
          status: "pending",
        });
      }

      // Series
      const { data: series } = await supabaseClient.from("series").select("jm_id,name,fullname,subcompany_name,updated_at").eq("activity_status", 0);
      for (const s of series ?? []) {
        batchRows.push({
          entity_type: "series",
          jm_id: String(s.jm_id),
          source_locale: "zh-CN",
          target_locales: targetLocales,
          fields: ["name", "fullname", "subcompany_name"].filter(f => (s as any)[f] != null),
          source_updated_at: (s as any).updated_at,
          status: "pending",
        });
      }

      // Model details (no raw — raw translation is too heavy, handled separately)
      const { data: details } = await supabaseClient.from("model_details").select("jm_id,name,brandname,parentname,groupname,updated_at").eq("activity_status", 0);
      for (const d of details ?? []) {
        const fields = ["name", "brandname", "parentname", "groupname"];
        batchRows.push({
          entity_type: "model_detail",
          jm_id: d.jm_id,
          source_locale: "zh-CN",
          target_locales: targetLocales,
          fields,
          source_updated_at: (d as any).updated_at,
          status: "pending",
        });
      }

      // Knowledge base
      const { data: kbRows } = await supabaseClient.from("knowledge_base").select("id,title,content,updated_at").eq("is_active", true);
      for (const kb of kbRows ?? []) {
        const fields = ["title"];
        if ((kb as any).content != null) fields.push("content");
        batchRows.push({
          entity_type: "knowledge_base",
          jm_id: (kb as any).id as string,
          source_locale: "zh-CN",
          target_locales: targetLocales,
          fields,
          source_updated_at: (kb as any).updated_at,
          status: "pending",
        });
      }

      // Knowledge base categories
      const { data: catRows } = await supabaseClient.from("knowledge_base_categories").select("id,name,updated_at");
      for (const cat of catRows ?? []) {
        batchRows.push({
          entity_type: "knowledge_base_category",
          jm_id: (cat as any).id as string,
          source_locale: "zh-CN",
          target_locales: targetLocales,
          fields: ["name"],
          source_updated_at: (cat as any).updated_at,
          status: "pending",
        });
      }

      // Batch upsert in chunks of 500
      for (let i = 0; i < batchRows.length; i += 500) {
        const chunk = batchRows.slice(i, i + 500);
        const { error: insErr } = await supabaseClient
          .from("entity_translation_jobs")
          .upsert(chunk, { onConflict: "entity_type,jm_id,source_updated_at", ignoreDuplicates: true });
        if (!insErr) created += chunk.length;
      }

      return jsonResponse({ ok: true, created });
    }

    // ─── TRANSLATE SINGLE ──────────────────────────────────
    if (action === "translate_single") {
      const entityType = String(payload?.entityType || "");
      const jmId = String(payload?.jmId ?? "");
      if (!entityType || !jmId) return jsonResponse({ error: "Missing entityType/jmId" }, 400);

      const config = await loadConfig(supabaseClient);
      if (!config.enabled) return jsonResponse({ error: "DB translation is disabled" }, 400);
      if (!config.apiKey) return jsonResponse({ error: "Missing API key" }, 400);

      // Determine fields based on entity type
      let fields: string[] = [];
      const { data: entity } = await (async () => {
        if (entityType === "brand") {
          const { data } = await supabaseClient.from("brands").select("jm_id,name,fullname,updated_at").eq("jm_id", jmId).maybeSingle();
          return { data };
        }
        if (entityType === "series") {
          const { data } = await supabaseClient.from("series").select("jm_id,name,fullname,subcompany_name,updated_at").eq("jm_id", jmId).maybeSingle();
          return { data };
        }
        if (entityType === "model_detail") {
          const { data } = await supabaseClient.from("model_details").select("jm_id,name,brandname,parentname,groupname,updated_at").eq("jm_id", jmId).maybeSingle();
          return { data };
        }
        return { data: null };
      })();

      if (!entity) return jsonResponse({ error: "Entity not found" }, 404);

      // Upsert job
      if (entityType === "brand") {
        fields = ["name"];
        if ((entity as any).fullname) fields.push("fullname");
      } else if (entityType === "series") {
        fields = ["name"];
        if ((entity as any).fullname) fields.push("fullname");
        if ((entity as any).subcompany_name) fields.push("subcompany_name");
      } else if (entityType === "model_detail") {
        fields = ["name"];
        if ((entity as any).brandname) fields.push("brandname");
        if ((entity as any).parentname) fields.push("parentname");
        if ((entity as any).groupname) fields.push("groupname");
      }

      await supabaseClient
        .from("entity_translation_jobs")
        .upsert({
          entity_type: entityType,
          jm_id: jmId,
          source_locale: "zh-CN",
          target_locales: config.target_locales,
          fields,
          source_updated_at: (entity as any).updated_at,
          status: "pending",
        }, { onConflict: "entity_type,jm_id", ignoreDuplicates: false });

      // Immediately translate by treating it like a run filtered to this entity
      const src = await loadEntitySource(supabaseClient, entityType as JobRow["entity_type"], jmId, fields);
      if (!src) return jsonResponse({ error: "Source entity not found" }, 404);

      const { "@updated_at": _ts, ...toTranslate } = src.data;
      const translatableKeys = Object.keys(toTranslate);
      if (translatableKeys.length === 0) return jsonResponse({ ok: true, message: "No translatable content" });

      const details: any[] = [];
      const entityName = src.data["name"] || src.data["title"] || "";

      for (const locale of config.target_locales) {
        if (locale === "zh-CN") continue;
        try {
          console.log(`Translating single ${entityType}#${jmId} to ${locale}...`);
          const translated = await callTranslateApiWithRetry({
            endpoint: config.endpoint,
            apiKey: config.apiKey,
            model: config.model,
            sourceLocale: "zh-CN",
            targetLocale: locale,
            data: toTranslate,
          });

          const storeData: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(translated)) {
            if (!k.startsWith("raw.")) storeData[k] = v;
          }

          for (const [k, v] of Object.entries(storeData)) {
            if (v !== toTranslate[k]) {
              details.push({ entityType, entityName, locale, key: k, source: (toTranslate[k] ?? "").substring(0, 80), translated: (String(v) ?? "").substring(0, 80) });
            }
          }

          await supabaseClient
            .from("entity_translations")
            .upsert({
              entity_type: entityType,
              jm_id: jmId,
              locale,
              data: storeData,
              source_data: src.data,
              source_updated_at: src.updated_at,
              model: config.model,
            }, { onConflict: "entity_type,jm_id,locale" });
        } catch (e: any) {
          console.error(`Failed translating single ${entityType}#${jmId} to ${locale}:`, e.message);
          details.push({ entityType, entityName, locale, error: String(e?.message || e).slice(0, 200) });
        }
      }

      // Mark job as done
      await supabaseClient
        .from("entity_translation_jobs")
        .update({ status: "done" })
        .eq("entity_type", entityType)
        .eq("jm_id", jmId);

      return jsonResponse({ ok: true, details });
    }

    // ─── RUN ──────────────────────────────────────────────
    if (action !== "run") return jsonResponse({ error: "Unknown action" }, 400);

    const config = await loadConfig(supabaseClient);
    if (!config.enabled) return jsonResponse({ error: "DB translation is disabled in site_config" }, 400);
    if (!config.apiKey) return jsonResponse({ error: "Missing API key in admin_secrets" }, 400);

    const limit = Math.max(1, Math.min(10, Number(payload?.limit || 3)));
    const filterEntityType = payload?.entityType ? String(payload.entityType) : null;
    const filterJmId = payload?.jmId ? String(payload.jmId) : null;

    let q = supabaseClient
      .from("entity_translation_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (filterEntityType) q = q.eq("entity_type", filterEntityType);

    const { data: jobs, error: jobsErr } = await q;
    if (jobsErr) return jsonResponse({ error: String(jobsErr.message) }, 500);
    if (!jobs?.length) return jsonResponse({ ok: true, processed: 0, message: "No pending jobs" });

    const { processed, failed } = await processWithConcurrency(
      jobs as JobRow[],
      1,
      async (job: JobRow) => {
        try {
          await supabaseClient
            .from("entity_translation_jobs")
            .update({ status: "processing", attempts: job.attempts + 1 })
            .eq("id", job.id);

          const src = await loadEntitySource(supabaseClient, job.entity_type, job.jm_id, job.fields);
          if (!src) {
            await supabaseClient.from("entity_translation_jobs").update({ status: "done" }).eq("id", job.id);
            return { success: true };
          }

          const { "@updated_at": _ts, ...toTranslate } = src.data;
          const translatableKeys = Object.keys(toTranslate);
          if (translatableKeys.length === 0) {
            await supabaseClient.from("entity_translation_jobs").update({ status: "done" }).eq("id", job.id);
            return { success: true };
          }

          // Batch-fetch all existing translations for this entity (1 query instead of N)
          let targetsToProcess = (job.target_locales || []).filter((l: string) => l !== "zh-CN");

          // Per-run locale cap: process at most 6 locales per invocation to stay under timeout
          const MAX_LOCALES_PER_RUN = 6;
          const totalTargetLocaleCount = targetsToProcess.length;
          const needsMoreRuns = targetsToProcess.length > MAX_LOCALES_PER_RUN;
          if (needsMoreRuns) {
            targetsToProcess = targetsToProcess.slice(0, MAX_LOCALES_PER_RUN);
          }
          const { data: existingRows } = await supabaseClient
            .from("entity_translations")
            .select("locale, source_updated_at, data")
            .eq("entity_type", job.entity_type)
            .eq("jm_id", job.jm_id)
            .in("locale", targetsToProcess);

          const existingMap = new Map<string, { sourceUpdatedAt: string; data: Record<string, unknown> }>();
          for (const row of (existingRows ?? [])) {
            existingMap.set((row as any).locale, {
              sourceUpdatedAt: (row as any).source_updated_at ?? "",
              data: (row as any).data ?? {},
            });
          }

          // Collect translation details for progress display
          const entityName = src.data["name"] || src.data["title"] || "";
          const allJobDetails: any[] = [];

          // Process locales with concurrency limit (max 3 at a time per job)
          const LOCALE_CONCURRENCY = 3;
          const localeChunks: string[][] = [];
          for (let ci = 0; ci < targetsToProcess.length; ci += LOCALE_CONCURRENCY) {
            localeChunks.push(targetsToProcess.slice(ci, ci + LOCALE_CONCURRENCY));
          }
          let localeErrors = 0;

          for (const chunk of localeChunks) {
            await Promise.all(
              chunk.map(async (locale) => {
              try {
                const existing = existingMap.get(locale);

                // Skip if source hasn't changed since last translation
                if (existing && existing.sourceUpdatedAt === src.updated_at) {
                  return;
                }

                // Determine which fields actually need translating (incremental)
                const jobFields = job.fields || [];
                let fieldsToTranslate: Record<string, string>;
                if (existing && jobFields.length > 0 && jobFields.length < translatableKeys.length) {
                  // Only translate fields that changed
                  fieldsToTranslate = {};
                  for (const f of jobFields) {
                    if (f === "raw" && toTranslate["raw"] !== undefined) {
                      // For raw, include all raw.* keys (they're extracted from JSONB)
                      for (const [k, v] of Object.entries(toTranslate)) {
                        if (k === "raw" || k.startsWith("raw.")) fieldsToTranslate[k] = v;
                      }
                    } else if (toTranslate[f] !== undefined) {
                      fieldsToTranslate[f] = toTranslate[f];
                    }
                  }
                  if (Object.keys(fieldsToTranslate).length === 0) return;
                } else {
                  fieldsToTranslate = toTranslate;
                }

                console.log(`Translating ${job.entity_type}#${job.jm_id} to ${locale} (${Object.keys(fieldsToTranslate).length} keys)...`);

                const translated = await callTranslateApiWithRetry({
                  endpoint: config.endpoint,
                  apiKey: config.apiKey,
                  model: config.model,
                  sourceLocale: "zh-CN",
                  targetLocale: locale,
                  data: fieldsToTranslate,
                });

                const topLevel: Record<string, string> = {};
                const rawFlat: Record<string, string> = {};
                for (const [k, v] of Object.entries(translated)) {
                  if (k.startsWith("raw.")) {
                    rawFlat[k.slice(4)] = v;
                  } else {
                    topLevel[k] = v;
                  }
                }

                // Collect field translation details
                for (const [k, v] of Object.entries(topLevel)) {
                  if (v !== fieldsToTranslate[k]) {
                    allJobDetails.push({ entityType: job.entity_type, entityName, locale, key: k, source: (fieldsToTranslate[k] ?? "").substring(0, 80), translated: (v ?? "").substring(0, 80) });
                  }
                }

                // Merge with existing translation data if doing partial update
                let storeData: Record<string, unknown>;
                if (existing && jobFields.length > 0 && jobFields.length < translatableKeys.length) {
                  storeData = { ...existing.data as Record<string, unknown> };
                  Object.assign(storeData, topLevel);
                  if (Object.keys(rawFlat).length > 0) {
                    const existingRaw = (storeData["raw"] as Record<string, unknown>) ?? {};
                    storeData["raw"] = { ...existingRaw, ...unflattenToNested(rawFlat) };
                  }
                } else {
                  storeData = { ...topLevel };
                  if (Object.keys(rawFlat).length > 0) {
                    storeData["raw"] = unflattenToNested(rawFlat);
                  }
                }

                await supabaseClient
                  .from("entity_translations")
                  .upsert({
                    entity_type: job.entity_type,
                    jm_id: job.jm_id,
                    locale,
                    data: storeData,
                    source_data: src.data,
                    source_updated_at: src.updated_at,
                    model: config.model,
                  }, { onConflict: "entity_type,jm_id,locale" });
              } catch (localeErr: any) {
                localeErrors++;
                console.error(`Failed translating ${job.entity_type}#${job.jm_id} to ${locale}:`, localeErr.message);
                await supabaseClient
                  .from("entity_translation_jobs")
                  .update({ error: `locale ${locale}: ${String(localeErr?.message || localeErr).slice(0, 200)}` })
                  .eq("id", job.id);
              }
            })
          );
          }

          // Check if all locales for this job are OK
          const { count: trCnt } = await supabaseClient
            .from("entity_translations")
            .select("id", { count: "exact", head: true })
            .eq("entity_type", job.entity_type)
            .eq("jm_id", job.jm_id);

          (job as any)._details = allJobDetails;
          const hasTranslations = (trCnt ?? 0) > 0;
          const isComplete = hasTranslations && (trCnt ?? 0) >= totalTargetLocaleCount && localeErrors === 0;

          await supabaseClient
            .from("entity_translation_jobs")
            .update({ status: isComplete ? "done" : "pending" })
            .eq("id", job.id);

          return { success: true };
        } catch (jobErr: any) {
          console.error(`Job ${job.entity_type}#${job.jm_id} failed:`, jobErr.message);
          await supabaseClient
            .from("entity_translation_jobs")
            .update({ status: "error", error: String(jobErr?.message || jobErr).slice(0, 500) })
            .eq("id", job.id);
          return { success: false, error: String(jobErr?.message || jobErr) };
        }
      }
    );

    const allDetails = (jobs as any[]).flatMap((j: any) => j._details ?? []);
    return jsonResponse({ ok: true, processed, failed, total: jobs.length, details: allDetails });
  } catch (e: any) {
    return jsonResponse({ error: String(e?.message || e) }, 500);
  }
});

async function loadConfig(supabaseClient: any) {
  const [{ data: cfgRow }, { data: secretRow }] = await Promise.all([
    supabaseClient.from("site_config").select("value").eq("key", "db_translation_ai").maybeSingle(),
    supabaseClient.from("admin_secrets").select("value").eq("key", "deepseek_api_key").maybeSingle(),
  ]);
  const cfg = (cfgRow as any)?.value ?? {};
  return {
    enabled: Boolean(cfg?.enabled),
    source_locale: String(cfg?.source_locale || "zh-CN"),
    target_locales: Array.isArray(cfg?.target_locales) ? cfg.target_locales : ["en"],
    model: String(cfg?.model || "deepseek-v4-flash"),
    endpoint: String(cfg?.endpoint || "https://api.deepseek.com/chat/completions"),
    apiKey: String((secretRow as any)?.value || "").trim(),
  };
}
