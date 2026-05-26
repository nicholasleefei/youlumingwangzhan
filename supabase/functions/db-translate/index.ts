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

function extractOutputText(resp: any): string | null {
  if (!resp || typeof resp !== "object") return null;
  if (typeof (resp as any).output_text === "string") return (resp as any).output_text;
  const output = (resp as any).output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    const content = (item as any)?.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      for (const c of content) {
        if (typeof c?.text === "string") return c.text;
        if (typeof c?.content === "string") return c.content;
      }
    }
    const summary = (item as any)?.summary;
    if (Array.isArray(summary)) {
      for (const s of summary) {
        if (typeof s?.text === "string") return s.text;
      }
    }
  }
  return null;
}

function coerceJsonObject(raw: string): any {
  const s = String(raw || "").trim();
  if (!s) throw new Error("Empty model output");
  try {
    return JSON.parse(s);
  } catch {
  }
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = s.slice(start, end + 1);
    return JSON.parse(slice);
  }
  throw new Error("Failed to parse JSON output");
}

async function callArkTranslate(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  sourceLocale: string;
  targetLocale: string;
  data: Record<string, unknown>;
}) {
  const { endpoint, apiKey, model, sourceLocale, targetLocale, data } = params;

  const system = [
    `You are a professional translator.`,
    `Translate JSON values from ${sourceLocale} to ${targetLocale}.`,
    `Keep the JSON keys unchanged.`,
    `Return a JSON object only.`,
    `If a value is null/empty, return the same null/empty value.`,
    `Do not add extra keys.`,
  ].join(" ");

  const body = {
    model,
    thinking: { type: "disabled" },
    text: { format: { type: "json_object" } },
    input: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(data) },
    ],
  };

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await r.text();
  if (!r.ok) {
    throw new Error(`Ark API error (${r.status}): ${raw.slice(0, 500)}`);
  }

  const resp = JSON.parse(raw);
  const outText = extractOutputText(resp);
  if (!outText) {
    throw new Error("Ark API returned no output text");
  }
  return coerceJsonObject(outText);
}

type JobRow = {
  id: string;
  entity_type: "brand" | "series" | "model_detail";
  jm_id: number;
  source_locale: string;
  target_locales: string[];
  fields: string[];
  source_updated_at: string;
  status: "pending" | "processing" | "done" | "error";
  attempts: number;
};

