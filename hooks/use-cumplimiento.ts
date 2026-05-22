import { useState, useEffect } from 'react';
import { RespuestaCumplimiento } from '@/types/cumplimiento';
import { cumplimientoMockData } from '@/mocks/cumplimientoMock';

export function useCumplimiento() {
    const [data, setData] = useState<RespuestaCumplimiento | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCumplimiento = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Simulamos el tiempo de respuesta de la red (ej. 1.5 segundos)
                // para poder apreciar los Skeletons en el frontend.
                await new Promise((resolve) => setTimeout(resolve, 1500));

                // TODO (Integración #242): Reemplazar el mock por la llamada real al endpoint.
                // const response = await apiClient.get<RespuestaCumplimiento>('/api/v1/cumplimiento');
                // setData(response.data);

                setData(cumplimientoMockData);
            } catch (err) {
                setError('Ocurrió un error al cargar las métricas de cumplimiento y puntualidad.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCumplimiento();
    }, []);

    return { data, isLoading, error };
}