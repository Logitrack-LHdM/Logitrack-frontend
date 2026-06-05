import { useState } from 'react';
import { RespuestaCumplimiento } from '@/types/cumplimiento';
import { api } from '@/lib/api';

export interface FiltrosCumplimiento {
    fechaInicio: string;
    fechaFin: string;
}

export function useCumplimiento() {
    // Inicializamos en null para saber que la pantalla está en estado inicial
    const [data, setData] = useState<RespuestaCumplimiento | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Cambia a false por defecto
    const [error, setError] = useState<string | null>(null);

    const ejecutarBusqueda = async (filtros: FiltrosCumplimiento) => {
        setIsLoading(true);
        setError(null);

        try {
            const { fechaInicio, fechaFin } = filtros;

            // Validación de seguridad
            if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
                setError('Debe proporcionar ambas fechas para la búsqueda.');
                setIsLoading(false);
                return;
            }

            // Llamada real al backend con las fechas seleccionadas
            const response = await api.getReporteCumplimiento(fechaInicio, fechaFin);
            setData(response);

        } catch (err) {
            setError('Ocurrió un error al cargar las métricas de cumplimiento y puntualidad.');
            console.error(err);
            setData(null); // Limpiamos la data en caso de error
        } finally {
            setIsLoading(false);
        }
    };

    // Función para resetear el panel
    const limpiarDatos = () => {
        setData(null);
        setError(null);
    };

    return { data, isLoading, error, ejecutarBusqueda, limpiarDatos };
}