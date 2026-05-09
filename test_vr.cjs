const fetch = require('node-fetch');

async function testUrl(testUrl) {
  console.log('Testing', testUrl);
  try {
    const res = await fetch('http://localhost:3001/proxy/autohome/' + testUrl.replace('https://www.autohome.com.cn/', '').replace('https://car.autohome.com.cn/', ''), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      }
    });
    const text = await res.text();
    console.log('Status', res.status, 'Length', text.length);
    
    if (text.includes('__NEXT_DATA__')) {
      const start = text.indexOf('>', text.indexOf('__NEXT_DATA__')) + 1;
      const end = text.indexOf('</script>', start);
      const json = JSON.parse(text.slice(start, end).trim());
      const vrinfo = json?.props?.pageProps?.SeriesPicList?.vrinfo;
      console.log('Has NEXT_DATA. vrinfo length:', vrinfo ? vrinfo.length : 'undefined');
    } else {
      console.log('No NEXT_DATA');
      const match = text.match(/href=["'](https?:\/\/pano\.autohome\.com\.cn\/car\/ext\/\d+[^"']*)["']/i);
      console.log('Fallback ext:', match ? match[1] : 'Not found');
    }
  } catch (e) {
    console.log('Error', e.message);
  }
}

async function run() {
  await testUrl('https://www.autohome.com.cn/cars/imglist-x-x-6388-x-x-x-x-x-x-1.html');
  await testUrl('https://www.autohome.com.cn/cars/imglist-x-x-6388-x-x-x-x-x-1.html');
  await testUrl('https://car.autohome.com.cn/pic/series/6388.html');
}
run();
