const https = require('https');

async function testAction(action, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ action, ...body });
    const req = https.request({
      hostname: 'xpksqkhgfqekysbebznv.supabase.co',
      path: '/functions/v1/db-translate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data.substring(0, 2000) });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', body: '' }); });
    req.on('error', e => resolve({ status: 'ERROR', body: e.message }));
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('=== 1. status (v28) ===');
  const r1 = await testAction('status', {});
  console.log('Status:', r1.status);
  console.log(r1.body);
  console.log();

  console.log('=== 2. translate_remaining (series, limit 1) ===');
  const r2 = await testAction('translate_remaining', { entityType: 'series', limit: 1 });
  console.log('Status:', r2.status);
  console.log(r2.body);
  console.log();

  console.log('=== 3. translate_remaining (model, limit 1) ===');
  const r3 = await testAction('translate_remaining', { entityType: 'model', limit: 1 });
  console.log('Status:', r3.status);
  console.log(r3.body);
  console.log();

  console.log('=== 4. old create_all_jobs ===');
  const r4 = await testAction('create_all_jobs', {});
  console.log('Status:', r4.status);
  console.log(r4.body);
  console.log();

  console.log('=== 5. old run ===');
  const r5 = await testAction('run', { limit: 3 });
  console.log('Status:', r5.status);
  console.log(r5.body);
}

main().catch(e => console.error(e));
