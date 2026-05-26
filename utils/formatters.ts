import { ReporteEstadoDTO } from '@/types/reporte-operativo';

// Función para formatear textos que vienen como ENUM (ej: EN_PUNTO_DE_RECOLECCION -> En punto de recolección)
export const formatearTextoEnum = (texto: string) => {
    if (!texto) return '';
    const textoLimpio = texto.replace(/_/g, ' ').toLowerCase();
    return textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1);
};

// Función auxiliar para asignar los colores de globals.css
const getColorPorEstado = (estado: string) => {
    // Normalizamos quitando guiones bajos y pasando a minúsculas
    const estadoNormalizado = estado.replace(/_/g, ' ').toLowerCase();

    // Contemplamos opciones con y sin tilde por seguridad
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

// Adaptación de Datos Dinámicos para el Gráfico de Recharts
export const adaptarDatosParaGrafico = (estados: ReporteEstadoDTO[]) => {
    if (!estados || estados.length === 0) return [];

    return estados.map((item) => {
        const estadoNormalizado = item.estado.replace(/_/g, ' ').toLowerCase();
        return {
            estado: estadoNormalizado === 'en punto de recoleccion' || estadoNormalizado === 'en punto de recolección'
                ? 'En Recolección' // Versión corta exclusiva para el eje del gráfico
                : formatearTextoEnum(item.estado),
            cantidad: item.cantidadEnvios,
            fill: getColorPorEstado(item.estado)
        };
    });
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