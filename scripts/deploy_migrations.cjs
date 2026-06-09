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

async function executeSql(query, sid) {
  const r = await mcpRequest('tools/call', { name: 'execute_sql', arguments: { query } }, sid);
  const text = r.body?.result?.content?.[0]?.text;
  if (text && text.includes('error')) {
    const err = JSON.parse(text);
    throw new Error(err.error?.message || text);
  }
  return JSON.parse(text);
}

async function main() {
  const init = await mcpRequest('initialize', {
    protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sessionId;
  mcpRequest('notifications/initialized', {}, sid).catch(function(){});

  const fs = require('fs');

  // Run migration 0069
  console.log('=== 部署迁移 0069: 级联删除 ===');
  const sql69 = fs.readFileSync('supabase/migrations/0069_cascade_delete.sql', 'utf8');
  const stmts = sql69.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  for (const stmt of stmts) {
    try {
      await executeSql(stmt.trim(), sid);
    } catch(e) {
      console.log('  警告:', e.message?.substring(0, 150));
    }
  }
  console.log('  完成');

  // Run migration 0070
  console.log('\n=== 部署迁移 0070: 禁用入队触发器 ===');
  const sql70 = fs.readFileSync('supabase/migrations/0070_disable_triggers.sql', 'utf8');
  const stmts2 = sql70.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
  for (const stmt of stmts2) {
    try {
      await executeSql(stmt.trim(), sid);
    } catch(e) {
      console.log('  警告:', e.message?.substring(0, 150));
    }
  }
  console.log('  完成');

  // Verify: check cascade triggers exist
  console.log('\n=== 验证级联删除触发器 ===');
  const triggers = await executeSql(
    "SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE tgname LIKE '%cascade_delete%' ORDER BY relname"
    , sid);
  console.log(JSON.stringify(triggers.result, null, 2));

  // Verify: enqueue triggers are gone
  console.log('\n=== 验证入队触发器已禁用 ===');
  const enqTriggers = await executeSql(
    "SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE tgname LIKE '%enqueue_translation%' ORDER BY relname"
    , sid);
  console.log(JSON.stringify(enqTriggers.result, null, 2));

  // Verify: orphaned data cleaned
  console.log('\n=== 验证孤儿数据已清理 ===');
  const orphans = await executeSql(
    "SELECT 'brand' as etype, count(*) FROM entity_translations et LEFT JOIN brands b ON et.entity_type='brand' AND et.jm_id = b.jm_id WHERE et.entity_type='brand' AND b.jm_id IS NULL UNION ALL SELECT 'series', count(*) FROM entity_translations et LEFT JOIN series s ON et.entity_type='series' AND et.jm_id = s.jm_id WHERE et.entity_type='series' AND s.jm_id IS NULL UNION ALL SELECT 'model', count(*) FROM entity_translations et LEFT JOIN models_jumdata m ON et.entity_type='model' AND et.jm_id = m.jm_id WHERE et.entity_type='model' AND m.jm_id IS NULL UNION ALL SELECT 'model_detail', count(*) FROM entity_translations et LEFT JOIN model_details md ON et.entity_type='model_detail' AND et.jm_id = md.jm_id WHERE et.entity_type='model_detail' AND md.jm_id IS NULL"
    , sid);
  console.log(JSON.stringify(orphans.result, null, 2));
}

main().catch(e => console.error(e));
