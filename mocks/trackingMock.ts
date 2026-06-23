import type { TrackingPublicoResponseDTO } from '@/types/tracking';

// Mock 1: Un envío que se encuentra actualmente en viaje.
// Ideal para probar el mapa con una ubicación intermedia y el ETA.
export const MOCK_TRACKING_EN_TRANSITO: TrackingPublicoResponseDTO = {
    trackingId: 'ENV-2026-089',
    estadoActual: 'EN_TRANSITO',
    origenNombre: 'Acopio Central Los Girasoles',
    destinoNombre: 'Terminal Portuaria Rosario',
    fechaCreacion: '2026-05-18T08:00:00Z',
    fechaSalida: '2026-05-18T10:30:00Z',
    eta: '2026-05-19T14:00:00Z',
    porcentajeCompletado: 65,
    ubicacionActual: {
        latitud: -33.1500, // Coordenadas simuladas en ruta
        longitud: -60.8500,
    },
};

// Mock 2: Un envío que ya fue finalizado.
// Ideal para comprobar que la barra de progreso (TruckStepper) llegue al 100% y el estado final.
export const MOCK_TRACKING_ENTREGADO: TrackingPublicoResponseDTO = {
    trackingId: 'ENV-2026-090',
    estadoActual: 'ENTREGADO',
    origenNombre: 'Estancia El Ombú',
    destinoNombre: 'Molinos Agro',
    fechaCreacion: '2026-05-15T07:00:00Z',
    fechaSalida: '2026-05-15T09:00:00Z',
    eta: '2026-05-16T11:00:00Z',
    porcentajeCompletado: 100,
    ubicacionActual: {
        latitud: -32.9468, // Coordenadas simuladas en destino (Rosario)
        longitud: -60.6393,
    },
};

// Mock 3: Un envío que recién se registra y aún no sale.
// Para verificar cómo se ve la UI cuando faltan datos como la fecha de salida o la ubicación actual.
export const MOCK_TRACKING_PENDIENTE: TrackingPublicoResponseDTO = {
    trackingId: 'ENV-2026-091',
    estadoActual: 'PENDIENTE',
    origenNombre: 'Productora La Pampa',
    destinoNombre: 'Puerto Bahía Blanca',
    fechaCreacion: '2026-05-19T09:15:00Z',
    // Sin fechaSalida, eta, ni ubicacionActual porque aún no inició el viaje
    porcentajeCompletado: 0,
};