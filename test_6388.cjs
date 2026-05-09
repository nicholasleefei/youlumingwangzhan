const fetch = require('node-fetch');

async function check() {
  try {
    const res = await fetch('http://localhost:3001/proxy/autohome/cars/imglist-x-x-6388-x-x-x-x-x-x-1.html?_t=' + Date.now(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept': 'text/html'
      }
    });
    const text = await res.text();
    const idx = text.indexOf('__NEXT_DATA__');
    if (idx > -1) {
      const start = text.indexOf('>', idx) + 1;
      const end = text.indexOf('</script>', start);
      const jsonStr = text.slice(start, end).trim();
      const json = JSON.parse(jsonStr);
      const pageProps = json?.props?.pageProps;
      console.log('vrinfo length:', pageProps?.SeriesPicList?.vrinfo?.length);
      console.log('vrinfo:', JSON.stringify(pageProps?.SeriesPicList?.vrinfo || [], null, 2));

      // check pano urls
      const str = JSON.stringify(json);
      const matches = str.match(/https?:\/\/[^"']*(pano|vr)[^"']*/gi);
      console.log('pano matches:', matches ? matches.slice(0, 10) : 'none');
    }
  } catch (e) {
    console.error(e);
  }
}
check();