// MCP SQL executor for YLM Supabase project
// Token is read from stdin to avoid command-line exposure
const https = require('https');
const readline = require('readline');

async function getToken() {
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) return line.trim();
}

async function mcpReq(method, params, sid) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': 'Bearer ' + TOKEN,
      'Content-Length': Buffer.byteLength(body),
    };
    if (sid) headers['Mcp-Session-Id'] = sid;
    const req = https.request({
      hostname: 'mcp.supabase.com',
      path: '/mcp?project_ref=xpksqkhgfqekysbebznv',
      method: 'POST', headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ body: JSON.parse(data), sid: res.headers['mcp-session-id'] }); }
        catch(e) { resolve({ body: data, sid: res.headers['mcp-session-id'] }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function exec(query) {
  const init = await mcpReq('initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sid;
  mcpReq('notifications/initialized', {}, sid).catch(() => {});
  const r = await mcpReq('tools/call', {
    name: 'execute_sql',
    arguments: { query },
  }, sid);
  try {
    return JSON.parse(r.body.result.content[0].text);
  } catch(e) {
    return r.body.result.content[0].text;
  }
}

let TOKEN;

async function main() {
  TOKEN = await getToken();
  const query = process.argv[2];
  if (!query) {
    console.log('ERROR: No SQL query provided');
    process.exit(1);
  }
  try {
    const result = await exec(query);
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

main();
