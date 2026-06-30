const CACHE_NAME = 'boothop-v1782857459936';

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
// Queued POST requests (e.g. trip actions with poor airport WiFi) are replayed
// when connectivity is restored.

const DB_NAME = 'boothop-sync-queue';
const STORE_NAME = 'requests';

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'boothop-retry-requests') {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const all = store.getAll();
    all.onsuccess = async () => {
      const entries = all.result;
      const keys = store.getAllKeys();
      keys.onsuccess = async () => {
        const keyList = keys.result;
        await Promise.allSettled(
          entries.map(async (entry, i) => {
            try {
              const res = await fetch(entry.url, {
                method: entry.method,
                headers: entry.headers,
                body: entry.body,
              });
              if (res.ok) {
                const delTx = db.transaction(STORE_NAME, 'readwrite');
                delTx.objectStore(STORE_NAME).delete(keyList[i]);
              }
            } catch { /* will retry next sync */ }
          })
        );
        resolve();
      };
    };
    all.onerror = () => reject(all.error);
  });
}

// ── Periodic Background Sync ──────────────────────────────────────────────────
// Checks for new matches / updates in background without the app open.

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

    // Only notify if there are new unread matches
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
