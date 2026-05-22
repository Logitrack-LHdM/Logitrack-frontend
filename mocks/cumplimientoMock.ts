import { RespuestaCumplimiento, EstadoEnvio } from '@/types/cumplimiento';

// Datos de prueba para simular la respuesta del backend (Endpoint #240)
export const cumplimientoMockData: RespuestaCumplimiento = {
    metricas: {
        totalEntregados: 5,
        entregadosATiempo: 3,
        entregadosConRetraso: 2,
        porcentajeATiempo: 60,
        porcentajeRetraso: 40,
    },
    viajes: [
        // --- ENVÍOS ENTREGADOS (Se contabilizan en métricas) ---
        {
            idEnvio: 'ENV-202605-001',
            estadoActual: 'ENTREGADO',
            fechaEstimadaLlegada: '2026-05-18T10:00:00Z',
            fechaEntregaReal: '2026-05-18T09:30:00Z',
            esRetrasado: false,
            desvioHoras: 0,
        },
        {
            idEnvio: 'ENV-202605-002',
            estadoActual: 'ENTREGADO',
            fechaEstimadaLlegada: '2026-05-19T14:00:00Z',
            fechaEntregaReal: '2026-05-19T18:30:00Z',
            esRetrasado: true,
            desvioHoras: 4.5,
        },
        {
            idEnvio: 'ENV-202605-003',
            estadoActual: 'ENTREGADO',
            fechaEstimadaLlegada: '2026-05-20T12:00:00Z',
            fechaEntregaReal: '2026-05-20T11:15:00Z',
            esRetrasado: false,
            desvioHoras: 0,
        },
        {
            idEnvio: 'ENV-202605-004',
            estadoActual: 'ENTREGADO',
            fechaEstimadaLlegada: '2026-05-21T08:00:00Z',
            fechaEntregaReal: '2026-05-22T10:00:00Z',
            esRetrasado: true,
            desvioHoras: 26, // Retraso de más de un día
        },
        {
            idEnvio: 'ENV-202605-005',
            estadoActual: 'ENTREGADO',
            fechaEstimadaLlegada: '2026-05-21T16:00:00Z',
            fechaEntregaReal: '2026-05-21T15:45:00Z',
            esRetrasado: false,
            desvioHoras: 0,
        },

        // --- ENVÍOS NO COMPLETADOS (Deberían ser ignorados por los cálculos) ---
        {
            idEnvio: 'ENV-202605-006',
            estadoActual: 'EN_REPARTO',
            fechaEstimadaLlegada: '2026-05-22T18:00:00Z',
            fechaEntregaReal: null,
            esRetrasado: null,
            desvioHoras: null,
        },
        {
            idEnvio: 'ENV-202605-007',
            estadoActual: 'PENDIENTE',
            fechaEstimadaLlegada: '2026-05-24T09:00:00Z',
            fechaEntregaReal: null,
            esRetrasado: null,
            desvioHoras: null,
        },
        {
            idEnvio: 'ENV-202605-008',
            estadoActual: 'CANCELADO',
            fechaEstimadaLlegada: '2026-05-15T12:00:00Z',
            fechaEntregaReal: null,
            esRetrasado: null,
            desvioHoras: null,
        },
        {
            idEnvio: 'ENV-202605-009',
            estadoActual: 'EN_PUNTO_DE_RECOLECCION',
            fechaEstimadaLlegada: '2026-05-23T10:00:00Z',
            fechaEntregaReal: null,
            esRetrasado: null,
            desvioHoras: null,
        }
    ]
};