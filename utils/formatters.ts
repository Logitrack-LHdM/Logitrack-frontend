import { DesgloseEstados } from '@/types/reporte-operativo';

// Adaptación de Datos para el Gráfico de charts
export const adaptarDatosParaGrafico = (desglose: DesgloseEstados) => {
    return [
        {
            estado: 'Pendientes',
            cantidad: desglose.pendientes,
            fill: 'var(--status-pending)'
        },
        {
            estado: 'En Tránsito',
            cantidad: desglose.enTransito,
            fill: 'var(--status-transit)'
        },
        {
            estado: 'En Recolección', // Texto simplificado para que encaje mejor en la leyenda del gráfico
            cantidad: desglose.enPuntoRecoleccion,
            fill: 'var(--status-pickup)'
        },
        {
            estado: 'Entregados',
            cantidad: desglose.entregados,
            fill: 'var(--status-delivered)' // Asignamos la variable exacta de tu globals.css
        },
        {
            estado: 'Cancelados',
            cantidad: desglose.cancelados,
            fill: 'var(--status-cancelled)'
        }
    ];
};