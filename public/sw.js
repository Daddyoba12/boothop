const CACHE_NAME = 'boothop-v1775872080984';

// Pre-cache these on install so key pages and branding assets work offline
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/boothop.png',
  '/images/logo.jpg',
  '/how-it-works',
  '/about',
  '/pricing',
  '/trust-safety',
  '/journeys',
  '/login',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // addAll fails silently per-item — use Promise.allSettled so one
      // missing asset doesn't block the entire install
      Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)))
    )
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

  // Skip cross-origin (Google Maps, Stripe, Resend, Supabase etc.)
  if (url.origin !== self.location.origin) return;

  // Skip video requests — browser must handle HTTP Range requests natively
  if (url.pathname.startsWith('/videos/')) return;

  // Skip API routes — always live data
  if (url.pathname.startsWith('/api/')) return;

  // Images and Next.js compiled assets → stale-while-revalidate
  const isAsset =
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/_next/static/');

  if (isAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        // Always attempt a fresh fetch and update cache in background
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res.ok && res.status < 300) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => null);
        // Serve cache immediately if available; otherwise await network
        return cached ?? await networkFetch ?? new Response('', { status: 503 });
      })
    );
    return;
  }

  // HTML pages → network first, fall back to cache
  // Next.js streaming/RSC responses can't be cloned — wrap in try-catch
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && res.status < 300) {
          try {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          } catch (_) {
            // Streaming response — skip caching, still serve to browser
          }
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
