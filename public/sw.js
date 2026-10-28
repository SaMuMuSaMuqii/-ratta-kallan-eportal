// Service Worker for Ratta Kallan Digital Portal — Offline Cache & Push Notifications
const CACHE_NAME = 'ratta-kallan-cache-v5';
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
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});

// Handle incoming Web Push / FCM background payloads
self.addEventListener('push', (event) => {
  let payload = {
    title: 'رتہ کلاں پورٹل — نیا پیغام',
    body: 'آپ کے لیے ایک نیا پیغام یا اطلاع موصول ہوئی ہے۔',
    tag: 'rk-push-' + Date.now(),
    data: {
      url: '/',
      type: 'new_message',
    },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      const notif = parsed.notification || parsed;
      payload = {
        title: notif.title || payload.title,
        body: notif.body || payload.body,
        tag: notif.tag || parsed.messageId || payload.tag,
        data: {
          url: '/',
          ...(parsed.data || {}),
          relatedMessageId: (parsed.data && parsed.data.relatedMessageId) || parsed.relatedMessageId || '',
          recipientMobile: (parsed.data && parsed.data.recipientMobile) || parsed.recipientMobile || '',
          type: (parsed.data && parsed.data.type) || parsed.type || 'new_message',
        },
      };
    } catch (e) {
      try {
        payload.body = event.data.text() || payload.body;
      } catch {}
    }
  }

  const options = {
    body: payload.body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: payload.tag,
    renotify: true,
    vibrate: [150, 70, 150],
    dir: 'rtl',
    lang: 'ur',
    data: payload.data,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Handle direct notification display requests from the client (e.g., when tab is in background or on mobile)
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'RK_SHOW_NOTIFICATION') return;
  const { title, body, tag, data } = event.data.payload || {};
  if (!title) return;

  const options = {
    body: body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: tag || 'rk-notif-' + Date.now(),
    renotify: true,
    vibrate: [150, 70, 150],
    dir: 'rtl',
    lang: 'ur',
    data: data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle click on any system/push notification -> focus portal and open target conversation/section
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({
              type: 'RK_NOTIFICATION_CLICK',
              data: notifData,
            });
            return;
          }
        }
        if (self.clients.openWindow) {
          const queryParams = new URLSearchParams();
          if (notifData.relatedMessageId) {
            queryParams.set('open_message', notifData.relatedMessageId);
          }
          if (notifData.recipientMobile) {
            queryParams.set('inbox', notifData.recipientMobile);
          }
          if (notifData.type) {
            queryParams.set('notif_type', notifData.type);
          }
          const qs = queryParams.toString();
          const targetUrl = qs ? `/?${qs}` : '/';
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
