// 서구 도시주택국 대시보드 - Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDDsAzrYojzbVXyaPilfF3Mj57pmat8JVU",
  authDomain: "bureau-dashboard.firebaseapp.com",
  databaseURL: "https://bureau-dashboard-default-rtdb.firebaseio.com",
  projectId: "bureau-dashboard",
  storageBucket: "bureau-dashboard.firebasestorage.app",
  messagingSenderId: "865956736976",
  appId: "1:865956736976:web:423c2add3bc57737c213d5"
});

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    const title = data.title || notification.title || '도시주택국 알림';
    const body = data.body || notification.body || '';
    const tag = data.tag || (data.instructionId ? `instruction-${data.instructionId}` : 'bureau-dashboard');
    self.registration.showNotification(title, {
      body,
      icon: data.icon || '/public/icon-500.png',
      tag,
      requireInteraction: true,
      data: { url: data.url || 'https://bureau-dashboard.web.app/' }
    });
  });
} catch (err) {
  console.warn('[SW] Firebase Messaging init failed', err);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || 'https://bureau-dashboard.web.app/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.indexOf('bureau-dashboard.web.app') >= 0 && 'focus' in client) return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});

const CACHE_NAME = 'bureau-dashboard-v83';
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

// 네트워크 + 타임아웃 헬퍼 (느린 네트워크에서 무한 대기 방지)
function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then((res) => { clearTimeout(t); resolve(res); },
                    (err) => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Firebase, Google API 등은 항상 네트워크 (캐시하지 않음)
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

  // HTML 문서(네비게이션): 네트워크 우선 + 3.5초 타임아웃 + 캐시 폴백
  // → 네트워크가 느리거나 일시 오류(502/503)여도 캐시본으로 즉시 접속 보장
  const isNav = e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html');
  if (isNav) {
    e.respondWith(
      fetchWithTimeout(e.request, 3500).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('./index.html', clone));
          return res;
        }
        // 502/503/404 등 → 캐시 폴백
        return caches.match('./index.html').then((c) => c || res);
      }).catch(() =>
        caches.match('./index.html').then((c) => c || caches.match('./'))
      )
    );
    return;
  }

  // 그 외 GET 자원: 네트워크 우선 + 캐시 폴백
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((c) => c || caches.match('./index.html')))
  );
});
