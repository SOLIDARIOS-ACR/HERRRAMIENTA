const CACHE_VERSION = "v1";
const CACHE_NAME = `herramienta-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/HERRRAMIENTA/",
  "/HERRRAMIENTA/index.html",
  "/HERRRAMIENTA/styles.css",   // si existe
  "/HERRRAMIENTA/app.js",       // si existe
  "/HERRRAMIENTA/manifest.json",
  "/HERRRAMIENTA/icon-192.png",
  "/HERRRAMIENTA/icon-512.png"
];

// INSTALL
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// FETCH - Network First
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );

});





