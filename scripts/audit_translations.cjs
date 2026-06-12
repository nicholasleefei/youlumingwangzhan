// Fast audit: batch queries into a single SQL block per section
const https = require('https');
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Missing SUPABASE_ACCESS_TOKEN env var');
  process.exit(1);
}

function mcp(body, sid) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + TOKEN, 'Content-Length': Buffer.byteLength(body) };
    if (sid) headers['Mcp-Session-Id'] = sid;
    const req = https.request({ hostname: 'mcp.supabase.com', path: '/mcp?project_ref=xpksqkhgfqekysbebznv', method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ body: JSON.parse(data), sessionId: res.headers['mcp-session-id'] }); }
        catch(e) { resolve({ body: data, sessionId: res.headers['mcp-session-id'] }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sql(query, sid) {
  const r = await mcp(JSON.stringify({ jsonrpc: '2.0', method: 'tools/call', params: { name: 'execute_sql', arguments: { query } }, id: 1 }), sid);
  const text = r.body?.result?.content?.[0]?.text || '';
  const m = text.match(/<untrusted-data[^>]*>([\s\S]*?)<\/untrusted-data/);
  try { return m ? JSON.parse(m[1].trim()) : []; }
  catch(e) { return text; }
}

async function main() {
  const init = await mcp(JSON.stringify({ jsonrpc: '2.0', method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'audit', version: '1.0' } }, id: 1 }));
  const sid = init.sessionId;
  await mcp(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }), sid).catch(() => {});

  // 1. Quick check: do tables exist and have data?
  console.log('=== 1. QUICK SANITY CHECK ===');
  const check = await sql(`
    SELECT 'brands' as t, count(*)::int FROM brands WHERE activity_status = 0
    UNION ALL SELECT 'series', count(*)::int FROM series WHERE activity_status = 0
    UNION ALL SELECT 'models_jumdata', count(*)::int FROM models_jumdata WHERE activity_status = 0
    UNION ALL SELECT 'model_details', count(*)::int FROM model_details WHERE activity_status = 0
    UNION ALL SELECT 'brands_en', count(*)::int FROM brands_en
    UNION ALL SELECT 'series_en', count(*)::int FROM series_en
    UNION ALL SELECT 'models_jumdata_en', count(*)::int FROM models_jumdata_en
    UNION ALL SELECT 'model_details_en', count(*)::int FROM model_details_en
  `, sid);
  console.log(JSON.stringify(check, null, 2));

  if (!check.length) {
    console.log('NO DATA RETURNED — tables may not exist or be empty. Checking table list...');
    const tables = await sql(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%translat%' OR table_name LIKE '%brands%' OR table_name LIKE '%series%' OR table_name LIKE '%models%' OR table_name LIKE '%model_details%' ORDER BY table_name`, sid);
    console.log('Tables found:', JSON.stringify(tables, null, 2));
    return;
  }

  // 2. Coverage: all entities x all locales in ONE query block
  console.log('\n=== 2. COVERAGE ===');
  const covQueries = [];
  const LOCALES = ['en','ar','ru','th','ur','tr','pt_br'];
  const entities = [
    ['brand','brands'],
    ['series','series'],
    ['model','models_jumdata'],
    ['model_detail','model_details'],
  ];
  for (const [ek, et] of entities) {
    for (const loc of LOCALES) {
      const tt = ek === 'model' ? `models_jumdata_${loc}` : `${et}_${loc}`;
      covQueries.push(`SELECT '${ek}/${loc}' as k, count(*)::int as c FROM ${tt}`);
    }
  }
  const covResult = await sql(covQueries.join('\nUNION ALL\n'), sid);
  if (Array.isArray(covResult)) {
    const map = {};
    covResult.forEach(r => { map[r.k] = r.c; });
    for (const [ek] of entities) {
      for (const loc of LOCALES) console.log(`  ${ek}/${loc}: ${map[`${ek}/${loc}`] || 0}`);
    }
  }

  // 3. Invalid Chinese text check — one query per entity type
  console.log('\n=== 3. CHINESE TEXT IN TRANSLATION TABLES (INVALID) ===');
  for (const [ek, et] of entities) {
    const fields = ek === 'brand' ? ['name','fullname']
      : ek === 'series' ? ['name','fullname']
      : ['name'];
    for (const loc of LOCALES) {
      const tt = ek === 'model' ? `models_jumdata_${loc}` : `${et}_${loc}`;
      const conds = fields.map(f => `(${f} IS NOT NULL AND ${f} != '' AND ${f} ~ '[一-鿿]')`).join(' OR ');
      const r = await sql(`SELECT count(*)::int as c FROM ${tt} WHERE ${conds}`, sid);
      if (Array.isArray(r) && r[0]?.c > 0) {
        console.log(`  ${ek}/${loc}: ${r[0].c} rows have Chinese chars`);
      }
    }
  }

  // 4. model_detail raw JSONB check for Chinese
  console.log('\n=== 4. MODEL_DETAIL RAW JSONB CHINESE CHECK ===');
  for (const loc of LOCALES) {
    const r = await sql(`SELECT count(*)::int as c FROM model_details_${loc} WHERE raw::text ~ '[一-鿿]'`, sid);
    if (Array.isArray(r) && r[0]?.c > 0) {
      console.log(`  ${loc}: ${r[0].c} rows with Chinese in raw`);
    }
  }

  // 5. Orphans
  console.log('\n=== 5. ORPHANS ===');
  for (const [ek, et] of entities) {
    for (const loc of LOCALES) {
      const tt = ek === 'model' ? `models_jumdata_${loc}` : `${et}_${loc}`;
      const r = await sql(`SELECT count(*)::int as c FROM ${tt} t WHERE NOT EXISTS (SELECT 1 FROM ${et} s WHERE s.jm_id = t.jm_id)`, sid);
      if (Array.isArray(r) && r[0]?.c > 0) {
        console.log(`  ${ek}/${loc}: ${r[0].c} orphans`);
      }
    }
  }

  // 6. Jobs
  console.log('\n=== 6. TRANSLATION JOBS ===');
  const jobs = await sql(`SELECT coalesce(entity_type,'ALL') as et, coalesce(target_locale,'ALL') as loc, status, count(*)::int FROM translation_jobs GROUP BY rollup(entity_type, target_locale, status) ORDER BY et, loc, status`, sid);
  console.log(JSON.stringify(jobs, null, 2));

  // 7. Missing source entities that need translation (entities with no en row)
  console.log('\n=== 7. ENTITIES MISSING ENGLISH TRANSLATION ===');
  for (const [ek, et] of entities) {
    const tt = ek === 'model' ? 'models_jumdata_en' : `${et}_en`;
    const r = await sql(`SELECT count(*)::int as c FROM ${et} s WHERE s.activity_status = 0 AND NOT EXISTS (SELECT 1 FROM ${tt} t WHERE t.jm_id = s.jm_id)`, sid);
    if (Array.isArray(r)) console.log(`  ${ek}: ${r[0]?.c || 0} missing en translation`);
  }

  console.log('\n=== DONE ===');
}

main().catch(e => { console.error(e); process.exit(1); });
