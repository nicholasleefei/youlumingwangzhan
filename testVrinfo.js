const url = 'https://www.autohome.com.cn/cars/imglist-x-x-6388-x-x-x-x-x-x-1.html';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0'} }).then(r => r.text()).then(t => {
  const match = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    const vrinfo = data.props.pageProps.SeriesPicList.vrinfo;
    console.log(JSON.stringify(vrinfo, null, 2));
  }
});