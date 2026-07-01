const CACHE_NAME = 'boothop-v1782907023076';

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

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/videos/')) return;
  if (url.pathname.startsWith('/api/')) return;

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
            if (res.ok && res.status < 300) cache.put(event.request, res.clone());
            return res;
          })
          .catch(() => null);
        return cached ?? await networkFetch ?? new Response('', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && res.status < 300) {
          try {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          } catch (_) {}
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let payload = { title: 'BootHop', body: 'You have a new update.', url: '/dashboard' };
  try {
    const data = event.data?.json();
    if (data) payload = { ...payload, ...data };
  } catch { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      data: { url: payload.url },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
// When connectivity returns, the client posts a message to trigger a refresh.

self.addEventListener('sync', (event) => {
  if (event.tag === 'boothop-retry-requests') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((windowClients) => {
        windowClients.forEach((client) => client.postMessage({ type: 'SYNC_RECONNECTED' }));
      })
    );
  }
});

// ── Periodic Background Sync ──────────────────────────────────────────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'boothop-check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  try {
    const res = await fetch('/api/dashboard?background=1');
    if (!res.ok) return;
    const data = await res.json();
    if (data.newMatchCount && data.newMatchCount > 0) {
      await self.registration.showNotification('BootHop', {
        body: `You have ${data.newMatchCount} new match${data.newMatchCount > 1 ? 'es' : ''}.`,
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        data: { url: '/dashboard' },
      });
    }
  } catch { /* graceful */ }
}