async function loadEntitySource(
  service: any,
  entityType: JobRow["entity_type"],
  jmId: number
): Promise<{ updated_at: string; data: Record<string, unknown> } | null> {
  if (entityType === "brand") {
    const { data, error } = await service
      .from("brands")
      .select("jm_id,name,fullname,updated_at")
      .eq("jm_id", jmId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      updated_at: String((data as any).updated_at),
      data: { name: (data as any).name ?? null, fullname: (data as any).fullname ?? null },
    };
  }
  if (entityType === "series") {
    const { data, error } = await service
      .from("series")
      .select("jm_id,name,fullname,subcompany_name,updated_at")
      .eq("jm_id", jmId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      updated_at: String((data as any).updated_at),
      data: {
        name: (data as any).name ?? null,
        fullname: (data as any).fullname ?? null,
        subcompany_name: (data as any).subcompany_name ?? null,
      },
    };
  }
  const { data, error } = await service
    .from("model_details")
    .select("jm_id,name,brandname,parentname,groupname,updated_at")
    .eq("jm_id", jmId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    updated_at: String((data as any).updated_at),
    data: {
      name: (data as any).name ?? null,
      brandname: (data as any).brandname ?? null,
      parentname: (data as any).parentname ?? null,
      groupname: (data as any).groupname ?? null,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Missing Supabase env vars" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const service = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: userData, error: userErr } = await client.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { data: adminRow, error: adminErr } = await client
      .from("admin_users")
      .select("id,is_approved,is_super_admin")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (adminErr) return jsonResponse({ error: String(adminErr.message || adminErr) }, 403);
    if (!adminRow || !(adminRow as any).is_approved) return jsonResponse({ error: "Forbidden" }, 403);

    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action || "status");

    if (action === "status") {
      const { data: cfgRow } = await service.from("site_config").select("value").eq("key", "db_translation_ai").maybeSingle();
      const cfg = (cfgRow as any)?.value ?? null;

      const { count: pending } = await service
        .from("entity_translation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const { count: errorCount } = await service
        .from("entity_translation_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "error");
      return jsonResponse({ ok: true, config: cfg, pending: pending ?? 0, error: errorCount ?? 0 });
    }

    if (action === "requeue") {
      const entityType = String(payload?.entityType || "");
      const jmId = Number(payload?.jmId);
      if (!entityType || !Number.isFinite(jmId)) return jsonResponse({ error: "Missing entityType/jmId" }, 400);

      const { error } = await service
        .from("entity_translation_jobs")
        .update({ status: "pending", error: null })
        .eq("entity_type", entityType)
        .eq("jm_id", jmId);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (action !== "run") return jsonResponse({ error: "Unknown action" }, 400);

    const limit = Math.max(1, Math.min(20, Number(payload?.limit || 3)));
    const filterEntityType = payload?.entityType ? String(payload.entityType) : null;

    const { data: cfgRow, error: cfgErr } = await service
      .from("site_config")
      .select("value")
      .eq("key", "db_translation_ai")
      .maybeSingle();
    if (cfgErr) throw cfgErr;
    const cfg = (cfgRow as any)?.value ?? {};
    if (!cfg?.enabled) return jsonResponse({ error: "DB translation is disabled" }, 400);

    const endpoint = String(cfg?.endpoint || "https://ark.cn-beijing.volces.com/api/v3/responses").trim();
    const model = String(cfg?.model || "doubao-seed-2-0-lite-260428").trim();

    const { data: secretRow, error: secretErr } = await service
      .from("admin_secrets")
      .select("value")
      .eq("key", "ark_api_key")
      .maybeSingle();
    if (secretErr) throw secretErr;
    const arkApiKey = String((secretRow as any)?.value || "").trim();
    if (!arkApiKey) return jsonResponse({ error: "Missing ark_api_key in admin_secrets" }, 400);

    let q = service
      .from("entity_translation_jobs")
      .select("id,entity_type,jm_id,source_locale,target_locales,fields,source_updated_at,status,attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);
    if (filterEntityType) q = q.eq("entity_type", filterEntityType);

    const { data: jobs, error: jobsErr } = await q;
    if (jobsErr) throw jobsErr;

    const results: any[] = [];
    for (const job of (jobs as JobRow[]) || []) {
      const jobId = job.id;
      try {
        await service
          .from("entity_translation_jobs")
          .update({ status: "processing", attempts: (job.attempts || 0) + 1, error: null })
          .eq("id", jobId);

        const src = await loadEntitySource(service, job.entity_type, job.jm_id);
        if (!src) throw new Error("Source row not found");

        const wanted = new Set((job.fields || []).map((x) => String(x).trim()).filter(Boolean));
        const sourceData: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(src.data)) {
          if (!wanted.has(k)) continue;
          if (v === null || v === undefined) {
            sourceData[k] = null;
            continue;
          }
          const s = String(v).trim();
          sourceData[k] = s ? s : "";
        }

        const targetLocales = Array.isArray(job.target_locales) ? job.target_locales : [];
        for (const locale of targetLocales) {
          const translated = await callArkTranslate({
            endpoint,
            apiKey: arkApiKey,
            model,
            sourceLocale: job.source_locale || "zh-CN",
            targetLocale: String(locale),
            data: sourceData,
          });

          await service
            .from("entity_translations")
            .upsert(
              {
                entity_type: job.entity_type,
                jm_id: job.jm_id,
                locale: String(locale),
                data: translated,
                source_data: sourceData,
                source_updated_at: src.updated_at,
                model,
              },
              { onConflict: "entity_type,jm_id,locale" }
            );
        }

        await service.from("entity_translation_jobs").update({ status: "done", error: null }).eq("id", jobId);
        results.push({ id: jobId, ok: true });
      } catch (e: any) {
        const msg = String(e?.message || e || "Unknown error").slice(0, 800);
        await service.from("entity_translation_jobs").update({ status: "error", error: msg }).eq("id", jobId);
        results.push({ id: jobId, ok: false, error: msg });
      }
    }

    return jsonResponse({ ok: true, processed: results.length, results });
  } catch (e: any) {
    return jsonResponse({ error: String(e?.message || e || "Unknown error") }, 500);
  }
});

