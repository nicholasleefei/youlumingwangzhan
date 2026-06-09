const fs = require('fs');

// Read the file
let code = fs.readFileSync('supabase/functions/db-translate/index.ts', 'utf8');

// Find the broken doTranslateRemaining function body (line ~565-626 area)
// The issue is it references "entities" variable that's out of scope
// and the for loop structure is broken.
// Fix: replace the entire broken section with a clean version.

// Find the broken section from "async function doTranslateRemaining" to the end of the broken loop
const brokenStart = code.indexOf('async function doTranslateRemaining(');
const brokenEnd = code.indexOf('return jsonResponse({ ok: true, processed, totalCandidates: entities.length, targetLocales, details: allDetails });');

if (brokenStart === -1 || brokenEnd === -1) {
  console.error('Could not find broken section');
  process.exit(1);
}

const endOfBrokenReturn = brokenEnd + 'return jsonResponse({ ok: true, processed, totalCandidates: entities.length, targetLocales, details: allDetails });'.length;

let prefix = code.substring(0, brokenStart);
let suffix = code.substring(endOfBrokenReturn);

const replacement = `async function doTranslateRemaining(
  supabaseClient: any,
  config: { endpoint: string; apiKey: string; model: string; target_locales: string[] },
  entityType: string,
  toTranslateList: any[],
  targetLocales: string[],
  totalCandidates: number,
) {
  const allDetails: any[] = [];
  let processed = 0;

  if (!toTranslateList.length) return jsonResponse({ ok: true, processed: 0, message: "All entities fully translated", details: [] });

  console.log(\`translate_remaining: \${entityType} → \${toTranslateList.length} entities to process (\${totalCandidates} scanned, \${targetLocales.length} target locales)\`);

  for (const entity of toTranslateList) {
    const jmId = (entity as any).jm_id;
    const entityName = (entity as any).name || "";

    const entityFields = getFieldsForEntityType(entityType, entity);
    const src = await loadEntitySource(supabaseClient, entityType as JobRow["entity_type"], String(jmId), entityFields);
    if (!src) { console.log(\`  [SKIP] \${entityType}#\${jmId}: entity not found or no data\`); continue; }

    const { "@updated_at": _ts, ...toTranslate } = src.data;
    if (Object.keys(toTranslate).length === 0) { console.log(\`  [SKIP] \${entityType}#\${jmId}: no translatable fields\`); continue; }

    // Get existing translations for this entity
    const { data: existingForEntity } = await supabaseClient
      .from("entity_translations")
      .select("locale, source_updated_at, data")
      .eq("entity_type", entityType)
      .eq("jm_id", jmId);

    const existingMap = new Map<string, { sourceUpdatedAt: string; data: Record<string, unknown> }>();
    for (const row of (existingForEntity ?? [])) {
      existingMap.set((row as any).locale, {
        sourceUpdatedAt: (row as any).source_updated_at ?? "",
        data: (row as any).data ?? {},
      });
    }

    // Translate missing locales (max 6 per call, concurrency 3)
    const localesToProcess = targetLocales
      .filter(l => !existingMap.has(l) || existingMap.get(l)!.sourceUpdatedAt !== src.updated_at)
      .slice(0, 6);

    console.log(\`  Processing \${entityType}#\${jmId} "\${entityName}": \${Object.keys(toTranslate).length} keys → \${localesToProcess.length} locales [\${localesToProcess.join(',')}]\`);

    const localeChunks: string[][] = [];
    for (let ci = 0; ci < localesToProcess.length; ci += 3) {
      localeChunks.push(localesToProcess.slice(ci, ci + 3));
    }

    for (const chunk of localeChunks) {
      await Promise.all(chunk.map(async (locale) => {
        try {
          console.log(\`Translating \${entityType}#\${jmId} to \${locale} (\${Object.keys(toTranslate).length} keys)...\`);
          const translated = await callTranslateApiWithRetry({
            endpoint: config.endpoint, apiKey: config.apiKey, model: config.model,
            sourceLocale: "zh-CN", targetLocale: locale, data: toTranslate,
          });

          const topLevel: Record<string, string> = {};
          const rawFlat: Record<string, string> = {};
          for (const [k, v] of Object.entries(translated)) {
            if (k.startsWith("raw.")) { rawFlat[k.slice(4)] = v; }
            else { topLevel[k] = v; }
          }

          for (const [k, v] of Object.entries(topLevel)) {
            if (v !== toTranslate[k]) {
              allDetails.push({
                entityType, entityName, locale, key: k,
                source: (toTranslate[k] ?? "").substring(0, 300),
                translated: (String(v) ?? "").substring(0, 300),
              });
            }
          }
          for (const [k, v] of Object.entries(rawFlat)) {
            const rawKey = \`raw.\${k}\`;
            if (v !== toTranslate[rawKey]) {
              allDetails.push({
                entityType, entityName, locale, key: rawKey,
                source: (toTranslate[rawKey] ?? "").substring(0, 300),
                translated: (String(v) ?? "").substring(0, 300),
              });
            }
          }

          const storeData: Record<string, unknown> = { ...topLevel };
          if (Object.keys(rawFlat).length > 0) {
            storeData["raw"] = unflattenToNested(rawFlat);
          }

          await supabaseClient.from("entity_translations").upsert({
            entity_type: entityType, jm_id: jmId, locale,
            data: storeData, source_data: src.data,
            source_updated_at: src.updated_at, model: config.model,
          }, { onConflict: "entity_type,jm_id,locale" });
        } catch (e: any) {
          console.error(\`Failed \${entityType}#\${jmId} to \${locale}:\`, e.message);
          allDetails.push({ entityType, entityName, locale, error: String(e?.message || e).slice(0, 200) });
        }
      }));
    }
    processed++;
  }

  return jsonResponse({ ok: true, processed, totalCandidates, targetLocales, details: allDetails });
}`;

const fixed = prefix + replacement + suffix;
fs.writeFileSync('supabase/functions/db-translate/index.ts', fixed, 'utf8');
console.log('Fixed! Lines:', fixed.split('\n').length);
