const CACHE_NAME = 'boothop-v1775289382118';
const STATIC_ASSETS = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests entirely
  if (url.origin !== self.location.origin) return;

  // Skip video requests — browser must handle HTTP Range requests natively
  // Service workers that intercept range requests break video streaming on mobile
  if (url.pathname.startsWith('/videos/')) return;

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return;

  // Images and Next.js static assets → stale-while-revalidate
  // Serve from cache instantly, refresh cache in background
  const isAsset =
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/_next/static/');

  if (isAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => cached);
        // Return cached immediately if available, otherwise wait for network
        return cached ?? networkFetch;
      })
    );
    return;
  }

  // Everything else → network first, fall back to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
