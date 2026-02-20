const CACHE_VERSION = "v3";
const CACHE_NAME = `herramienta-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/HERRAMIENTA/",
  "/HERRAMIENTA/index.html",
  "/HERRAMIENTA/styles.css",
  "/HERRAMIENTA/app.js",
  "/HERRAMIENTA/manifest.json",
  "/HERRAMIENTA/icon-192.png",
  "/HERRAMIENTA/icon-512.png"
];


// =====================
// INSTALL
// =====================
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn("No se pudo cachear:", asset);
        }
      }
    })
  );
});


// =====================
// ACTIVATE
// =====================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});


// =====================
// MENSAJE PARA UPDATE INMEDIATO
// =====================
self.addEventListener("message", event => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});


// =====================
// FETCH
// =====================
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // 🔹 HTML → Network First
  if (event.request.headers.get("accept")?.includes("text/html")) {
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
    return;
  }

  // 🔹 CSS / JS / Imágenes → Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });

        return response;
      });
    })
  );
});
 2 archivos adjuntos
  •  Analizado por Gmail

      
 






