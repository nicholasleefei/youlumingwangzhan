import fs from 'fs';
const url = 'https://pano.autohome.com.cn/car/pano/72006.xml';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0'} }).then(r => r.text()).then(t => {
  const matches = t.match(/<[^>]*colorname=[^>]*>/g);
  if(matches) matches.forEach(m => console.log(m));
});