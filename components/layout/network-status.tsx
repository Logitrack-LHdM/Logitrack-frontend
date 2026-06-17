'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/hooks/use-network';
import { procesarColaOffline } from '@/lib/offline-sync';

export function NetworkStatus() {
    const { isOnline } = useNetwork();
    // Estado local para recordar si venimos de estar desconectados
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            // Registramos que nos quedamos sin internet
            setWasOffline(true);
        } else if (isOnline && wasOffline) {
            // Si ahora hay internet y ANTES no había, disparamos el toast
            toast.success('Conexión recuperada. Volviendo al modo online.', {
                duration: 4000,
            });
            setWasOffline(false); // Reseteamos la memoria

            // Disparamos la sincronización en segundo plano al recuperar la red
            procesarColaOffline().catch(err =>
                console.error('Error crítico en el proceso de sincronización en segundo plano:', err)
            );
        }
    }, [isOnline, wasOffline]);

    // Si hay conexión, ocultamos el banner
    if (isOnline) return null;

    return (
        <div className="bg-destructive text-white w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-50 animate-in slide-in-from-top-2 duration-300 shadow-md">
            <WifiOff className="h-4 w-4 animate-pulse" />
            <span>Sin conexión a internet. Trabajando en modo local.</span>
        </div>
    );
}