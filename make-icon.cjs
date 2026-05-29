// 원형 아이콘: 블루 원형 배경 + 로고
// background_color = 원 색상과 동일 → Chrome이 투명 모서리를 채워도 원형처럼 보임
const sharp = require('sharp');
const path  = require('path');

const SRC    = path.join(__dirname, 'public', 'icon-500.png');
const OUT512 = path.join(__dirname, 'public', 'icon-512b.png');
const OUT192 = path.join(__dirname, 'public', 'icon-192.png');

// 앱 테마 블루 (#2563a8)
const BG = { r: 37, g: 99, b: 168 };

async function makeIcon(outPath, size) {
  const r = size / 2;

  // ① 원형 마스크 SVG
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
       <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
     </svg>`
  );

  // ② 로고를 원 크기의 80%로 리사이즈 (흰 배경 유지)
  const inner = Math.round(size * 0.80);
  const logo = await sharp(SRC)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .trim()
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  // ③ 블루 정사각형 캔버스에 흰 배경 로고 중앙 배치
  const canvas = await sharp({
    create: {
      width: size, height: size, channels: 4,
      background: { ...BG, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();

  // ④ 원형 마스크 적용 → 모서리 투명
  await sharp(canvas)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(outPath);

  console.log('✅', outPath, `${size}x${size}`);
}

Promise.all([
  makeIcon(OUT512, 512),
  makeIcon(OUT192, 192),
]).catch(console.error);
