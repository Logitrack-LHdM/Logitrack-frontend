import { ReporteOperativoData } from '@/types/reporte-operativo';

export const mockReporteOperativo: ReporteOperativoData = {
  metricasGlobales: {
    totalViajes: 45,        // Un volumen operativo realista de viajes activos/realizados
    totalKilos: 1250500.50  // Equivalente a ~1250 toneladas, típico en transporte de granos o insumos agro
  },
  desgloseEstados: {
    pendientes: 12,
    enTransito: 28,
    enPuntoRecoleccion: 5,
    entregados: 40,
    cancelados: 2
  }
};