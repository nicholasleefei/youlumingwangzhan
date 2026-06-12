// Auto-fix missing translations via the db-translate Edge Function
// Calls translate_entities per entity_type x locale, then process_queue until done.
const https = require('https');

const EF_URL = 'https://xpksqkhgfqekysbebznv.supabase.co/functions/v1/db-translate';
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
if (!ANON_KEY) {
  console.error('Missing SUPABASE_ANON_KEY env var');
  process.exit(1);
}

function callEF(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(EF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, ...JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, text: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const LOCALES = ['en', 'ar', 'ru', 'th', 'ur', 'tr', 'pt-BR'];
const ENTITIES = ['brand', 'series', 'model', 'model_detail'];

async function main() {
  // 1. First, get status
  console.log('=== GETTING CURRENT STATUS ===');
  const status = await callEF({ action: 'status' });
  console.log(JSON.stringify(status, null, 2));

  if (!status.ok) {
    console.error('Status check failed:', status);
    return;
  }

  // Determine what needs translating
  const todo = [];
  for (const et of ENTITIES) {
    const s = status.stats[et];
    if (!s) continue;
    for (const loc of LOCALES) {
      const ls = s.locales[loc];
      if (!ls || ls.missing <= 0) continue;
      todo.push({ et, loc, missing: ls.missing });
    }
  }

  console.log(`\n=== TODO LIST (${todo.length} tasks) ===`);
  todo.forEach(t => console.log(`  ${t.et}/${t.loc}: ${t.missing} missing`));

  if (todo.length === 0) {
    console.log('Nothing to translate!');
    return;
  }

  // 2. Run translate_entities for each missing combo
  for (let i = 0; i < todo.length; i++) {
    const { et, loc, missing } = todo[i];
    console.log(`\n=== [${i+1}/${todo.length}] Translating ${et}/${loc} (${missing} missing) ===`);

    const result = await callEF({
      action: 'translate_entities',
      entity_type: et,
      target_locale: loc,
    });

    if (result.ok) {
      console.log(`  OK: processed=${result.processed}, skipped=${result.skipped}, errors=${(result.errors||[]).length}`);
      if (result.errors?.length) {
        result.errors.slice(0, 5).forEach(e => console.log(`    ERR: ${e}`));
      }
    } else {
      console.log(`  FAILED: ${result.error || result.text || 'unknown'}`);
    }

    // Respect rate limits
    console.log('  Waiting 3s...');
    await sleep(3000);
  }

  // 3. Process remaining queue
  console.log('\n=== PROCESSING QUEUE ===');
  let round = 0;
  while (true) {
    round++;
    const pq = await callEF({ action: 'process_queue', limit: 30 });
    console.log(`  Round ${round}: processed=${pq.processed}, remaining=${pq.remaining}`);
    if (pq.processed === 0 || pq.remaining === 0) break;
    await sleep(2000);
  }

  // 4. Final status
  console.log('\n=== FINAL STATUS ===');
  const finalStatus = await callEF({ action: 'status' });
  console.log(JSON.stringify(finalStatus, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
