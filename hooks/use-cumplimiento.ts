import { useState, useEffect } from 'react';
import { RespuestaCumplimiento } from '@/types/cumplimiento';
import { cumplimientoMockData } from '@/mocks/cumplimientoMock';
// TODO: Descomentar la siguiente línea en la Integración #242
import { api } from '@/lib/api';

export function useCumplimiento() {
    const [data, setData] = useState<RespuestaCumplimiento | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Helper para obtener el primer y último día del mes en curso.
     * Devuelve las fechas en formato 'YYYY-MM-DD' para evitar problemas de zona horaria con el backend.
     */
    const obtenerRangoMesActual = () => {
        const hoy = new Date();
        const year = hoy.getFullYear();
        const month = hoy.getMonth(); // Los meses en JS van de 0 a 11

        // Primer día del mes actual
        const primerDia = new Date(year, month, 1);

        // Último día del mes actual (al pasar el día 0 del mes siguiente, JS retrocede al último día del actual)
        const ultimoDia = new Date(year, month + 1, 0);

        // Formateador manual a YYYY-MM-DD
        const formatFecha = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        return {
            fechaInicio: formatFecha(primerDia),
            fechaFin: formatFecha(ultimoDia)
        };
    };

    useEffect(() => {
        const fetchCumplimiento = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // // --- INICIO: MODO MOCK (Desarrollo Frontend) ---
                // // Simulamos el tiempo de respuesta de la red (ej. 1.5 segundos)
                // // Simula latencia de red para probar los Skeletons
                // await new Promise((resolve) => setTimeout(resolve, 1500));
                // setData(cumplimientoMockData);
                // // --- FIN: MODO MOCK ---

                // --- INICIO: MODO PRODUCCIÓN (Integración #242) ---
                // Cuando el endpoint en Java Spring Boot esté listo, elimina el bloque de 
                // "MODO MOCK" arriba y descomenta las siguientes líneas:

                // Calculamos las fechas del mes en curso
                const { fechaInicio, fechaFin } = obtenerRangoMesActual();

                const response = await api.getReporteCumplimiento(fechaInicio, fechaFin);
                setData(response);
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