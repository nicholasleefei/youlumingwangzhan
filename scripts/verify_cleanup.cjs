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
  const text = r.body?.result?.content?.[0]?.text || '';
  console.log('RAW:', text.substring(0, 800));
  const m = text.match(/<untrusted-data[^>]*>([\s\S]*?)<\/untrusted-data/);
  return m ? m[1].trim() : '';
}

async function main() {
  const init = await mcpRequest('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' } });
  const sid = init.sessionId;
  await mcpRequest('notifications/initialized', {}, sid).catch(() => {});

  // Verify all tables empty
  console.log('=== Translation tables status ===');
  const locales = ['en', 'ar', 'ru', 'th', 'ur', 'tr', 'pt_br'];
  let allZero = true;
  for (const loc of locales) {
    const result = await executeSql('SELECT count(*)::int FROM model_details_' + loc, sid);
    console.log(loc + ': ' + result);
    if (result !== '0') allZero = false;
  }

  // Check pending jobs
  console.log('\n=== Pending model_detail jobs ===');
  const pq = await executeSql("SELECT count(*)::int FROM translation_jobs WHERE entity_type = 'model_detail' AND status = 'pending';", sid);
  console.log('pending: ' + pq);

  console.log('\n=== All clear: ' + allZero);
}
main().catch(e => console.error(e));
