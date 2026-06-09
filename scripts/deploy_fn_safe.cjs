const fs = require('fs');
const https = require('https');
const TOKEN = process.env.SUPABASE_MCP_TOKEN || '';
if (!TOKEN) { console.error('Set SUPABASE_MCP_TOKEN env var'); process.exit(1); }

const MCP_HOST = 'mcp.supabase.com';
const MCP_PATH = '/mcp?project_ref=xpksqkhgfqekysbebznv';

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

async function main() {
  const init = await mcpRequest('initialize', {
    protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sessionId;
  mcpRequest('notifications/initialized', {}, sid).catch(function(){});

  const funcCode = fs.readFileSync('supabase/functions/db-translate/index.ts', 'utf8');

  const r = await mcpRequest('tools/call', {
    name: 'deploy_edge_function',
    arguments: {
      name: 'db-translate',
      entrypoint_path: 'index.ts',
      verify_jwt: false,
      files: [{ name: 'index.ts', content: funcCode }]
    }
  }, sid);
  console.log('Deploy:', r.body?.result?.content?.[0]?.text || JSON.stringify(r.body));
}
main().catch(e => console.error(e));
