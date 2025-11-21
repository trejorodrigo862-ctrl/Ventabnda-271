const CACHE_NAME = "ventas-mcbanda-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg"
];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// Fetch - network-first with cache fallback for assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // For navigation requests (HTML), try network first then cache
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          // put a copy in the cache
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // For other requests, try cache then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        // cache fetched asset (but avoid CORS-blocked responses)
        if (res && res.ok && res.type === "basic") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
