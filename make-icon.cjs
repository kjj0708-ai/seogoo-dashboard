// 풀블리드 정사각형 아이콘
// Chrome PWA는 Windows에서 항상 .ico(정사각형)로 구워짐 → 처음부터 깔끔한 사각형으로 제작
const sharp = require('sharp');
const path  = require('path');

const SRC    = path.join(__dirname, 'public', 'icon-500.png');
const OUT512 = path.join(__dirname, 'public', 'icon-512b.png');
const OUT192 = path.join(__dirname, 'public', 'icon-192.png');

async function makeIcon(outPath, size) {
  // 로고를 여백 없이 정사각형에 꽉 채움 (흰 배경, 투명 없음)
  await sharp(SRC)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(outPath);

  console.log('✅', outPath, `${size}x${size}`);
}

Promise.all([
  makeIcon(OUT512, 512),
  makeIcon(OUT192, 192),
]).catch(console.error);
