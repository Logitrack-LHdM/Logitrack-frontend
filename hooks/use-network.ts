'use client';

import { useState, useEffect } from 'react';

export function useNetwork() {
    // Inicializamos en 'true' para evitar problemas de hidratación (Hydration Mismatch) en SSR
    const [isOnline, setIsOnline] = useState<boolean>(true);

    useEffect(() => {
        // Una vez que el componente se monta en el cliente, verificamos el estado real de la red
        setIsOnline(navigator.onLine);

        // Funciones manejadoras para actualizar el estado
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Suscripción a los eventos globales del navegador
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup: removemos los listeners cuando el componente se desmonta para evitar memory leaks
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline };
}