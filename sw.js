// Versiones de cache
const CACHE_VERSION = "v3";
const STATIC_CACHE = `herramienta-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `herramienta-dynamic-${CACHE_VERSION}`;

// Archivos estáticos - USAMOS RUTAS RELATIVAS './'
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalación del SW
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log("Caching assets...");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error("Error en cache.addAll:", err))
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

// Escuchar el mensaje 'skipWaiting' (Para que el botón 'Actualizar' del HTML funcione)
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Manejo de fetch
self.addEventListener("fetch", event => {
  // Solo manejar peticiones GET
  if (event.request.method !== "GET") return;

  const requestURL = new URL(event.request.url);

  // Estrategia para el HTML: Network First (Red primero, luego cache)
  if (requestURL.pathname.endsWith("/") || requestURL.pathname.endsWith("index.html")) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Estrategia para el resto: Cache First (Cache primero, luego red)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        // Opcional: Guardar en dynamic cache lo que no estaba en static
        return caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => {
      // Si todo falla (offline y no en cache), podrías retornar una imagen o página offline aquí
    })
  );
});








