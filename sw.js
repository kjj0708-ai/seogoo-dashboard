// 서구 도시주택국 대시보드 - Service Worker
const CACHE_NAME = 'bureau-dashboard-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './public/icon-500.png',
  './public/icon1024.png',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS).catch((err) => console.warn('[SW] precache 일부 실패', err))
    )
  );
});

// 활성화: 옛 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch 전략: Firebase/Google API는 항상 네트워크, 그 외는 네트워크 우선 + 캐시 폴백
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Firebase, Google API, Calendar 등은 항상 네트워크 (캐시하지 않음)
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firebase') ||
    e.request.method !== 'GET'
  ) {
    return; // 기본 네트워크 처리
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 정상 응답이면 캐시에 저장
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((c) => c || caches.match('./index.html')))
  );
});
