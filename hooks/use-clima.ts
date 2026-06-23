import { useEffect, useRef, useState } from 'react';
import { obtenerClimaActual, type ClimaActual } from '@/lib/clima';

interface UseClimaResult {
    clima: ClimaActual | null;
    isLoading: boolean;
    error: boolean;
}

// Refrescamos el clima cada 10 minutos: no tiene sentido pegarle más seguido
// a la API y el clima no cambia tan rápido como la posición del camión.
const INTERVALO_REFRESCO_MS = 10 * 60 * 1000;

/**
 * Devuelve el clima actual para una coordenada (lat/lng).
 * Si lat o lng son undefined, no dispara ninguna petición.
 */
export function useClima(lat?: number, lng?: number): UseClimaResult {
    const [clima, setClima] = useState<ClimaActual | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    // Redondeamos las coordenadas para no re-disparar el fetch por
    // micro-variaciones de GPS del camión (ej: 3 metros de diferencia)
    const latRedondeada = lat !== undefined ? Math.round(lat * 100) / 100 : undefined;
    const lngRedondeada = lng !== undefined ? Math.round(lng * 100) / 100 : undefined;

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (latRedondeada === undefined || lngRedondeada === undefined) {
            setClima(null);
            return;
        }

        let intervalId: ReturnType<typeof setInterval>;

        const fetchClima = async () => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsLoading(true);
            setError(false);

            try {
                const resultado = await obtenerClimaActual(latRedondeada, lngRedondeada, controller.signal);
                setClima(resultado);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                console.error('Error al obtener el clima:', err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClima();
        intervalId = setInterval(fetchClima, INTERVALO_REFRESCO_MS);

        return () => {
            clearInterval(intervalId);
            abortRef.current?.abort();
        };
    }, [latRedondeada, lngRedondeada]);

    return { clima, isLoading, error };
}