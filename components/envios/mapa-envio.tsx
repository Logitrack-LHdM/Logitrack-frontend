'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Importamos el componente de Leaflet desactivando el Server-Side Rendering (SSR)
const MapaInteractvo = dynamic(
    () => import('./mapa-cliente'),
    {
        ssr: false,
        // Mientras la librería pesada se descarga en el cliente, mostramos tu Skeleton de la UI
        loading: () => (
            <Skeleton className="h-full w-full rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground font-medium text-sm">Cargando mapa...</span>
            </Skeleton>
        )
    }
);

export function MapaEnvio() {
    return <MapaInteractvo />;
}