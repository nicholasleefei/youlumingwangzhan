import { downloadInteriorVRImages } from './src/utils/vrDownloader';
import fs from 'fs';

(async () => {
  const result = await downloadInteriorVRImages(6388, 'AITO 问界', '问界M5', (progress) => {
    console.log(progress.message);
  });
  console.log('Result:', JSON.stringify(result, null, 2).slice(0, 1000));
})();