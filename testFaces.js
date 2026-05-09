const thumburl = '%$tileserver%/ka/pdvk/39122/thumb.jpg';
let basePath = thumburl.replace('%$tileserver%', 'https://panovr.autoimg.cn/pano/pub').replace('/thumb.jpg', '');
console.log(basePath);
const faces = ['f', 'b', 'l', 'r', 'u', 'd'];
faces.forEach(face => {
  console.log(`${basePath}/vr/pano_${face}.jpg`);
});