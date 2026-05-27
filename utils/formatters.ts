import { ReporteEstadoDTO } from '@/types/reporte-operativo';

// Función para formatear textos que vienen como ENUM (ej: EN_PUNTO_DE_RECOLECCION -> En punto de recolección)
export const formatearTextoEnum = (texto: string) => {
    if (!texto) return '';

    // 1. Quitamos guiones bajos y pasamos todo a minúsculas
    let textoLimpio = texto.replace(/_/g, ' ').toLowerCase();

    // 2. Correcciones ortográficas para recuperar las tildes que se pierden en el backend
    textoLimpio = textoLimpio.replace('transito', 'tránsito');
    textoLimpio = textoLimpio.replace('recoleccion', 'recolección');
    textoLimpio = textoLimpio.replace('maiz', 'maíz');
    // Puedes agregar más reemplazos aquí en el futuro si tienes un estado como "recepcion"

    // 3. Capitalizamos la primera letra
    return textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1);
};

// Función auxiliar para asignar los colores de globals.css
const getColorPorEstado = (estado: string) => {
    const estadoNormalizado = estado.replace(/_/g, ' ').toLowerCase();

    switch (estadoNormalizado) {
        case 'pendiente':
            return 'var(--status-pending)';
        case 'en transito':
        case 'en tránsito':
            return 'var(--status-transit)';
        case 'en punto de recoleccion':
        case 'en punto de recolección':
            return 'var(--status-pickup)';
        case 'en reparto':
            return 'var(--status-delivery)'; // Agregamos el color para En Reparto
        case 'entregado':
            return 'var(--status-delivered)';
        case 'cancelado':
            return 'var(--status-cancelled)';
        default:
            return 'var(--muted)';
    }
};

// Definimos el orden lógico del proceso logístico
const ORDEN_ESTADOS: Record<string, number> = {
    'pendiente': 1,
    'en transito': 2,
    'en tránsito': 2,
    'en punto de recoleccion': 3,
    'en punto de recolección': 3,
    'en reparto': 4,
    'entregado': 5,
    'cancelado': 6
};

// Adaptación de Datos Dinámicos para el Gráfico de Recharts con Ordenamiento
export const adaptarDatosParaGrafico = (estados: ReporteEstadoDTO[]) => {
    if (!estados || estados.length === 0) return [];

    // 1. Mapeamos y limpiamos los datos
    const datosMapeados = estados.map((item) => {
        const estadoNormalizado = item.estado.replace(/_/g, ' ').toLowerCase();

        return {
            estadoOriginal: estadoNormalizado, // Lo guardamos temporalmente para poder ordenarlo
            estado: estadoNormalizado === 'en punto de recoleccion' || estadoNormalizado === 'en punto de recolección'
                ? 'En Recolecc.'
                : formatearTextoEnum(item.estado),
            cantidad: item.cantidadEnvios,
            fill: getColorPorEstado(item.estado)
        };
    });

    // 2. Ordenamos el array resultante usando nuestro diccionario
    return datosMapeados.sort((a, b) => {
        // Si por algún motivo el backend envía un estado nuevo no mapeado, le asignamos 99 para que vaya al final
        const ordenA = ORDEN_ESTADOS[a.estadoOriginal] || 99;
        const ordenB = ORDEN_ESTADOS[b.estadoOriginal] || 99;

        return ordenA - ordenB;
    });
};

/**
 * Formatea un objeto Date a un string en formato estricto YYYY-MM-DD.
 * Utiliza los métodos locales para evitar el desfasaje de días por la zona horaria (UTC-3).
 */
export const formatearFechaIsoLocal = (date: Date | null | undefined): string | undefined => {
    if (!date) return undefined;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};