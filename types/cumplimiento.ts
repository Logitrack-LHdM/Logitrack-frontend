/**
 * Representa los estados posibles de un envío.
 * Alineado con las variables CSS de tu globals.css y el desglose operativo.
 */
export type EstadoEnvio =
    | 'Pendiente'
    | 'En Tránsito'
    | 'En Punto de Recolección'
    | 'Entregado'
    | 'Cancelado';

/**
 * Criterio 2: Identificación de desvíos en viajes individuales.
 * Define la estructura de cada viaje que evaluará el supervisor.
 */
export interface DetalleViajeCumplimiento {
    idEnvio: string;
    codigoSeguimiento: string;
    estado: EstadoEnvio;
    eta: string;               // Fecha y hora estimada de arribo (ISO 8601 string)
    fechaEntregaReal: string | null; // Fecha y hora real de entrega (ISO 8601 string). Puede ser null si no está completado.
    esRetrasado: boolean | null;     // true si fechaEntregaReal > eta. null si aún no se entrega.
    desvioHoras: number | null;      // Diferencia de tiempo en horas.
}

/**
 * Criterio 1 y 3: Visualización del estado de puntualidad y métricas.
 * Define los indicadores globales excluyendo viajes no completados.
 */
export interface MetricasCumplimiento {
    totalEntregados: number;      // Solo contabiliza los envíos en estado "Entregado"
    entregadosATiempo: number;
    entregadosConRetraso: number;
    porcentajeATiempo: number;    // Porcentaje global de puntualidad
    porcentajeRetraso: number;    // Porcentaje global de retrasos
}

/**
 * Contrato principal del endpoint #240.
 * Esta es la respuesta estructurada que esperamos recibir del backend.
 */
export interface RespuestaCumplimiento {
    metricas: MetricasCumplimiento;
    viajes: DetalleViajeCumplimiento[];
}