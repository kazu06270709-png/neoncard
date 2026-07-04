/* NEON CARD Service Worker */
const CACHE_NAME = 'neoncard-v1';

/* インストール時: アプリ本体とCDNライブラリをキャッシュ */
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/cropperjs@1.6.1/dist/cropper.min.js',
  'https://cdn.jsdelivr.net/npm/cropperjs@1.6.1/dist/cropper.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('precache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* fetch: ネット優先、失敗したらキャッシュ(アプリ本体は常に最新を試みる) */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then(res => {
        /* 成功したらキャッシュを更新 */
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => {
          if (req.url.startsWith('http')) cache.put(req, clone);
        });
        return res;
      })
      .catch(() => caches.match(req).then(cached => {
        if (cached) return cached;
        /* ナビゲーションリクエストならindex.htmlを返す */
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('offline', { status: 503 });
      }))
  );
});
