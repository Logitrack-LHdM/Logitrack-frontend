// types/reporte-operativo.ts

// DTO para GET /api/reportes/operativo
export interface ReporteSimpleDTO {
  totalViajes: number;
  totalKilos: number;
}

// DTO para GET /api/reportes/estados
export interface ReporteEstadoDTO {
  estado: string;
  cantidadEnvios: number;
  kilos: number;
}

// DTO para GET /api/reportes/granos
export interface ReporteGranoDTO {
  tipoGrano: string;
  cantidadEnvios: number;
  totalKilos: number;
}

// DTO para GET /api/reportes/a-tiempo
export interface ReporteEficienciaDTO {
  cantidadEnviosATiempo: number;
  totalKilosEnTiempo: number;
}

// Opcional: Tipado estricto para los parámetros de rango de la API
export type RangoReporte = 'ultimos7dias' | 'ultimos30dias' | 'ultimos90dias';