'use client';

import { WifiOff } from 'lucide-react';
import { useNetwork } from '@/hooks/use-network';

export function NetworkStatus() {
    const { isOnline } = useNetwork();

    // Si hay conexión, no renderizamos nada (el componente es invisible)
    if (isOnline) return null;

    return (
        <div className="bg-destructive text-destructive-foreground w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium z-50 animate-in slide-in-from-top-2 duration-300 shadow-md">
            <WifiOff className="h-4 w-4 animate-pulse" />
            <span>Sin conexión a internet. Trabajando en modo local.</span>
        </div>
    );
}