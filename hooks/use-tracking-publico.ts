import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import type { TrackingPublicoResponseDTO } from '@/types/tracking';

export function useTrackingPublico() {
    const [trackingId, setTrackingId] = useState('');
    const [cuit, setCuit] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trackingData, setTrackingData] = useState<TrackingPublicoResponseDTO | null>(null);

    // Referencia para el input del Tracking ID
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!trackingId || !cuit) return;

        setIsLoading(true);
        setError(null);

        try {
            const resultado = await api.consultarTrackingPublico({ trackingId, cuit });
            setTrackingData(resultado);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se encontró información para los datos ingresados');
        } finally {
            setIsLoading(false);
        }
    };

    // Función de apoyo que se usa para limpiar completamente la vista
    const resetBusqueda = () => {
        setTrackingData(null);
        setTrackingId('');
        setCuit('');
        setError(null);

        // Usamos setTimeout para esperar a que React re-renderice el DOM 
        // (mostrando el formulario nuevamente) antes de intentar hacer focus.
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    };

    return {
        // Estados
        trackingId,
        cuit,
        isLoading,
        error,
        trackingData,
        // Setters
        setTrackingId,
        setCuit,
        // Acciones
        handleSearch,
        resetBusqueda,
        inputRef
    };
}