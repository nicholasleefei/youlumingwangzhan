import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const messagesDir = 'src/i18n/messages';

// 获取所有 JSON 文件
const files = await readdir(messagesDir);
const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'zh-CN.json');

for (const file of jsonFiles) {
  const filePath = path.join(messagesDir, file);
  const content = await readFile(filePath, 'utf8');
  
  // 替换 hero.title 行
  const updatedContent = content.replace(
    /"hero\.title":\s*"[^"]+"/,
    '"hero.title": "Drive the Future with ChinaAuto"'
  );
  
  if (content !== updatedContent) {
    await writeFile(filePath, updatedContent, 'utf8');
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No change needed: ${file}`);
  }
}

console.log('Done!');
