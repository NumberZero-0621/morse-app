const CACHE_NAME = 'morse-app-dynamic-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './morse-app_favicon.ico'
];

// インストール処理
self.addEventListener('install', (event) => {
  // 待機せずにすぐに新しいSWを有効にする
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 有効化処理
self.addEventListener('activate', (event) => {
  // すぐにページをコントロール下に置く
  event.waitUntil(self.clients.claim());
});

// フェッチ処理 (Network First Strategy)
self.addEventListener('fetch', (event) => {
  // HTTP以外のリクエスト(chrome-extension://など)は無視
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    // 1. まずネットワークへ取りに行く
    fetch(event.request)
      .then((networkResponse) => {
        // 2. 成功したら、その最新データをキャッシュに保存(上書き)する
        // レスポンスは一度しか読めないのでクローンする
        if(networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        // 3. ユーザーに最新データを返す
        return networkResponse;
      })
      .catch(() => {
        // 4. オフライン(ネットワークエラー)なら、キャッシュから返す
        return caches.match(event.request);
      })
  );
});