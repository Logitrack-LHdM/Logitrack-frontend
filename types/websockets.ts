// 1. Interfaz para el Dashboard Global (Suscripción: /topic/viajes)
// Refleja exactamente la estructura JSON que envía el backend
export interface MensajeGlobalViaje {
    idEnvio: string;
    estadoNuevo: string;
    choferNombre: string;
    patenteCamion: string;
    fechaHora: string;
}

// 2. Interfaz para el historial de la Campana (REST: /api/alertas-web/pendientes)
// Estructura sugerida basada en los requerimientos de la UI para notificaciones
export interface AlertaWebDTO {
    id: number;
    mensaje: string;
    fechaCreacion: string; // Puede venir como string ISO desde Spring Boot
    leida: boolean;
    // Podríamos agregar un idEnvio si a futuro queremos que al hacer clic 
    // en la notificación te lleve al detalle del envío.
    idEnvio?: string;
}