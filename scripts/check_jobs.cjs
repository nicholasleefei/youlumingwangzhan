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

  // Check errored jobs
  const r1 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT entity_type, jm_id, status, error, attempts FROM entity_translation_jobs WHERE status = 'error' ORDER BY created_at DESC LIMIT 20" },
  }, sid);
  console.log('=== ERRORED JOBS ===');
  console.log(r1.body?.result?.content?.[0]?.text || JSON.stringify(r1.body));

  // Check RPC function
  const r2 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT proname, pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'count_fully_translated'" },
  }, sid);
  console.log('\n=== RPC FUNCTION ===');
  console.log(r2.body?.result?.content?.[0]?.text || JSON.stringify(r2.body));

  // Check site_config
  const r3 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT key, value FROM site_config WHERE key = 'db_translation_ai'" },
  }, sid);
  console.log('\n=== SITE CONFIG ===');
  console.log(r3.body?.result?.content?.[0]?.text || JSON.stringify(r3.body));

  // Check admin_secrets
  const r4 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT key FROM admin_secrets WHERE key = 'deepseek_api_key'" },
  }, sid);
  console.log('\n=== ADMIN SECRETS ===');
  console.log(r4.body?.result?.content?.[0]?.text || JSON.stringify(r4.body));

  // Recent 500 error details - check postgres logs for any errors
  const r5 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT entity_type, count(*) as cnt, status FROM entity_translation_jobs GROUP BY entity_type, status ORDER BY entity_type, status" },
  }, sid);
  console.log('\n=== JOB STATUS SUMMARY ===');
  console.log(r5.body?.result?.content?.[0]?.text || JSON.stringify(r5.body));
}

main().catch(e => console.error(e));
