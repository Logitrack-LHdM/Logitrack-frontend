import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type {
    ReporteSimpleDTO,
    ReporteEstadoDTO,
    ReporteGranoDTO,
    ReporteEficienciaDTO,
    RangoReporte
} from '@/types/reporte-operativo';

// Interfaz para los parámetros de entrada del hook
export interface FiltrosReporte {
    fechaInicio?: string;
    fechaFin?: string;
    rango?: RangoReporte;
}

// Nueva estructura que agrupa todas las respuestas para la vista
export interface DashboardReporteData {
    operativo: ReporteSimpleDTO | null;
    estados: ReporteEstadoDTO[];
    granos: ReporteGranoDTO[];
    eficiencia: ReporteEficienciaDTO | null;
}

export const useReporteOperativo = (filtros: FiltrosReporte = {}) => {
    const [data, setData] = useState<DashboardReporteData>({
        operativo: null,
        estados: [],
        granos: [],
        eficiencia: null
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReportes = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { fechaInicio, fechaFin, rango } = filtros;

                // Validación para endpoints que exigen fechas obligatorias
                const hasFechasCompletas = Boolean(fechaInicio && fechaFin);

                // Preparamos las promesas
                const reqOperativo = api.getReporteOperativo(fechaInicio, fechaFin);
                const reqEstados = api.getReporteEstados(rango);

                // Si no hay fechas, resolvemos con datos vacíos para no romper la UI ni causar un HTTP 400
                const reqGranos = hasFechasCompletas
                    ? api.getReporteGranos(fechaInicio!, fechaFin!)
                    : Promise.resolve([]);

                const reqEficiencia = hasFechasCompletas
                    ? api.getReporteATiempo(fechaInicio!, fechaFin!)
                    : Promise.resolve(null);

                // Ejecutamos todas las peticiones en paralelo para mayor velocidad
                const [operativo, estados, granos, eficiencia] = await Promise.all([
                    reqOperativo,
                    reqEstados,
                    reqGranos,
                    reqEficiencia
                ]);

                setData({ operativo, estados, granos, eficiencia });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar los reportes operativos.');
                console.error("Error en useReporteOperativo:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReportes();
    }, [filtros.fechaInicio, filtros.fechaFin, filtros.rango]);

    return { data, isLoading, error };
};