const https = require('https');
const MCP_HOST = 'mcp.supabase.com';
const MCP_PATH = '/mcp?project_ref=xpksqkhgfqekysbebznv';
const TOKEN = 'SUPABASE_MCP_TOKEN_PLACEHOLDER';

function mcpRequest(method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const headers = {
      'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream',
      'Authorization': 'Bearer ' + TOKEN, 'Content-Length': Buffer.byteLength(body),
    };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;
    const req = https.request({ hostname: MCP_HOST, path: MCP_PATH, method: 'POST', headers }, (res) => {
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
  const r = await mcpRequest('tools/call', { name: 'execute_sql', arguments: { query } }, sid);
  return r.body?.result?.content?.[0]?.text || JSON.stringify(r.body);
}

async function main() {
  const init = await mcpRequest('initialize', {
    protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sessionId;
  mcpRequest('notifications/initialized', {}, sid).catch(function(){});

  // 1. Check data type of entity_translations.jm_id vs source tables
  console.log('=== 1. jm_id 数据类型对比 ===');
  console.log(await sql("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('entity_translations','entity_translation_jobs','brands','series','models_jumdata','model_details') AND column_name = 'jm_id' ORDER BY table_name", sid));

  // 2. Sample data to verify jm_id values match
  console.log('\n=== 2. brands.jm_id vs entity_translations.jm_id ===');
  console.log(await sql("SELECT b.jm_id as brand_jm_id, et.jm_id as trans_jm_id, et.locale FROM brands b INNER JOIN entity_translations et ON et.entity_type = 'brand' AND et.jm_id = b.jm_id::text LIMIT 5", sid));

  // 3. series jm_id cross-check
  console.log('\n=== 3. series.jm_id vs entity_translations ===');
  console.log(await sql("SELECT s.jm_id as series_jm_id, et.jm_id as trans_jm_id, et.locale FROM series s INNER JOIN entity_translations et ON et.entity_type = 'series' AND et.jm_id = s.jm_id::text LIMIT 5", sid));

  // 4. models_jumdata cross-check
  console.log('\n=== 4. models_jumdata.jm_id vs entity_translations ===');
  console.log(await sql("SELECT m.jm_id as model_jm_id, et.jm_id as trans_jm_id, et.locale FROM models_jumdata m INNER JOIN entity_translations et ON et.entity_type = 'model' AND et.jm_id = m.jm_id::text LIMIT 5", sid));

  // 5. model_details cross-check
  console.log('\n=== 5. model_details.jm_id vs entity_translations ===');
  console.log(await sql("SELECT md.jm_id as md_jm_id, et.jm_id as trans_jm_id, et.locale FROM model_details md INNER JOIN entity_translations et ON et.entity_type = 'model_detail' AND et.jm_id = md.jm_id::text LIMIT 5", sid));

  // 6. Check for any jm_id type mismatch issues - are there text values that can't be cast to int?
  console.log('\n=== 6. entity_translations.jm_id 中有无法转为int的值吗 ===');
  console.log(await sql("SELECT jm_id, entity_type, count(*) FROM entity_translations WHERE jm_id !~ '^[0-9]+$' GROUP BY jm_id, entity_type LIMIT 10", sid));

  // 7. Orphaned translations count
  console.log('\n=== 7. 孤儿翻译数量 ===');
  console.log(await sql("SELECT 'brand' as etype, count(*) FROM entity_translations et LEFT JOIN brands b ON et.entity_type='brand' AND et.jm_id::int = b.jm_id WHERE et.entity_type='brand' AND b.jm_id IS NULL UNION ALL SELECT 'series', count(*) FROM entity_translations et LEFT JOIN series s ON et.entity_type='series' AND et.jm_id::int = s.jm_id WHERE et.entity_type='series' AND s.jm_id IS NULL UNION ALL SELECT 'model', count(*) FROM entity_translations et LEFT JOIN models_jumdata m ON et.entity_type='model' AND et.jm_id::int = m.jm_id WHERE et.entity_type='model' AND m.jm_id IS NULL UNION ALL SELECT 'model_detail', count(*) FROM entity_translations et LEFT JOIN model_details md ON et.entity_type='model_detail' AND et.jm_id::int = md.jm_id WHERE et.entity_type='model_detail' AND md.jm_id IS NULL", sid));

  // 8. Orphaned jobs count
  console.log('\n=== 8. 孤儿作业数量 ===');
  console.log(await sql("SELECT 'brand' as etype, count(*) FROM entity_translation_jobs ej LEFT JOIN brands b ON ej.entity_type='brand' AND ej.jm_id::int = b.jm_id WHERE ej.entity_type='brand' AND b.jm_id IS NULL UNION ALL SELECT 'series', count(*) FROM entity_translation_jobs ej LEFT JOIN series s ON ej.entity_type='series' AND ej.jm_id::int = s.jm_id WHERE ej.entity_type='series' AND s.jm_id IS NULL UNION ALL SELECT 'model', count(*) FROM entity_translation_jobs ej LEFT JOIN models_jumdata m ON ej.entity_type='model' AND ej.jm_id::int = m.jm_id WHERE ej.entity_type='model' AND m.jm_id IS NULL UNION ALL SELECT 'model_detail', count(*) FROM entity_translation_jobs ej LEFT JOIN model_details md ON ej.entity_type='model_detail' AND ej.jm_id::int = md.jm_id WHERE ej.entity_type='model_detail' AND md.jm_id IS NULL", sid));

  // 9. Check how frontend queries translations (from entityTranslation.ts)
  console.log('\n=== 9. 翻译表总数 ===');
  console.log(await sql("SELECT entity_type, count(*) as total, count(distinct jm_id) as unique_entities, count(distinct locale) as locales FROM entity_translations GROUP BY entity_type ORDER BY entity_type", sid));

  // 10. Check cascade - do model_details rows get deleted when series is deleted?
  console.log('\n=== 10. FK cascade chains ===');
  console.log(await sql("SELECT conname, conrelid::regclass, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid::regclass::text IN ('series','models_jumdata','model_details') AND contype='f' AND pg_get_constraintdef(oid) ILIKE '%DELETE%' ORDER BY conrelid::regclass::text", sid));
}

main().catch(e => console.error(e));
