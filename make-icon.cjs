// 풀블리드 흰색 타일 + 로고 (Chrome은 투명 모서리를 background_color로 메워 사각형으로 만든다.
// 따라서 투명 원형은 불가능 → 처음부터 흰색으로 꽉 채워 네이비가 절대 안 나오게 함)
const sharp = require('sharp');
const path  = require('path');

const SRC    = path.join(__dirname, 'public', 'icon-500.png');
const OUT512 = path.join(__dirname, 'public', 'icon-512b.png');
const OUT192 = path.join(__dirname, 'public', 'icon-192.png');

async function makeIcon(outPath, size) {
  // ① 원본 로고의 흰 여백을 잘라내고(trim) 로고만 추출
  const trimmed = await sharp(SRC)
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // 알파 제거 → 흰 배경
    .trim()                                              // 주변 흰 여백 제거
    .toBuffer();

  // ② 로고를 캔버스의 약 82% 크기로 리사이즈 (여백 9%씩)
  const inner = Math.round(size * 0.82);
  const logo = await sharp(trimmed)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  // ③ 흰색 정사각형 캔버스 위에 로고를 중앙 배치 (풀블리드 흰색)
  await sharp({
    create: {
      width: size, height: size, channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(outPath);

  console.log('✅', outPath, `${size}x${size}`);
}

Promise.all([
  makeIcon(OUT512, 512),
  makeIcon(OUT192, 192),
]).catch(console.error);
