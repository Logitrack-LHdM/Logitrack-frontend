// Nombre de nuestro caché. Al cambiar este número (ej. v2), el navegador borrará el caché anterior.
const CACHE_NAME = 'logitrack-cache-v1';

// FASE 1: Instalación
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando nueva versión...');

    // self.skipWaiting() fuerza a que este nuevo service worker se active inmediatamente,
    // sin esperar a que el usuario cierre todas las pestañas de la aplicación.
    self.skipWaiting();
});

// FASE 2: Activación y Limpieza
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