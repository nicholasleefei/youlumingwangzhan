// Edge Function: db-translate
// Robust batching, retry with backoff, per-locale bulk translation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_LOCALES = ["en", "ar", "ru", "th", "ur", "tr", "pt-BR"];
const VOLC_LANG: Record<string, string> = {
  "en": "en", "ar": "ar", "ru": "ru", "th": "th", "ur": "ur", "tr": "tr", "pt-BR": "pt",
};
const ENTITY_TABLE_MAP: Record<string, string> = {
  brand: "brands", series: "series", model: "models_jumdata", model_detail: "model_details",
};

function json(body: unknown, s = 200) {
  return new Response(JSON.stringify(body), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ============ Volcengine Signature V4 ============
const encoder = new TextEncoder();
async function sha256(d: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", d));
}
async function hmac(d: Uint8Array, k: Uint8Array): Promise<Uint8Array> {
  const ck = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", ck, d));
}
function hex(b: Uint8Array): string {
  return Array.from(b).map(v => v.toString(16).padStart(2, "0")).join("");
}

async function volcengineTranslate(
  ak: string, sk: string, textList: string[], sourceLang: string, targetLang: string,
  retries = 3,
): Promise<string[]> {
  const host = "open.volcengineapi.com";
  const service = "translate";
  const region = "cn-north-1";

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
      const dateStamp = amzDate.substring(0, 8);

      const query = "Action=TranslateText&Version=2020-06-01";
      const body = JSON.stringify({ SourceLanguage: sourceLang, TargetLanguage: targetLang, TextList: textList });
      const payload = encoder.encode(body);
      const sh = "content-type;host;x-date";
      const ch = `content-type:application/json\nhost:${host}\nx-date:${amzDate}\n`;

      const cr = `POST\n/\n${query}\n${ch}\n${sh}\n${hex(await sha256(payload))}`;
      const cs = `${dateStamp}/${region}/${service}/request`;
      const sts = `HMAC-SHA256\n${amzDate}\n${cs}\n${hex(await sha256(encoder.encode(cr)))}`;

      const kD = await hmac(encoder.encode(dateStamp), encoder.encode(sk));
      const kR = await hmac(encoder.encode(region), kD);
      const kS = await hmac(encoder.encode(service), kR);
      const kSign = await hmac(encoder.encode("request"), kS);

      const sig = hex(await hmac(encoder.encode(sts), kSign));
      const auth = `HMAC-SHA256 Credential=${ak}/${cs}, SignedHeaders=${sh}, Signature=${sig}`;

      const resp = await fetch(`https://${host}/?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Host": host, "X-Date": amzDate, "Authorization": auth },
        body,
      });

      const txt = await resp.text();

      // Rate limit / server error → retry
      if (resp.status === 429 || resp.status >= 500) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
        console.warn(`Volcengine ${resp.status} (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!resp.ok) throw new Error(`Volcengine HTTP ${resp.status}: ${txt.substring(0, 200)}`);

      const j = JSON.parse(txt);
      if (j.ResponseMetadata?.Error) {
        // Some Volcengine errors are retryable
        const code = j.ResponseMetadata.Error.Code;
        if ((code === "RequestThrottled" || code === "InternalError") && attempt < retries) {
          const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
          console.warn(`Volcengine ${code} (attempt ${attempt + 1}), retrying in ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw new Error(code + ": " + j.ResponseMetadata.Error.Message);
      }

      return (j.TranslationList || []).map((x: any) => x.Translation || "");
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
        console.warn(`Volcengine error: ${e.message} (attempt ${attempt + 1}), retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr || new Error("Translation failed after retries");
}

// ============ Helpers ============
function getFields(et: string): string[] {
  if (et === "brand") return ["name", "fullname", "initial"];
  if (et === "series") return ["name", "fullname", "subcompany_name", "brand_name", "salestate", "initial"];
  if (et === "model") return ["name", "groupname", "sizetype", "displacement", "geartype", "price", "productionstate", "salestate", "brand_name", "series_name", "yeartype", "listdate"];
  if (et === "model_detail") return ["name", "brandname", "parentname", "groupname", "environmentalstandards", "displacement", "drivemode", "sizetype", "price", "productionstate", "salestate", "seatnum", "geartype", "gearnum", "yeartype", "listdate"];
  return [];
}

function getTable(et: string, loc: string): string {
  const safeLoc = loc.toLowerCase().replace(/-/g, "_");
  if (et === "model") return `models_jumdata_${safeLoc}`;
  return `${ENTITY_TABLE_MAP[et] || et}_${safeLoc}`;
}

async function loadConfig(client: any) {
  const [{ data: cfg }, { data: ak }, { data: sk }] = await Promise.all([
    client.from("site_config").select("value").eq("key", "db_translation_ai").maybeSingle(),
    client.from("admin_secrets").select("value").eq("key", "volcengine_api_key").maybeSingle(),
    client.from("admin_secrets").select("value").eq("key", "volcengine_api_secret").maybeSingle(),
  ]);
  return {
    enabled: Boolean((cfg as any)?.value?.enabled),
    useVolcengine: Boolean((cfg as any)?.value?.use_volcengine),
    volcKey: String((ak as any)?.value || ""),
    volcSecret: String((sk as any)?.value || ""),
  };
}

// ============ Raw JSON text extraction ============
// Flatten nested raw JSON into path->text pairs for translation
function extractRawTexts(
  obj: Record<string, unknown>,
  prefix: string,
  maxLength: number,
): [string, string][] {
  const result: [string, string][] = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "string" && val.trim().length > 0 && val.trim().length <= maxLength) {
      // Skip fields that are clearly codes/IDs/numbers-only
      if (/^[0-9a-fA-F-]+$/.test(val.trim())) continue;
      if (/^#[0-9a-fA-F,|]+$/.test(val.trim())) continue; // color hex values
      result.push([path, val.trim()]);
    } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      result.push(...extractRawTexts(val as Record<string, unknown>, path, maxLength));
    }
  }
  return result;
}

// Set a nested field by dot-separated path
function setNestedField(obj: any, path: string, value: string) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

// ============ Main ============
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const client = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const body = await req.json().catch(() => ({} as any));
    const { action, locale, limit, text } = body;

    // STATUS
    if (action === "status") {
      const stats: any = {};
      for (const et of ["brand", "series", "model", "model_detail"]) {
        const tbl = ENTITY_TABLE_MAP[et];
        const { count: total } = await client.from(tbl).select("jm_id", { count: "exact", head: true }).eq("activity_status", 0);
        stats[et] = { total: total ?? 0, locales: {} };
        for (const loc of TARGET_LOCALES) {
          const { count: tr } = await client.from(getTable(et, loc)).select("jm_id", { count: "exact", head: true });
          stats[et].locales[loc] = { translated: tr ?? 0, missing: (total ?? 0) - (tr ?? 0) };
        }
      }
      const { count: pc } = await client.from("translation_jobs").select("id", { count: "exact", head: true }).eq("status", "pending");
      return json({ ok: true, targetLocales: TARGET_LOCALES, stats, pendingJobs: pc ?? 0 });
    }

    // TEST
    if (action === "test_translate") {
      const config = await loadConfig(client);
      if (!config.volcKey) return json({ error: "未配置火山引擎密钥" }, 400);
      const t = String(text || "BYD");
      const l = String(locale || "en");
      const vl = VOLC_LANG[l] || l;
      const result = await volcengineTranslate(config.volcKey, config.volcSecret, [t], "zh", vl);
      return json({ ok: true, source: t, target: l, translation: result[0] || "" });
    }

    // PROCESS QUEUE (keep existing)
    if (action === "process_queue") {
      const config = await loadConfig(client);
      if (!config.enabled) return json({ error: "Disabled" }, 400);
      if (!config.volcKey) return json({ error: "No volcengine key" }, 400);

      const batch = Math.max(1, Math.min(30, Number(limit || 20)));
      const { data: jobs } = await client.from("translation_jobs")
        .select("*").eq("status", "pending").order("created_at").limit(batch);
      if (!jobs?.length) return json({ ok: true, processed: 0 });

      let processed = 0;
      const errors: string[] = [];
      const details: any[] = [];

      for (const job of jobs) {
        const et = job.entity_type, jmId = job.jm_id, loc = job.target_locale;

        await client.from("translation_jobs")
          .update({ status: "processing" })
          .eq("entity_type", et).eq("jm_id", jmId).eq("target_locale", loc).eq("status", "pending");

        try {
          const tableName = ENTITY_TABLE_MAP[et];
          const { data: fullRow, error: rowErr } = await client.from(tableName).select("*").eq("jm_id", Number(jmId)).maybeSingle();
          if (rowErr || !fullRow) {
            await client.from("translation_jobs").update({ status: "done", completed_at: new Date().toISOString() })
              .eq("entity_type", et).eq("jm_id", jmId).eq("target_locale", loc);
            continue;
          }

          const textFields = getFields(et);
          const texts: string[] = [];
          const fieldNames: string[] = [];
          for (const f of textFields) {
            const val = fullRow[f];
            if (val !== null && val !== undefined && String(val).trim()) {
              texts.push(String(val));
              fieldNames.push(f);
            }
          }

          if (texts.length === 0) {
            await client.from("translation_jobs").update({ status: "done", completed_at: new Date().toISOString() })
              .eq("entity_type", et).eq("jm_id", jmId).eq("target_locale", loc);
            continue;
          }

          const volcLocale = VOLC_LANG[loc] || loc;
          const translated = await volcengineTranslate(config.volcKey, config.volcSecret, texts, "zh", volcLocale);

          const up: any = { ...fullRow };
          fieldNames.forEach((k, i) => { if (translated[i]) up[k] = translated[i]; });

          const { error: wrErr } = await client.from(getTable(et, loc)).upsert(up, { onConflict: "jm_id" });
          if (wrErr) errors.push(`${et}_${jmId}: ${wrErr.message}`);

          await client.from("translation_jobs")
            .update({ status: "done", completed_at: new Date().toISOString() })
            .eq("entity_type", et).eq("jm_id", jmId).eq("target_locale", loc);
          processed++;
        } catch (e: any) {
          errors.push(`${et}_${jmId}: ${e.message}`);
          await client.from("translation_jobs")
            .update({ status: "error", last_error: e.message })
            .eq("entity_type", et).eq("jm_id", jmId).eq("target_locale", loc);
        }
      }

      const { count: rem } = await client.from("translation_jobs").select("id", { count: "exact", head: true }).eq("status", "pending");
      return json({ ok: true, processed, remaining: rem ?? 0, errors: errors.slice(0, 10) });
    }

    // TRANSLATE ENTITIES — one locale per call, batch-bulk translated
    // Call with: { action, entity_type, target_locale (single), jm_ids? }
    if (action === "translate_entities") {
      const config = await loadConfig(client);
      if (!config.enabled) return json({ error: "翻译功能未启用" }, 400);
      if (!config.volcKey) return json({ error: "未配置火山引擎密钥，请先在翻译管理页面保存API密钥" }, 400);

      const entityType = String(body.entity_type || "");
      if (!["brand", "series", "model", "model_detail"].includes(entityType)) {
        return json({ error: `无效实体类型: ${entityType}` }, 400);
      }

      // Support single locale for faster per-locale calls
      const targetLocale = String(body.target_locale || body.target_locales?.[0] || "");
      if (!targetLocale || !TARGET_LOCALES.includes(targetLocale)) {
        return json({ error: `无效目标语言: ${targetLocale}` }, 400);
      }
      const volcLocale = VOLC_LANG[targetLocale] || targetLocale;

      const tableName = ENTITY_TABLE_MAP[entityType];
      const textFields = getFields(entityType);

      // Fetch source entities
      let sourceRows: any[] = [];
      if (Array.isArray(body.jm_ids) && body.jm_ids.length > 0) {
        const ids = body.jm_ids.map(Number).filter((n: number) => !isNaN(n));
        if (ids.length === 0) return json({ error: "没有有效的 jm_ids" }, 400);
        const { data } = await client.from(tableName).select("*").in("jm_id", ids).eq("activity_status", 0);
        sourceRows = data || [];
      } else {
        let allRows: any[] = [];
        let from = 0;
        const pageSize = 500;
        while (true) {
          const { data } = await client.from(tableName)
            .select("*").eq("activity_status", 0).order("jm_id")
            .range(from, from + pageSize - 1);
          if (!data?.length) break;
          allRows = allRows.concat(data);
          if (data.length < pageSize || allRows.length >= 5000) break;
          from += pageSize;
        }
        sourceRows = allRows;
      }

      if (sourceRows.length === 0) {
        return json({ ok: true, entity_type: entityType, target_locale: targetLocale, processed: 0, message: "没有需要翻译的实体" });
      }

      // TRUNCATE source rows early — no artificial limit, translate all
      const MAX_SOURCE_ENTITIES = body.limit_entities
        ? Math.min(Number(body.limit_entities), 10000)
        : 10000;
      if (sourceRows.length > MAX_SOURCE_ENTITIES) {
        sourceRows = sourceRows.slice(0, MAX_SOURCE_ENTITIES);
      }

      // Build items with text fields
      // IMPORTANT: Check which entities already have translations for this locale
      const transTable = getTable(entityType, targetLocale);
      const { data: existingTrans } = await client.from(transTable).select("jm_id");
      const existingIds = new Set((existingTrans || []).map((r: any) => Number(r.jm_id)));

      const items: { row: any; jmId: string; fields: [string, string][] }[] = [];
      let skippedCount = 0;
      for (const row of sourceRows) {
        const jmId = Number(row.jm_id);
        if (existingIds.has(jmId)) { skippedCount++; continue; }
        const fields: [string, string][] = [];
        for (const f of textFields) {
          const val = row[f];
          if (val !== null && val !== undefined && String(val).trim()) {
            fields.push([f, String(val)]);
          }
        }
        // Raw JSON extraction for model_detail
        if (entityType === "model_detail" && row.raw) {
          let rawObj: Record<string, unknown> | null = null;
          if (typeof row.raw === "object" && row.raw !== null && !Array.isArray(row.raw)) {
            rawObj = row.raw as Record<string, unknown>;
          } else if (typeof row.raw === "string") {
            try { rawObj = JSON.parse(row.raw); } catch { /* ignore */ }
          }
          if (rawObj) {
            const flatTexts = extractRawTexts(rawObj, "", 200);
            // Cap raw texts per entity to avoid oversized API calls
            const capped = flatTexts.slice(0, 30);
            for (const [path, val] of capped) fields.push([path, val]);
          }
        }
        if (fields.length > 0) items.push({ row, jmId: String(jmId), fields });
      }

      const firstUnskipped = items.length > 0
        ? { jm_id: items[0].jmId, fieldsCount: items[0].fields.length, firstFields: items[0].fields.slice(0, 5).map(function(kv: [string,string]) { return kv[0]; }) }
        : (function() {
            const r = sourceRows.find(function(sr: any) { return !existingIds.has(Number(sr.jm_id)); });
            if (r) {
              const fieldDump = textFields.map(function(f: string) {
                const v = r[f];
                return f + "=" + (v !== null && v !== undefined ? String(v).substring(0, 20) : "NULL");
              }).join(";");
              return { jm_id: r.jm_id, reason: "no fields extracted", textFieldValues: fieldDump };
            }
            return { reason: "no unskipped entities" };
          })();

      if (items.length === 0) {
        return json({
          ok: true,
          entity_type: entityType,
          target_locale: targetLocale,
          total_entities: sourceRows.length,
          processed: 0,
          skipped: skippedCount,
          message: `所有 ${sourceRows.length} 个实体已有翻译，跳过 ${skippedCount} 个`,
        });
      }

      // Adaptive batch sizing: fewer entities per call for heavy-field types
      const avgFieldsPerEntity = items.reduce((s, it) => s + it.fields.length, 0) / Math.max(1, items.length);
      // Volcengine limit: ~50 texts per call for speed, max ~150
      const MAX_TEXTS = Math.min(100, Math.max(50, avgFieldsPerEntity + 5));
      const MAX_ENTITIES_PER_BATCH = Math.max(1, Math.floor(MAX_TEXTS / Math.max(1, avgFieldsPerEntity)));

      // For large datasets (>300 entities), do the work in chunks to fit within
      // Supabase's 150s edge function timeout. Each chunk is a separate Volcengine call.
      // The client will call this function multiple times if needed.

      let totalProcessed = 0;
      const allErrors: string[] = [];
      const sampleDetails: any[] = []; // only keep first few for feedback

      let bi = 0;
      while (bi < items.length) {
        const batch: typeof items = [];
        let tc = 0;
        while (bi < items.length && batch.length < MAX_ENTITIES_PER_BATCH && tc + items[bi].fields.length <= MAX_TEXTS) {
          batch.push(items[bi]);
          tc += items[bi].fields.length;
          bi++;
        }
        if (batch.length === 0) { bi++; continue; }

        const allTexts: string[] = [];
        for (const it of batch) {
          for (const [, v] of it.fields) allTexts.push(v);
        }

        try {
          const translated = await volcengineTranslate(config.volcKey, config.volcSecret, allTexts, "zh", volcLocale);

          let ti = 0;
          for (const it of batch) {
            const up: any = { ...it.row };
            let hasChanges = false;

            for (const [fieldName, sourceText] of it.fields) {
              const tr = translated[ti];
              ti++;
              if (tr) {
                // Raw JSON fields always go under 'raw' in the upsert object
                if (entityType === "model_detail" && !getFields(entityType).includes(fieldName)) {
                  setNestedField(up, "raw." + fieldName, tr);
                } else {
                  up[fieldName] = tr;
                }
                hasChanges = true;
              }
            }

            // Keep sample details small
            if (sampleDetails.length < 5 && hasChanges) {
              // Fetch the translated fields correctly — they were in order of iteration
              const fieldOffset = ti - it.fields.length;
              const sampFields = it.fields.slice(0, 3).map(([fn, src], j) => ({
                field: fn, source: src.substring(0, 40), translated: translated[fieldOffset + j]?.substring(0, 40) || "",
              }));
              sampleDetails.push({ entity_type: entityType, jm_id: it.jmId, locale: targetLocale, fields: sampFields });
            }

            if (hasChanges) {
              const { error: wrErr } = await client.from(getTable(entityType, targetLocale)).upsert(up, { onConflict: "jm_id" });
              if (wrErr) allErrors.push(`${targetLocale}:${it.jmId}: ${wrErr.message}`);
            }
            totalProcessed++;
          }
        } catch (e: any) {
          allErrors.push(`batch ${bi}: ${e.message}`);
          totalProcessed += batch.length;
        }
      }

      return json({
        ok: true,
        entity_type: entityType,
        target_locale: targetLocale,
        total_entities: sourceRows.length,
        processed: totalProcessed,
        skipped: skippedCount,
        itemsCount: items.length,
        debug: firstUnskipped,
        details: sampleDetails,
        errors: allErrors.slice(0, 10),
      });
    }

    // MANUAL SYNC
    if (action === "manual_sync") {
      const { error } = await client.rpc("sync_translation_changes");
      if (error) return json({ error: error.message }, 500);
      const { count: pc } = await client.from("translation_jobs").select("id", { count: "exact", head: true }).eq("status", "pending");
      return json({ ok: true, pendingJobs: pc ?? 0 });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e.message || "Internal server error" }, 500);
  }
});
