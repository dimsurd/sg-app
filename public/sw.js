/*
 * Star Generation service worker.
 *
 * Deliberately small:
 *  - Static build assets (/_next/static, icons): cache-first (they are content-hashed).
 *  - Page navigations: network-first, falling back to the last cached copy of
 *    that page, then to /offline.
 *  - /api/*: NEVER cached. Hours, invoices and earnings must always be live,
 *    and personal data must not linger on a shared device after logout.
 */
const VERSION = "sg-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  // Sent on logout: forget cached pages from this user's session.
  if (event.data === "clear-pages") event.waitUntil(caches.delete(PAGE_CACHE).then(() => caches.open(PAGE_CACHE)).then((c) => c.add(OFFLINE_URL)));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always network

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa-icon/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(PAGE_CACHE);
        try {
          const res = await fetch(request);
          if (res.ok && res.type === "basic" && !res.redirected) cache.put(request, res.clone());
          return res;
        } catch {
          return (await cache.match(request)) ?? (await cache.match(OFFLINE_URL)) ?? Response.error();
        }
      })(),
    );
  }
});
