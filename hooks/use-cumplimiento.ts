import { useState, useEffect } from 'react';
import { RespuestaCumplimiento } from '@/types/cumplimiento';
import { cumplimientoMockData } from '@/mocks/cumplimientoMock';
// TODO: Descomentar la siguiente línea en la Integración #242
// import api from '@/lib/api'; 

export function useCumplimiento() {
    const [data, setData] = useState<RespuestaCumplimiento | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCumplimiento = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // --- INICIO: MODO MOCK (Desarrollo Frontend) ---
                // Simulamos el tiempo de respuesta de la red (ej. 1.5 segundos)
                // Simula latencia de red para probar los Skeletons
                await new Promise((resolve) => setTimeout(resolve, 1500));
                setData(cumplimientoMockData);
                // --- FIN: MODO MOCK ---

                // --- INICIO: MODO PRODUCCIÓN (Integración #242) ---
                // Cuando el endpoint en Java Spring Boot esté listo, elimina el bloque de 
                // "MODO MOCK" arriba y descomenta las siguientes líneas:
                //
                // const response = await api.get<RespuestaCumplimiento>('/api/v1/cumplimiento');
                // setData(response.data);
                // --- FIN: MODO PRODUCCIÓN ---

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