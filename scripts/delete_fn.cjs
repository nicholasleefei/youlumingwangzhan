const https = require('https');
const MCP_HOST = 'mcp.supabase.com';
const MCP_PATH = '/mcp?project_ref=xpksqkhgfqekysbebznv';
const TOKEN = 'SUPABASE_MCP_TOKEN_PLACEHOLDER';

function mcpRequest(method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + TOKEN, 'Content-Length': Buffer.byteLength(body) };
    if (sessionId) headers['Mcp-Session-Id'] = sessionId;
    const req = https.request({ hostname: MCP_HOST, path: MCP_PATH, method: 'POST', headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve({ body: JSON.parse(data), sessionId: res.headers['mcp-session-id'] }); } catch(e) { resolve({ body: data }); } });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function main() {
  const init = await mcpRequest('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' } });
  const sid = init.sessionId;
  mcpRequest('notifications/initialized', {}, sid).catch(() => {});

  // 删除 Edge Function db-translate
  console.log('删除 Edge Function db-translate...');
  const r = await mcpRequest('tools/call', {
    name: 'execute_sql',
    arguments: { query: \"SELECT supabase_api.delete_edge_function('db-translate')\" }
  }, sid);
  console.log(r.body?.result?.content?.[0]?.text || JSON.stringify(r.body));

  // 验证删除
  const list = await mcpRequest('tools/call', { name: 'list_edge_functions' }, sid);
  console.log('\\n当前 Edge Functions:');
  console.log(JSON.stringify(list.body?.result, null, 2));
}
main().catch(e => console.error(e));