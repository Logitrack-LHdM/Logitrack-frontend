import type { EstadoEnvio } from './index'; // Asegúrate de ajustar la ruta de importación si lo creas en un archivo separado

// === DTO PARA LA SOLICITUD (REQUEST) ===
// Payload que se enviará en el body del POST /api/public/tracking/consulta
export interface TrackingPublicoRequestDTO {
    trackingId: string; // Ej: "ENV-2026-089"
    cuit: string;       // CUIT del remitente o destinatario
}

// === DTO PARA LA RESPUESTA SANITIZADA (RESPONSE) ===
// Estructura filtrada de solo lectura. 
// EXCLUYE: idEnvio (interno DB), chofer, camión, patentes y distancias exactas.
export interface TrackingPublicoResponseDTO {
    trackingId: string;
    estadoActual: EstadoEnvio;
    origenNombre: string;  // Solo el nombre del lugar para referencia (ej: "Acopio Central")
    destinoNombre: string; // Solo el nombre del lugar para referencia (ej: "Puerto Rosario")
    fechaCreacion: string; // Formato ISO 8601
    fechaSalida?: string;  // Formato ISO 8601
    eta?: string;          // Tiempo Estimado de Llegada (Estimated Time of Arrival)
    porcentajeCompletado: number;
    ubicacionActual?: {
        latitud: number;
        longitud: number;
    };
}