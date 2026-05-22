// types/reporte-operativo.ts

// 1. Tipamos las llaves exactas de los estados para evitar errores tipográficos
export type EstadoEnvioClave = 
  | 'pendientes'
  | 'enTransito'
  | 'enPuntoRecoleccion'
  | 'entregados'
  | 'cancelados';

// 2. Interfaz para el desglose de envíos por estado
// Mapeamos los estados definidos en los criterios de aceptación [cite: 7]
export type DesgloseEstados = Record<EstadoEnvioClave, number>;

/* Nota: La línea anterior es equivalente a escribir:
  export interface DesgloseEstados {
    pendientes: number;
    enTransito: number;
    enPuntoRecoleccion: number;
    entregados: number;
    cancelados: number;
  }
*/

// 3. Interfaz principal del contrato de datos (Lo que devolverá Spring Boot)
export interface ReporteOperativoData {
  metricasGlobales: {
    totalViajes: number;    // Para el Criterio 1: número total de viajes [cite: 5]
    totalKilos: number;     // Para el Criterio 1: suma total de kilos [cite: 5]
  };
  desgloseEstados: DesgloseEstados; // Para el Criterio 2 [cite: 6]
}