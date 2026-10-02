/* Service worker MissionOps (B4.1, Phase 4).
 *
 * Stratégies :
 *  - ressources statiques versionnées (/_next/static, icônes) : cache d'abord ;
 *  - navigations et requêtes RSC : réseau d'abord, repli sur le cache, puis
 *    sur la page hors ligne ;
 *  - API : réseau uniquement, sauf GET /api/terrain (réseau d'abord + cache).
 * Les écritures hors ligne ne passent pas par ici : elles vont dans IndexedDB
 * et la file de synchronisation (ADR-003).
 */
const VERSION = "v1";
const STATIC_CACHE = `missionops-static-${VERSION}`;
const PAGES_CACHE = `missionops-pages-${VERSION}`;
const PRECACHE = ["/terrain", "/offline", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("missionops-") && !key.endsWith(VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached =
      (await cache.match(request, { ignoreVary: true })) || (await caches.match(request));
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname === "/api/terrain") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  const isNavigation = request.mode === "navigate";
  const isRsc = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (isNavigation || isRsc) {
    event.respondWith(networkFirst(request, isNavigation ? "/offline" : undefined));
  }
});
