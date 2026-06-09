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
        resolve({ status: res.statusCode, body: data.substring(0, 3000) });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 'TIMEOUT', body: '' }); });
    req.on('error', e => resolve({ status: 'ERROR', body: e.message }));
    req.write(payload);
    req.end();
  });
}

async function main() {
  // Test 4: translate_single with an active jm_id
  console.log('=== Test 4: translate_single series (active) ===');
  const r4 = await testAction('translate_single', { entityType: 'series', jmId: '28' });
  console.log('Status:', r4.status);
  console.log('Body:', r4.body);
  console.log('');

  // Test 5: run model_detail (which has pending jobs)
  console.log('=== Test 5: run model_detail (limit 1) ===');
  const r5 = await testAction('run', { limit: 1, entityType: 'model_detail' });
  console.log('Status:', r5.status);
  console.log('Body:', r5.body);
  console.log('');

  // Test 6: translate_series_deep
  console.log('=== Test 6: translate_series_deep ===');
  const r6 = await testAction('translate_series_deep', { seriesJmId: 28 });
  console.log('Status:', r6.status);
  console.log('Body:', r6.body);
  console.log('');

  // Test 7: requeue
  console.log('=== Test 7: requeue ===');
  const r7 = await testAction('requeue', { entityType: 'series', jmId: '28' });
  console.log('Status:', r7.status);
  console.log('Body:', r7.body);
}

main().catch(e => console.error(e));
