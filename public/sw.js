const CACHE_NAME = 'hiring-marketplace-v3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Silently handle Vercel analytics when offline
  if (url.pathname.includes('/_vercel/insights') || url.pathname.includes('/_vercel/speed-insights')) {
    if (!navigator.onLine) {
      event.respondWith(new Response(null, { status: 204 }));
      return;
    }
  }

  // Only intercept same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Navigation requests (HTML documents)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // If offline, serve directly from cache without attempting network fetch
        if (!navigator.onLine) {
          const cached = (await caches.match(event.request)) || (await caches.match('/')) || (await caches.match('/index.html'));
          if (cached) return cached;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, clone);
          }
          return networkResponse;
        } catch {
          const cached = (await caches.match(event.request)) || (await caches.match('/')) || (await caches.match('/index.html'));
          return cached || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static assets (JS, CSS, WASM, Workers, Fonts, Images)
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        // Only revalidate against network if browser is online
        if (navigator.onLine) {
          fetch(event.request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse);
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      // Not cached: fetch and cache if online
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, clone);
        }
        return networkResponse;
      } catch (err) {
        console.warn('[SW] Offline resource unavailable:', event.request.url);
        throw err;
      }
    })()
  );
});
