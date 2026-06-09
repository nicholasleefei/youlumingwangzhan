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

  // Check if model_details has 'raw' column
  const r1 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'model_details' ORDER BY ordinal_position" },
  }, sid);
  console.log('=== model_details columns ===');
  console.log(r1.body?.result?.content?.[0]?.text || JSON.stringify(r1.body));

  // Check a sample model_detail for raw data
  const r2 = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: "SELECT jm_id, raw IS NOT NULL as has_raw FROM model_details WHERE activity_status = 0 LIMIT 3" },
  }, sid);
  console.log('\n=== model_details raw check ===');
  console.log(r2.body?.result?.content?.[0]?.text || JSON.stringify(r2.body));
}

main().catch(e => console.error(e));
