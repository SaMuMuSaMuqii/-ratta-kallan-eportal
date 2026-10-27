// Service Worker for Ratta Kallan Digital Portal
const CACHE_NAME = 'ratta-kallan-cache-v3';
const OFFLINE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  '/banners/portal-benefits-banner.svg',
  '/banners/portal-uses-guide-banner.svg',
  '/banners/voice-assistant-banner.svg',
  '/banners/emergency-schools-mandi-banner.svg',
];

const OPTIONAL_FONT_URLS = [
  '/fonts/JameelNooriNastaleeqRegular.woff2',
  '/fonts/JameelNooriNastaleeqRegular.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(OFFLINE_URLS);
      // Cache Jameel Noori Nastaleeq font files for offline village use when uploaded
      await Promise.all(
        OPTIONAL_FONT_URLS.map((fontUrl) => cache.add(fontUrl).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache font files on first fetch so they work offline forever
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            event.request.url.includes('/fonts/JameelNooriNastaleeqRegular')
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cached index for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
