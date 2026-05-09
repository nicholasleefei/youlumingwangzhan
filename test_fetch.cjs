const fetch = require('node-fetch');
async function test() {
  const url = 'http://localhost:3001/proxy/autohome/cars/imglist-x-x-6388-x-x-x-x-x-x-1.html?_t=' + Date.now();
  console.log('Fetching', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept': 'text/html'
      }
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Length:', text.length);
    
    if (text.includes('__NEXT_DATA__')) {
      console.log('Has NEXT_DATA');
      const start = text.indexOf('>', text.indexOf('__NEXT_DATA__')) + 1;
      const end = text.indexOf('</script>', start);
      const json = JSON.parse(text.slice(start, end).trim());
      console.log('vrinfo:', JSON.stringify(json?.props?.pageProps?.SeriesPicList?.vrinfo || [], null, 2));
    } else {
      console.log('No NEXT_DATA');
      const match = text.match(/href=["'](https?:\/\/pano\.autohome\.com\.cn\/car\/ext\/\d+[^"']*)["']/i);
      console.log('Fallback ext:', match ? match[1] : 'Not found');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
test();