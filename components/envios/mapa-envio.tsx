'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface MapaEnvioProps {
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    origenNombre?: string;
    destinoNombre?: string;
}

const MapaInteractivo = dynamic(
    () => import('./mapa-cliente'),
    {
        ssr: false,
        loading: () => (
            <Skeleton className="h-full w-full rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground font-medium text-sm">Cargando mapa...</span>
            </Skeleton>
        )
    }
);

// Pasamos todas las props directamente al componente dinámico
export function MapaEnvio(props: MapaEnvioProps) {
    return <MapaInteractivo {...props} />;
}