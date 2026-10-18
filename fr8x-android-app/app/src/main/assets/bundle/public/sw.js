// FR8X HyperSpeed Service Worker v2.0.0
// Ultra-low latency caching, fast timeout recovery, and offline resilience for port operators and field teams on flaky 2G/3G/4G.

const CACHE_NAME = 'fr8x-hyperspeed-v2.0';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/feeds',
  '/rates',
  '/auctions',
  '/jobs',
  '/nexus',
  '/profile',
  '/login',
  '/logo.png',
  '/icon.png',
  '/favicon.ico',
  '/favicon.png',
  '/apple-icon.png',
];

// Pre-cache core app shells on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial notice:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: fetch with strict timeout to prevent 2G/3G hanging
function fetchWithTimeout(request, timeoutMs = 2200) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Network timeout'));
    }, timeoutMs);

    fetch(request, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Google Fonts & Static Assets: Cache-First with Stale-While-Revalidate (0ms font delays)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
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
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 2. Navigation Routes: Fast 2.2s Network Timeout with Instant Cached Shell Fallback
  // Prevents mobile/tablet browser spin on flaky 2G/3G networks
  if (request.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(request, 2200)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Fast cached fallback
          const cached = await caches.match(request);
          if (cached) return cached;

          // If exact route not cached yet, serve dashboard or feeds shell
          const fallbackFeeds = await caches.match('/feeds');
          if (fallbackFeeds) return fallbackFeeds;

          const fallbackRoot = await caches.match('/dashboard');
          if (fallbackRoot) return fallbackRoot;

          const fallbackIndex = await caches.match('/');
          if (fallbackIndex) return fallbackIndex;

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>FR8X HyperSpeed Offline</title><style>body{font-family:system-ui,-apple-system,sans-serif;padding:30px;background:#f8fafc;color:#1e293b;text-align:center}h1{font-size:18px;margin-bottom:8px}p{font-size:13px;color:#64748b}button{margin-top:16px;padding:8px 16px;background:#1985a1;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer}</style></head><body><h1>⚡ Offline Mode Active</h1><p>FR8X is operating in low-latency cached mode. Saved data remains accessible.</p><button onclick="window.location.reload()">Retry Connection</button></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 3. API Read Calls: Network with 2.5s Timeout and Stale Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    // SECURITY: Never cache sensitive auth, user profile, payment, or administrative endpoints
    if (
      url.pathname === '/api/ping' ||
      url.pathname.startsWith('/api/auth/') ||
      url.pathname.startsWith('/api/user/') ||
      url.pathname.startsWith('/api/godfather/') ||
      url.pathname.startsWith('/api/payments/') ||
      url.pathname.startsWith('/api/admin/')
    ) {
      return;
    }

    event.respondWith(
      fetchWithTimeout(request, 2500)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              offline: true,
              cached: true,
              message: 'FR8X Offline / Low Bandwidth Cache Active',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        })
    );
    return;
  }
});
