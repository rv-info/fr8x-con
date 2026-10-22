// FR8X Enterprise Service Worker v4.0.0
// Ultra-low latency caching, instant cache-purging for stale assets, and offline fallback.

const CACHE_NAME = 'fr8x-cache-v4.0.0';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/icon.png',
  '/favicon.ico',
  '/favicon.png',
  '/apple-icon.png',
];

// Pre-cache core app essentials on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching notice:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean up ALL old caches immediately upon activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // SECURITY & FRESHNESS: Never cache sensitive auth, admin, or API mutations
  if (
    url.pathname === '/login' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/godfather')
  ) {
    return;
  }

  // 1. Navigation Routes: Network-First ALWAYS (Never serve stale UI HTML on slow connections)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // If completely offline, try cached page or fallback
          const cached = await caches.match(request);
          if (cached) return cached;

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>FR8X Workspace</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:30px;background:#f8fafc;color:#1e293b;text-align:center}h1{font-size:18px;margin-bottom:8px}p{font-size:13px;color:#64748b}button{margin-top:16px;padding:8px 16px;background:#002b66;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer}</style></head><body><h1>⚡ Offline Mode</h1><p>FR8X Workspace could not reach the network. Please verify your connection.</p><button onclick="window.location.reload()">Retry Connection</button></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Next.js Static JS/CSS chunks & static assets: Stale-While-Revalidate with Network Update
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }
});
