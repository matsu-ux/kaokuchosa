// service-worker.js

// バージョン: キャッシュ更新時はここを変更します
const CACHE_NAME = 'house-survey-v2';

// オフライン用ファイルリスト
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // HTMLへのアクセスは「ネットワーク優先、だめならキャッシュ（index.html）」
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // それ以外は「キャッシュ優先」
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});