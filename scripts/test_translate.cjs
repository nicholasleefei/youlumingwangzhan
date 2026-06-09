const https = require('https');

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function main() {
  // Test translate_remaining for series (limit 1)
  console.log('=== Test: translate_remaining for series (1 row) ===');
  const result = await postJson('https://xpksqkhgfqekysbebznv.supabase.co/functions/v1/db-translate', {
    action: 'translate_remaining', entityType: 'series', limit: 1
  });
  console.log('Status:', result.status);
  console.log('Body:', result.body.slice(0, 3000));
}

main().catch(e => console.error(e));