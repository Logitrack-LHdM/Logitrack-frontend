'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
    useEffect(() => {
        // Verificamos si el navegador soporta Service Workers
        if ('serviceWorker' in navigator) {
            // Eliminamos el window.addEventListener('load'). 
            // Al estar dentro de un useEffect, ya es seguro registrarlo directamente.
            navigator.serviceWorker
                .register('/service-worker.js')
                .then((registration) => {
                    // console.log('[Service Worker] Registrado exitosamente en:', registration.scope);
                })
                .catch((error) => {
                    console.error('[Service Worker] Error de registro:', error);
                });
        } else {
            // 3. Si no entra, lanzamos una advertencia para saber por qué
            console.warn('[Service Worker] La API no está disponible. ¿Estás usando una IP local sin HTTPS?');
        }
    }, []);

    // Este componente es puramente lógico, no dibuja nada en la pantalla
    return null;
}