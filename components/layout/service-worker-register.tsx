'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        // Verificamos si el navegador soporta Service Workers
        if ('serviceWorker' in navigator) {
            // Esperamos a que la página cargue completamente para no afectar el rendimiento inicial
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                        console.log('[Service Worker] Registrado exitosamente con alcance:', registration.scope);
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Error durante el registro:', error);
                    });
            });
        }
    }, []);

    // Este componente es puramente lógico, no dibuja nada en la pantalla
    return null;
}