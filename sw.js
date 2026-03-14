// Versiones de cache
const CACHE_VERSION = "v2";
const STATIC_CACHE = `herramienta-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `herramienta-dynamic-${CACHE_VERSION}`;

// Archivos estáticos siempre cacheados
const STATIC_ASSETS = [
  "/HERRAMIENTA-/styles.css",
  "/HERRAMIENTA-/app.js",
  "/HERRAMIENTA-/manifest.json",
  "/HERRAMIENTA-/icon-192.png",
  "/HERRAMIENTA-/icon-512.png"
];

// Instalación del SW y cache de assets seguros
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación y limpieza de caches viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Manejo de fetch
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestURL = new URL(event.request.url);

  if (requestURL.pathname === "/HERRAMIENTA-/" || requestURL.pathname.endsWith("index.html")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.open(DYNAMIC_CACHE).then(cache => cache.match(event.request));
        })
    );
    return;
  }

  if (requestURL.pathname.endsWith("manifest.json")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});








