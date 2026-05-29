// 원형 아이콘: 로고를 원에 꽉 채워 직접 클리핑
// 파란 배경 없음 → 흰 사각형 보이는 현상 없음
const sharp = require('sharp');
const path  = require('path');

const SRC    = path.join(__dirname, 'public', 'icon-500.png');
const OUT512 = path.join(__dirname, 'public', 'icon-512b.png');
const OUT192 = path.join(__dirname, 'public', 'icon-192.png');

async function makeIcon(outPath, size) {
  const r = size / 2;

  // ① 원형 마스크
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
       <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
     </svg>`
  );

  // ② 로고를 정사각형 크기로 딱 맞게 리사이즈 (흰 배경 유지, 꽉 채움)
  const logo = await sharp(SRC)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(size, size, { fit: 'cover' })  // 꽉 채움
    .png()
    .toBuffer();

  // ③ 원형 마스크 적용 → 로고 모서리만 잘려 원형
  await sharp(logo)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(outPath);

  console.log('✅', outPath, `${size}x${size}`);
}

Promise.all([
  makeIcon(OUT512, 512),
  makeIcon(OUT192, 192),
]).catch(console.error);
