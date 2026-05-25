import { ReporteEstadoDTO } from '@/types/reporte-operativo';

// Función auxiliar para asignar los colores de globals.css según el texto del estado
const getColorPorEstado = (estado: string) => {
    const estadoNormalizado = estado.toLowerCase();
    switch (estadoNormalizado) {
        case 'pendiente':
            return 'var(--status-pending)';
        case 'en tránsito':
            return 'var(--status-transit)';
        case 'en punto de recolección':
            return 'var(--status-pickup)';
        case 'entregado':
            return 'var(--status-delivered)';
        case 'cancelado':
            return 'var(--status-cancelled)';
        default:
            return 'var(--muted)'; // Color por defecto de seguridad
    }
};

// Función auxiliar para capitalizar la primera letra (ej: "entregado" -> "Entregado")
const capitalizar = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Adaptación de Datos Dinámicos para el Gráfico de Recharts
export const adaptarDatosParaGrafico = (estados: ReporteEstadoDTO[]) => {
    if (!estados || estados.length === 0) return [];

    return estados.map((item) => ({
        // Transformamos "en punto de recolección" a algo más corto si es necesario, 
        // o simplemente lo capitalizamos para la UI
        estado: item.estado.toLowerCase() === 'en punto de recolección'
            ? 'En Recolección'
            : capitalizar(item.estado),
        cantidad: item.cantidadEnvios,
        fill: getColorPorEstado(item.estado)
    }));
};

/**
 * Formatea un objeto Date a un string en formato estricto YYYY-MM-DD.
 * Utiliza los métodos locales para evitar el desfasaje de días por la zona horaria (UTC-3).
 */
export const formatearFechaIsoLocal = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;

    const year = date.getFullYear();
    // Los meses en JavaScript van de 0 a 11, por lo que sumamos 1
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};