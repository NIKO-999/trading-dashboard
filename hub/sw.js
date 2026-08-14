/* build: mc-17b8371fee */
/* ============================================================
   Service worker — keeps Mission Control usable when the Mac is asleep.

   Strategy by request type:
     app shell / assets  cache-first, refreshed in the background
     GET /api/*          network-first, falling back to the last good copy
     writes (PUT/POST)   never touched — they must reach the server or fail
                         loudly so the store can queue them
   ============================================================ */

// Written by scripts/gen-precache.mjs at build time: the exact list of
// content-hashed assets, and a version stamp derived from it so every new
// build evicts the previous caches automatically.
importScripts('/sw-manifest.js');

const VERSION = self.__MC_VERSION || 'mc-dev';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const API = `${VERSION}-api`;

const SHELL_URLS = self.__MC_PRECACHE || ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      // A single missing URL must not fail the whole install.
      .then((cache) => Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // writes go straight to the network
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // /api/health is the liveness probe — it must never be answered from cache,
  // or the app cannot tell a sleeping Mac from a reachable one.
  if (url.pathname === '/api/health') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API));
    return;
  }

  // HTML must be network-first. Serving a stale-then-revalidated shell caches
  // new HTML that points at freshly hashed asset filenames which were never
  // fetched — offline, that shell then asks for a bundle we do not have and
  // the app white-screens. Network-first keeps HTML and its assets in step.
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Hashed asset filenames are immutable, so cache-first is safe here.
  event.respondWith(cacheFirst(request));
});

async function navigationHandler(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await caches.match(new URL(request.url).pathname.startsWith('/trading') ? '/trading/' : '/index.html'));
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline and not cached' }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}
