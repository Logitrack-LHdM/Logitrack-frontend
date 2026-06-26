// import { mockReporteOperativo } from '@/mocks/reporteOperativoMock';
import { downloadCsv } from '@/utils/csv-exporter';
import { cumplimientoMockData } from '@/mocks/cumplimientoMock'; // Usado en tu hook use-cumplimiento[cite: 8]
import { DetalleViajeCumplimiento } from '@/types/cumplimiento'; // <-- 1. Importamos el tipo estricto
import { DashboardReporteData } from '@/hooks/use-reporte-operativo';

/**
 * Simula el endpoint de exportación del Reporte Operativo.
 * Transforma los datos dinámicos de los DTOs en un formato plano de "Sección", "Métrica" y "Valor".
 */
export const exportReporteOperativoCsvMock = async (data: DashboardReporteData | null): Promise<void> => {
    // 1. Simulamos la latencia de red para poder visualizar el spinner en la UI
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!data || !data.operativo) {
        throw new Error('No se encontraron datos operativos para exportar.');
    }

    // 2. Mapeamos la estructura de los distintos DTOs a un arreglo plano
    // Agregamos una columna "Sección" para que en Excel quede bien agrupado
    const csvData: any[] = [];

    // --- Métrica Global ---
    csvData.push({ 'Sección': 'Métricas Globales', 'Métrica': 'Total de Viajes', 'Valor': data.operativo.totalViajes });
    csvData.push({ 'Sección': 'Métricas Globales', 'Métrica': 'Kilos Transportados (kg)', 'Valor': data.operativo.totalKilos });
    csvData.push({ 'Sección': '', 'Métrica': '', 'Valor': '' }); // Fila vacía separadora

    // --- Eficiencia (Solo si hay fechas filtradas) ---
    if (data.eficiencia) {
        csvData.push({ 'Sección': 'Eficiencia', 'Métrica': 'Envíos a Tiempo', 'Valor': data.eficiencia.cantidadEnviosATiempo });
        csvData.push({ 'Sección': 'Eficiencia', 'Métrica': 'Kilos Entregados a Tiempo (kg)', 'Valor': data.eficiencia.totalKilosEnTiempo });
        csvData.push({ 'Sección': '', 'Métrica': '', 'Valor': '' });
    }

    // --- Desglose por Estados ---
    if (data.estados && data.estados.length > 0) {
        data.estados.forEach(est => {
            csvData.push({
                'Sección': 'Desglose por Estado',
                'Métrica': `Estado: ${est.estado}`,
                'Valor': `${est.cantidadEnvios} envíos (${est.kilos} kg)`
            });
        });
        csvData.push({ 'Sección': '', 'Métrica': '', 'Valor': '' });
    }

    // --- Desglose por Granos (Solo si hay fechas filtradas) ---
    if (data.granos && data.granos.length > 0) {
        data.granos.forEach(grano => {
            csvData.push({
                'Sección': 'Desglose por Grano',
                'Métrica': `Grano: ${grano.tipoGrano}`,
                'Valor': `${grano.cantidadEnvios} envíos (${grano.totalKilos} kg)`
            });
        });
    }

    // 3. Generamos un nombre de archivo dinámico con la fecha actual
    // Formato YYYY-MM-DD para mantener un estándar profesional
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `Logitrack_ReporteOperativo_${fecha}.csv`;

    // 4. Llamamos a nuestra función utilitaria para que realice la descarga
    downloadCsv(filename, csvData);
};

/**
 * Simula el endpoint de exportación del Análisis de Cumplimiento.
 * Transforma la lista de viajes en un formato tabular ideal para hojas de cálculo.
 */

// Replicamos los helpers de tabla-desvios.tsx para mantener la consistencia
const formatearFecha = (fechaIso: string | null) => {
    if (!fechaIso) return 'N/A';
    const date = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(date);
};

const formatearDesvio = (horas: number | null, esRetrasado: boolean | null) => {
    if (horas === null || esRetrasado === null) return '-';
    if (!esRetrasado || horas <= 0) return 'A tiempo';
    if (horas > 24) {
        const dias = Math.floor(horas / 24);
        const horasRestantes = Math.round(horas % 24);
        return `${dias} d ${horasRestantes} h de retraso`;
    }
    return `${Math.round(horas)} h de retraso`;
};

export const exportCumplimientoCsvMock = async (): Promise<void> => {
    // Simulamos latencia de red para la experiencia de usuario
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Obtenemos los datos mockeados
    const data = cumplimientoMockData;

    if (!data || !data.viajes || data.viajes.length === 0) {
        throw new Error('No se encontraron viajes para exportar.');
    }

    // Mapeamos la lista de viajes para aplanar la estructura y 
    // definir exactamente las columnas que el supervisor verá en Excel
    // const csvData = data.viajes.map((viaje: any) => ({
    //     'ID Viaje': viaje.id || viaje.idViaje,
    //     'Chofer asignado': viaje.chofer,
    //     'Ruta / Destino': viaje.ruta || viaje.destino,
    //     'Estado de Puntualidad': viaje.estadoPuntualidad || viaje.estado,
    //     'Minutos de Desvío': viaje.minutosDesvio || 0,
    //     'Incidencias Reportadas': viaje.incidencias ? viaje.incidencias.join(' - ') : 'Ninguna'
    // }));

    // Filtramos igual que en la UI (solo los entregados)

    // 2. Aplicamos el tipo estricto en el filtro
    const viajesCompletados = data.viajes.filter(
        (viaje: DetalleViajeCumplimiento) => viaje.estadoActual === 'ENTREGADO'
    );

    if (viajesCompletados.length === 0) {
        throw new Error('No hay viajes completados para exportar en este período.');
    }

    // 3. Aplicamos el tipo estricto en el mapeo
    const csvData = viajesCompletados.map((viaje: DetalleViajeCumplimiento) => ({
        'ID Envío': viaje.idEnvio,
        'Estado': viaje.estadoActual,
        'ETA (Estimado)': formatearFecha(viaje.fechaEstimadaLlegada),
        'Entrega Real': formatearFecha(viaje.fechaEntregaReal),
        'Desvío': formatearDesvio(viaje.desvioHoras, viaje.esRetrasado)
    }));

    // Generamos un nombre de archivo dinámico
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `Logitrack_AnalisisViajes_${fecha}.csv`;

    // Llamamos al motor de conversión
    downloadCsv(filename, csvData);
};