import { useState, useEffect } from 'react';
import { ReporteOperativoData } from '@/types/reporte-operativo';
import { mockReporteOperativo } from '@/mocks/reporteOperativoMock'; // Asumiendo que guardaste el mock aquí

export const useReporteOperativo = () => {
    const [data, setData] = useState<ReporteOperativoData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReporte = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Simulamos una latencia de red de 1.5 segundos
                await new Promise((resolve) => setTimeout(resolve, 1500));

                // --- FUTURA INTEGRACIÓN BACKEND ---
                // Cuando Spring Boot tenga el endpoint listo, solo reemplazas la línea de abajo 
                // por tu llamada real usando la utilidad api.ts o un fetch estándar:
                // const response = await api.get('/endpoints/reporte-operativo');
                // setData(response.data);
                // ----------------------------------

                setData(mockReporteOperativo);
            } catch (err) {
                setError('Ocurrió un error al cargar el reporte operativo.');
                console.error("Error cargando el reporte:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReporte();
    }, []);

    return { data, isLoading, error };
};