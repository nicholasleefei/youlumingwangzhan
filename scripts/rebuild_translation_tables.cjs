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

async function executeSql(query, sid) {
  const r = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query },
  }, sid);
  const text = r.body?.result?.content?.[0]?.text;
  try { return JSON.parse(text); } catch(e) { return text; }
}

async function main() {
  const init = await mcpRequest('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sessionId;
  await mcpRequest('notifications/initialized', {}, sid).catch(function(){});

  // Check source table columns
  for (const tbl of ['brands', 'series', 'models_jumdata', 'model_details']) {
    const result = await executeSql(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = '${tbl}'
       ORDER BY ordinal_position;`,
      sid
    );
    console.log(`=== ${tbl} columns ===`);
    console.log(JSON.stringify(result, null, 2));
  }

  // Check triggers on source tables
  const triggers = await executeSql(
    `SELECT event_object_table, trigger_name, event_manipulation, action_statement
     FROM information_schema.triggers
     WHERE event_object_schema = 'public'
     AND event_object_table IN ('brands', 'series', 'models_jumdata', 'model_details')
     ORDER BY event_object_table, trigger_name;`,
    sid
  );
  console.log('=== Triggers on source tables ===');
  console.log(JSON.stringify(triggers, null, 2));

  // Check translation_jobs count
  const jobsCount = await executeSql(
    `SELECT entity_type, status, count(*) FROM public.translation_jobs GROUP BY entity_type, status ORDER BY entity_type, status;`,
    sid
  );
  console.log('=== translation_jobs counts ===');
  console.log(JSON.stringify(jobsCount, null, 2));
}

main().catch(e => console.error(e));
