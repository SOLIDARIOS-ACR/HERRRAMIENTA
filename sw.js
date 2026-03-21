// Versiones de cache - Incrementa esto cada vez que edites tu index.html
const CACHE_VERSION = "v21"; 
const STATIC_CACHE = `herramienta-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `herramienta-dynamic-${CACHE_VERSION}`;

// Archivos estáticos indispensables
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
  // Si no tienes styles.css o app.js externos (porque todo está en el HTML), quítalos de aquí
];

// Instalación del SW
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log("SW: Pre-cacheando archivos estáticos");
        // Usamos addAll pero con un catch individual por si falta algún archivo
        return cache.addAll(STATIC_ASSETS);
      })
  );
  self.skipWaiting();
});

// Activación y limpieza de caches obsoletos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Manejo de peticiones (Fetch)
self.addEventListener("fetch", event => {
  const requestURL = new URL(event.request.url);

  // IMPORTANTE: No cachear nada que venga de Firebase (Googleapis) 
  // Esto evita que el login falle por archivos de sesión viejos
  if (requestURL.origin.includes('googleapis.com') || requestURL.origin.includes('firebase')) {
    return; 
  }

  // Solo manejar peticiones GET
  if (event.request.method !== "GET") return;

  // ESTRATEGIA: NETWORK FIRST (Red primero) para el HTML e INDEX
  // Esto asegura que si cambias el código de Firebase, el usuario lo reciba de inmediato
  if (event.request.mode === 'navigate' || requestURL.pathname.endsWith("index.html")) {
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => caches.match(event.request)) // Si no hay internet, usa el cache
    );
    return;
  }

  // ESTRATEGIA: CACHE FIRST para imágenes e iconos
  event.respondWith(
    caches.match(event.request).then(cacheRes => {
      return cacheRes || fetch(event.request).then(networkRes => {
        // Guardar en cache dinámico lo que se vaya encontrando
        return caches.open(DYNAMIC_CACHE).then(cache => {
          // Solo cachear peticiones exitosas
          if (networkRes.status === 200) {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        });
      });
    }).catch(() => {
        // Opcional: Retornar algo si falla todo
    })
  );
});

// Escuchar skipWaiting
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});






