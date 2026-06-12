const https = require('https');
const MCP_HOST = 'mcp.supabase.com';
const MCP_PATH = '/mcp?project_ref=xpksqkhgfqekysbebznv';
const TOKEN = process.env.SUPABASE_MCP_TOKEN || '';

function mcpRequest(method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + TOKEN, 'Content-Length': Buffer.byteLength(body) };
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

async function executeSql(query, sid) {
  const r = await mcpRequest('tools/call', { name: 'execute_sql', arguments: { query } }, sid);
  const text = r.body?.result?.content?.[0]?.text;
  // Extract JSON from within untrusted-data tags
  const match = text.match(/<untrusted-data[^>]*>([\s\S]*?)<\/untrusted-data/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch(e) { return text; }
  }
  try { return JSON.parse(text); } catch(e) { return text; }
}

const queries = [
  // 1. Delete from each locale table
  "DELETE FROM model_details_en;",
  "DELETE FROM model_details_ar;",
  "DELETE FROM model_details_ru;",
  "DELETE FROM model_details_th;",
  "DELETE FROM model_details_ur;",
  "DELETE FROM model_details_tr;",
  "DELETE FROM model_details_pt_br;",
  // 2. Delete done/error translation jobs
  "DELETE FROM public.translation_jobs WHERE entity_type = 'model_detail' AND status IN ('done', 'error');",
  // 3. Check remaining jobs
  "SELECT status, count(*) as cnt FROM translation_jobs WHERE entity_type = 'model_detail' GROUP BY status;",
  // 4. Re-sync
  "SELECT public.sync_translation_changes();",
  // 5. Final verification
  "SELECT count(*) as en_count FROM model_details_en;",
  "SELECT count(*) as pending_count FROM translation_jobs WHERE entity_type = 'model_detail' AND status = 'pending';",
];

async function main() {
  const init = await mcpRequest('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' } });
  const sid = init.sessionId;
  await mcpRequest('notifications/initialized', {}, sid).catch(() => {});

  for (const q of queries) {
    const preview = q.substring(0, 90);
    console.log(`[SQL] ${preview}...`);
    try {
      const result = await executeSql(q, sid);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
    }
  }
}
main().catch(e => console.error(e));
