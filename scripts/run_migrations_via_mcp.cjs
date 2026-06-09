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

async function sql(query, sid) {
  const r = await mcpRequest('tools/call', { name: 'execute_sql', arguments: { query } }, sid);
  const text = r.body?.result?.content?.[0]?.text;
  console.log('  →', text.substring(0, 300));
  try { return JSON.parse(text); }
  catch(e) { return text; }
}

async function main() {
  const init = await mcpRequest('initialize', {
    protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude', version: '1.0' },
  });
  const sid = init.sessionId;
  mcpRequest('notifications/initialized', {}, sid).catch(function(){});

  // ---- Migration 0069 ----
  console.log('=== 0069: 创建级联删除函数 ===');
  await sql(`CREATE OR REPLACE FUNCTION public.cascade_delete_translations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.entity_translations WHERE entity_type = TG_ARGV[0] AND jm_id = OLD.jm_id;
  DELETE FROM public.entity_translation_jobs WHERE entity_type = TG_ARGV[0] AND jm_id = OLD.jm_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;`, sid);

  console.log('\n=== 0069: 品牌 AFTER DELETE 触发器 ===');
  await sql(`DROP TRIGGER IF EXISTS trg_brands_cascade_delete_translations ON public.brands`, sid);
  await sql(`CREATE TRIGGER trg_brands_cascade_delete_translations AFTER DELETE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_translations('brand')`, sid);

  console.log('\n=== 0069: 车系 AFTER DELETE 触发器 ===');
  await sql(`DROP TRIGGER IF EXISTS trg_series_cascade_delete_translations ON public.series`, sid);
  await sql(`CREATE TRIGGER trg_series_cascade_delete_translations AFTER DELETE ON public.series FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_translations('series')`, sid);

  console.log('\n=== 0069: 车型 AFTER DELETE 触发器 ===');
  await sql(`DROP TRIGGER IF EXISTS trg_models_jumdata_cascade_delete_translations ON public.models_jumdata`, sid);
  await sql(`CREATE TRIGGER trg_models_jumdata_cascade_delete_translations AFTER DELETE ON public.models_jumdata FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_translations('model')`, sid);

  console.log('\n=== 0069: 车型详情 AFTER DELETE 触发器 ===');
  await sql(`DROP TRIGGER IF EXISTS trg_model_details_cascade_delete_translations ON public.model_details`, sid);
  await sql(`CREATE TRIGGER trg_model_details_cascade_delete_translations AFTER DELETE ON public.model_details FOR EACH ROW EXECUTE FUNCTION public.cascade_delete_translations('model_detail')`, sid);

  console.log('\n=== 0069: 清理孤儿翻译 (按类型) ===');
  await sql(`DELETE FROM public.entity_translations WHERE entity_type='brand' AND NOT EXISTS (SELECT 1 FROM public.brands WHERE jm_id = entity_translations.jm_id)`, sid);
  await sql(`DELETE FROM public.entity_translations WHERE entity_type='series' AND NOT EXISTS (SELECT 1 FROM public.series WHERE jm_id = entity_translations.jm_id)`, sid);
  await sql(`DELETE FROM public.entity_translations WHERE entity_type='model' AND NOT EXISTS (SELECT 1 FROM public.models_jumdata WHERE jm_id = entity_translations.jm_id)`, sid);
  await sql(`DELETE FROM public.entity_translations WHERE entity_type='model_detail' AND NOT EXISTS (SELECT 1 FROM public.model_details WHERE jm_id = entity_translations.jm_id)`, sid);

  console.log('\n=== 0069: 清理孤儿作业 ===');
  await sql(`DELETE FROM public.entity_translation_jobs WHERE entity_type='brand' AND NOT EXISTS (SELECT 1 FROM public.brands WHERE jm_id = entity_translation_jobs.jm_id)`, sid);
  await sql(`DELETE FROM public.entity_translation_jobs WHERE entity_type='series' AND NOT EXISTS (SELECT 1 FROM public.series WHERE jm_id = entity_translation_jobs.jm_id)`, sid);
  await sql(`DELETE FROM public.entity_translation_jobs WHERE entity_type='model' AND NOT EXISTS (SELECT 1 FROM public.models_jumdata WHERE jm_id = entity_translation_jobs.jm_id)`, sid);
  await sql(`DELETE FROM public.entity_translation_jobs WHERE entity_type='model_detail' AND NOT EXISTS (SELECT 1 FROM public.model_details WHERE jm_id = entity_translation_jobs.jm_id)`, sid);

  // ---- Migration 0070 ----
  console.log('\n=== 0070: 禁用入队触发器 ===');
  await sql(`DROP TRIGGER IF EXISTS trg_brands_enqueue_translation ON public.brands`, sid);
  await sql(`DROP TRIGGER IF EXISTS trg_series_enqueue_translation ON public.series`, sid);
  await sql(`DROP TRIGGER IF EXISTS trg_model_details_enqueue_translation ON public.model_details`, sid);
  await sql(`DROP TRIGGER IF EXISTS trg_models_jumdata_enqueue_translation ON public.models_jumdata`, sid);

  // ---- 验证 ----
  console.log('\n=== 验证: 级联触发器 ===');
  const ct = await sql(`SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE tgname LIKE '%cascade_delete%' ORDER BY relname`, sid);
  console.log('  Result:', JSON.stringify(ct?.result || ct));

  console.log('\n=== 验证: 入队触发器已消失 ===');
  const eq = await sql(`SELECT tgname, relname FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE tgname LIKE '%enqueue_translation%' ORDER BY relname`, sid);
  console.log('  Result:', JSON.stringify(eq?.result || eq));

  console.log('\n=== 验证: 孤儿翻译剩余 ===');
  const orph = await sql(`SELECT 'brand' as et, count(*) FROM entity_translations et LEFT JOIN brands b ON et.entity_type='brand' AND et.jm_id = b.jm_id WHERE et.entity_type='brand' AND b.jm_id IS NULL UNION ALL SELECT 'series', count(*) FROM entity_translations et LEFT JOIN series s ON et.entity_type='series' AND et.jm_id = s.jm_id WHERE et.entity_type='series' AND s.jm_id IS NULL UNION ALL SELECT 'model', count(*) FROM entity_translations et LEFT JOIN models_jumdata m ON et.entity_type='model' AND et.jm_id = m.jm_id WHERE et.entity_type='model' AND m.jm_id IS NULL UNION ALL SELECT 'model_detail', count(*) FROM entity_translations et LEFT JOIN model_details md ON et.entity_type='model_detail' AND et.jm_id = md.jm_id WHERE et.entity_type='model_detail' AND md.jm_id IS NULL`, sid);
  console.log('  Result:', JSON.stringify(orph?.result || orph));

  console.log('\n✅ Phase 1 完成');
}

main().catch(e => console.error(e));
