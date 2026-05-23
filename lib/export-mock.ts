import { mockReporteOperativo } from '@/mocks/reporteOperativoMock';
import { downloadCsv } from '@/utils/csv-exporter';
import { cumplimientoMockData } from '@/mocks/cumplimientoMock'; // Usado en tu hook use-cumplimiento[cite: 8]


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
    // Simulamos latencia de red para la experiencia de usuario (Fase 1.3)
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
    const viajesCompletados = data.viajes.filter(
        (viaje: any) => viaje.estadoActual === 'ENTREGADO'
    );

    if (viajesCompletados.length === 0) {
        throw new Error('No hay viajes completados para exportar en este período.');
    }

    // 3. Mapeamos usando las claves reales y los formateadores
    const csvData = viajesCompletados.map((viaje: any) => ({
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