// 원형 아이콘 - 스마트 다이어리 방식
// 원 배경색 = background_color 동일 → Chrome이 모서리 채워도 원형으로 보임
// 핵심: 로고 흰 배경을 원 색과 동일한 색으로 교체 → 흰 얼룩 없음
const sharp = require('sharp');
const path  = require('path');

const SRC    = path.join(__dirname, 'public', 'icon-500.png');
const OUT512 = path.join(__dirname, 'public', 'icon-512b.png');
const OUT192 = path.join(__dirname, 'public', 'icon-192.png');

// 원 배경색 (manifest background_color와 반드시 동일해야 함)
const BG = { r: 26, g: 58, b: 92 };  // #1a3a5c (앱 primary 네이비)

async function makeIcon(outPath, size) {
  const r = size / 2;

  // ① 원형 마스크
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
       <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
     </svg>`
  );

  // ② 로고를 원 배경색으로 flatten → 흰 배경 제거 (흰 영역이 BG색으로 대체됨)
  //    fit: cover로 꽉 채움
  const logo = await sharp(SRC)
    .flatten({ background: BG })        // 흰 배경 → 네이비로 교체
    .resize(size, size, {
      fit: 'cover',
      background: { ...BG, alpha: 1 },
    })
    .png()
    .toBuffer();

  // ③ 원형 클리핑 → 모서리 투명
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
