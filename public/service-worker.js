// Nombre de nuestro caché. Al cambiar este número (ej. v2), el navegador borrará el caché anterior.
const CACHE_NAME = 'logitrack-cache-v1';
const FALLBACK_HTML_URL = '/offline.html';

// FASE 1: Instalación
self.addEventListener('install', (event) => {
    // Obligamos al navegador a esperar a que esta promesa se cumpla antes de considerar instalado el Service Worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Precargando pantalla de contingencia (offline.html)');
            return cache.add(FALLBACK_HTML_URL);
        })
    );

    // Fuerza al Service Worker a tomar el control inmediatamente sin esperar a que se cierren las pestañas
    self.skipWaiting();
});

// Activación y Limpieza
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activado y listo para interceptar red.');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Si encontramos un caché que pertenece a Logitrack pero no es la versión actual, lo eliminamos.
                    if (cacheName.startsWith('logitrack-cache-') && cacheName !== CACHE_NAME) {
                        console.log(`[Service Worker] Borrando caché antiguo: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // self.clients.claim() le dice al Service Worker que tome el control de la página
    // inmediatamente, sin necesidad de que el usuario recargue el navegador.
    event.waitUntil(self.clients.claim());
});

// Intercepción de Peticiones (Estrategia Network First con Fallback a Caché)
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // 1. Ignorar peticiones que no sean GET (POST, PUT, PATCH se manejan con IndexedDB en la UI)
    // 2. Ignorar extensiones de Chrome o peticiones externas raras
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
        return;
    }

    // 3. Ignorar las llamadas a tu API de Spring Boot. 
    // No queremos cachear las respuestas de datos dinámicos a nivel de Service Worker, 
    // ya que eso lo maneja nuestra lógica de 'offline-sync.ts'
    if (request.url.includes('/api/')) {
        return;
    }

    // Estrategia: Network First
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Si hay internet y la respuesta es válida, la guardamos en caché silenciosamente
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Si el fetch falla (NO HAY INTERNET), buscamos en nuestro almacenamiento local
                console.log(`[Service Worker] Modo Offline: Sirviendo desde caché -> ${request.url}`);
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse; // Devolvemos la vista/recurso guardado
                    }

                    // Opcional: Si es una petición de navegación y no está en caché, 
                    // aquí se podría devolver una página HTML offline predeterminada.
                });
            })
    );
});