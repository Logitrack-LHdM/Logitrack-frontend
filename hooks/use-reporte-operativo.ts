import { useState } from 'react';
import { api } from '@/lib/api';
import type {
    ReporteSimpleDTO,
    ReporteEstadoDTO,
    ReporteGranoDTO,
    ReporteEficienciaDTO
} from '@/types/reporte-operativo';

export interface FiltrosReporte {
    fechaInicio: string;
    fechaFin: string;
}

export interface DashboardReporteData {
    operativo: ReporteSimpleDTO | null;
    estados: ReporteEstadoDTO[];
    granos: ReporteGranoDTO[];
    eficiencia: ReporteEficienciaDTO | null;
}

export const useReporteOperativo = () => {
    // Inicializamos en null para saber que la pantalla está en estado inicial (sin buscar)
    const [data, setData] = useState<DashboardReporteData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const ejecutarBusqueda = async (filtros: FiltrosReporte) => {
        setIsLoading(true);
        setError(null);

        try {
            const { fechaInicio, fechaFin } = filtros;

            // Validación de seguridad por si acaso
            if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
                setError('Debe proporcionar ambas fechas para la búsqueda.');
                setIsLoading(false);
                return;
            }

            // Todos los endpoints consumen fechaInicio y fechaFin
            const reqOperativo = api.getReporteOperativo(fechaInicio, fechaFin);
            const reqEstados = api.getReporteEstados(fechaInicio, fechaFin);
            const reqGranos = api.getReporteGranos(fechaInicio, fechaFin);
            const reqEficiencia = api.getReporteATiempo(fechaInicio, fechaFin);

            const [operativo, estados, granos, eficiencia] = await Promise.all([
                reqOperativo,
                reqEstados,
                reqGranos,
                reqEficiencia
            ]);

            setData({ operativo, estados, granos, eficiencia });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar los reportes.');
            setData(null); // Si hay error, volvemos al estado vacío
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
};