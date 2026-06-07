/* PropPilot Service Worker
 * Strategy:
 *  - Navigations: network-first, fall back to cached shell, then /offline.
 *  - Static assets (_next/static, icons, images): stale-while-revalidate.
 *  - Never cache Supabase API / auth or POST requests.
 */
const VERSION = 'proppilot-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = '/offline';

const PRECACHE = ['/offline', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|gif|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin (Supabase, fonts CDNs handled by browser) except same-origin static.
  if (url.origin !== self.location.origin) return;

  // Never cache auth/api routes.
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/api')) return;

  // HTML navigations — network-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // Static assets — stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
