const url = 'https://pano.autohome.com.cn/car/pano/72006.xml';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0'} }).then(r => r.text()).then(t => {
  const match = t.match(/<scene[^>]*>([\s\S]*?)<\/scene>/g);
  if (match) {
    match.forEach(m => {
      const idMatch = m.match(/\sid="([^"]+)"/);
      const titleMatch = m.match(/title="([^"]+)"/);
      const thumbMatch = m.match(/thumburl="([^"]+)"/);
      if (idMatch && titleMatch && thumbMatch) {
        console.log(idMatch[1], titleMatch[1], thumbMatch[1]);
      }
    });
  }
});