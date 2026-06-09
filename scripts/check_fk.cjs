const https = require('https');
const MCP_HOST = 'mcp.supabase.com';
const MCP_PATH = '/mcp?project_ref=xpksqkhgfqekysbebznv';
const TOKEN = 'SUPABASE_MCP_TOKEN_PLACEHOLDER';

function mcpRequest(method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Length': Buffer.byteLength(body),
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

async function main() {
  const init = await mcpRequest('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sessionId;
  mcpRequest('notifications/initialized', {}, sid).catch(function(){});

  // Check FK constraints on entity_translations and entity_translation_jobs
  const r1 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(oid) AS constraint_def FROM pg_constraint WHERE conrelid IN ('entity_translations'::regclass, 'entity_translation_jobs'::regclass) AND contype = 'f'" },
  }, sid);
  console.log('=== FK constraints on entity_translations/jobs ===');
  console.log(r1.body?.result?.content?.[0]?.text || JSON.stringify(r1.body));

  // Check orphaned translations (where source entity no longer exists)
  const r2 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT et.entity_type, et.jm_id, et.locale, et.updated_at FROM entity_translations et LEFT JOIN brands b ON et.entity_type = 'brand' AND b.jm_id::text = et.jm_id LEFT JOIN series s ON et.entity_type = 'series' AND s.jm_id::text = et.jm_id LEFT JOIN models_jumdata m ON et.entity_type = 'model' AND m.jm_id::text = et.jm_id LEFT JOIN model_details md ON et.entity_type = 'model_detail' AND md.jm_id::text = et.jm_id WHERE (et.entity_type = 'brand' AND b.jm_id IS NULL) OR (et.entity_type = 'series' AND s.jm_id IS NULL) OR (et.entity_type = 'model' AND m.jm_id IS NULL) OR (et.entity_type = 'model_detail' AND md.jm_id IS NULL) LIMIT 20" },
  }, sid);
  console.log('\n=== Orphaned translations ===');
  console.log(r2.body?.result?.content?.[0]?.text || JSON.stringify(r2.body));

  // Check orphaned jobs
  const r3 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT ej.entity_type, ej.jm_id, ej.status, ej.updated_at FROM entity_translation_jobs ej LEFT JOIN brands b ON ej.entity_type = 'brand' AND b.jm_id::text = ej.jm_id LEFT JOIN series s ON ej.entity_type = 'series' AND s.jm_id::text = ej.jm_id LEFT JOIN models_jumdata m ON ej.entity_type = 'model' AND m.jm_id::text = ej.jm_id LEFT JOIN model_details md ON ej.entity_type = 'model_detail' AND md.jm_id::text = ej.jm_id WHERE (ej.entity_type = 'brand' AND b.jm_id IS NULL) OR (ej.entity_type = 'series' AND s.jm_id IS NULL) OR (ej.entity_type = 'model' AND m.jm_id IS NULL) OR (ej.entity_type = 'model_detail' AND md.jm_id IS NULL) LIMIT 20" },
  }, sid);
  console.log('\n=== Orphaned jobs ===');
  console.log(r3.body?.result?.content?.[0]?.text || JSON.stringify(r3.body));
}

main().catch(e => console.error(e));
