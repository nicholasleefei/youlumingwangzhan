const fs = require('fs');
let text = fs.readFileSync('src/utils/vrDownloader.ts', 'utf8');
text = text.replace(/\\`/g, '`');
text = text.replace(/\\\$/g, '$');
fs.writeFileSync('src/utils/vrDownloader.ts', text);
console.log('Fixed escaping in vrDownloader.ts');