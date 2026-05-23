import { mockReporteOperativo } from '@/mocks/reporteOperativoMock';
import { downloadCsv } from '@/utils/csv-exporter';

/**
 * Simula el endpoint de exportación del Reporte Operativo.
 * Transforma los datos jerárquicos en un formato plano de "Métrica" y "Valor".
 */
export const exportReporteOperativoCsvMock = async (): Promise<void> => {
    // 1. Simulamos la latencia de red para poder visualizar el spinner en la UI (Fase 1.3)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Simulamos la respuesta de la base de datos obteniendo el mock actual
    const data = mockReporteOperativo;

    if (!data) {
        throw new Error('No se encontraron datos operativos para exportar.');
    }

    // 3. Mapeamos la estructura jerárquica a un arreglo plano Clave-Valor
    // Esto asegura que en Excel se vea como un resumen ejecutivo ordenado
    const csvData = [
        { 'Métrica': 'Total de Viajes', 'Valor': data.metricasGlobales.totalViajes },
        { 'Métrica': 'Kilos Transportados (kg)', 'Valor': data.metricasGlobales.totalKilos },
        { 'Métrica': '', 'Valor': '' }, // Fila vacía como separador visual
        { 'Métrica': 'Estado: Pendientes', 'Valor': data.desgloseEstados.pendientes },
        { 'Métrica': 'Estado: En Tránsito', 'Valor': data.desgloseEstados.enTransito },
        { 'Métrica': 'Estado: En Punto de Recolección', 'Valor': data.desgloseEstados.enPuntoRecoleccion },
        { 'Métrica': 'Estado: Entregados', 'Valor': data.desgloseEstados.entregados },
        { 'Métrica': 'Estado: Cancelados', 'Valor': data.desgloseEstados.cancelados }
    ];

    // 4. Generamos un nombre de archivo dinámico con la fecha actual
    // Formato YYYY-MM-DD para mantener un estándar profesional
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `Logitrack_ReporteOperativo_${fecha}.csv`;

    // 5. Llamamos a nuestra función utilitaria de la Fase 2.1 para que realice la descarga
    downloadCsv(filename, csvData);
};