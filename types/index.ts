// === ENUMS ===
export type EstadoEnvio =
  | 'PENDIENTE'
  | 'EN_TRANSITO'
  | 'EN_PUNTO_DE_RECOLECCION'
  | 'EN_REPARTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type Prioridad = 'ALTA' | 'MEDIA' | 'BAJA';

export type TipoGrano =
  | 'SOJA'
  | 'TRIGO'
  | 'MAIZ'
  | 'GIRASOL'
  | 'SORGO'
  | 'CEBADA'
  | 'AVENA';

export type TipoEmpresa =
  | 'ACOPIO'
  | 'PUERTO'
  | 'PRODUCTOR'
  | 'EXPORTADORA'
  | 'MOLINO'
  | 'COOPERATIVA'
  | 'PRODUCTORA'
  | 'OTRA';

export type RolUsuario =
  | 'ROLE_OPERADOR'
  | 'ROLE_SUPERVISOR'
  | 'ROLE_ADMINISTRADOR'
  | 'ROLE_CHOFER';

export type TipoIncidencia =
  | 'MECANICA'
  | 'CLIMA'
  | 'TRAFICO'
  | 'CONTROLES'
  | 'OTRO';

export interface ClienteRequestDTO {
  cuit: string;
  razonSocial: string;
  tipoEmpresa: string;
  email: string;
  rucaNro?: string;
  vtoRuca?: string; // "YYYY-MM-DD"
  sede?: {
    nombreLugar: string;
    direccion: string;
    latitud?: number;
    longitud?: number;
  };
}

// Tipos de problemas comunes que el chofer podría reportar
// export type TipoIncidencia =
//   | 'MECANICO'
//   | 'CLIMATICO'
//   | 'ACCIDENTE'
//   | 'DEMORA_CARGA'
//   | 'DEMORA_DESCARGA'
//   | 'OTRO';

// Tipos de estado específicos para las alertas de incidencias
export type EstadoAlerta =
  | 'PENDIENTE'
  | 'NO_RESUELTA'
  | 'RESUELTA';

// === AUTH ===
export interface Usuario {
  id: number;
  username: string;
  rol: RolUsuario;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  token: string;
  username: string;
  rol: string;
}

// === ENTIDADES ===
export interface Empresa {
  cuit: string;
  razonSocial: string;
  tipoEmpresa: string;
}

export interface Establecimiento {
  idEstablecimiento: number;
  empresa: Empresa;
  nombreLugar: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

export interface PersonaAsociada {
  nombre: string;
  apellido: string;
}

export interface Chofer {
  idChofer: number;
  nroLicencia: string;
  personaAsociada: PersonaAsociada;
}

export interface Camion {
  patente: string;
  capacidadCargaKg: number;
  taraVacioKg: number;
}

export interface Envio {
  idEnvio: string | number;
  cpe: string;
  estadoActual: EstadoEnvio;
  prioridadIa: Prioridad;
  tipoGrano: TipoGrano;
  kgOrigen: number;
  fechaCreacion: string;
  fechaSalida?: string;
  fechaLlegada?: string;
  fechaEstimadaLlegada?: string;
  origen: Establecimiento;
  destino: Establecimiento;
  chofer: Chofer;
  camion: Camion;
  distanciaKm?: number;
}

export interface RegistroHistorial {
  idHistorial: number;
  idEnvio: string;
  idUsuario?: number | null;
  username?: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaHora: string;
}

// === DTOs ===
export interface EnvioRequestDTO {
  cpe: string;
  idOrigen: number;
  idDestino: number;
  idChofer: number;
  patenteCamion: string;
  tipoGrano: TipoGrano;
  prioridadIa?: Prioridad;
  kgOrigen: number;
}

export interface EnvioUpdateDTO {
  estado?: EstadoEnvio;
  prioridadIa?: Prioridad;
}

export interface IncidenciaDTO {
  tipoIncidencia: TipoIncidencia;
  descripcion?: string;
}

export interface UsuarioResponseDTO {
  idUsuario: number;
  username: string;
  rol: RolUsuario;
  activo: boolean;
  idPersona: number;
  nombre: string;
  apellido: string;
  cuil: string;
  telefono: string;
}

export interface UsuarioRequestDTO {
  username: string;
  password?: string; // Opcional para la edición, obligatorio para la creación
  rol: RolUsuario;
  nombre: string;
  apellido: string;
  cuil: string;
  telefono: string;
  // --- Datos de Chofer (Opcionales, solo se usan si rol == CHOFER) ---
  nroLicencia?: string;
  vtoLicencia?: string;
  vtoLinti?: string;
}

export interface BusquedaEnviosParams {
  query?: string;
  estado?: EstadoEnvio | '';
  fecha?: string;
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// === CATALOGOS ===
export interface MetadatosCatalogo {
  tiposGrano: TipoGrano[];
  estados: EstadoEnvio[];
  prioridades: Prioridad[];
}

// === CHOFER ===
export interface LugarResumen {
  nombreLugar: string;
  direccion: string;
}

export interface EnvioChofer {
  idEnvio: string;
  cpe: string;
  estadoActual: EstadoEnvio;
  tipoGrano: TipoGrano;
  kgOrigen: number;
  origen: LugarResumen;
  destino: LugarResumen;
  patenteCamion: string;
  prioridadIa: Prioridad;
}

// === MAPAS ===
// Interface para la respuesta del endpoint de polling (cada 30 seg)
export interface UbicacionTiempoRealResponse {
  idEnvio: string;
  estadoActual: EstadoEnvio; // Reutilizamos el tipo que ya tienes en tu proyecto
  latitudActual: number;
  longitudActual: number;
  porcentajeCompletado: number;
}

// Interface para la respuesta de la ruta completa (Polyline)
export interface RutaCamionResponse {
  idEnvio: string;
  // Usamos un array de tuplas de dos números.
  // El backend envía el formato GeoJSON: [longitud, latitud]
  coordinates: [number, number][];
}

// === INCIDENCIAS ===
// DTO para la visualización en el Panel del Supervisor (Lectura)
export interface AlertaListadoDTO {
  id: number;
  idEnvio: string; // Referencia al código de viaje (ej. "ENV-2026-001")
  chofer: {
    id: number;
    nombreCompleto: string; // Ya concatenado para facilitar el frontend
    telefono?: string; // Útil para que el supervisor llame directamente
  };
  tipoIncidencia: TipoIncidencia;
  descripcion: string;
  estado: EstadoAlerta;
  fechaReporte: string; // Formato ISO 8601 (UTC)
  fechaResolucion?: string; // Nulo si sigue pendiente
}

// Interfaz para la actualización de estado (Escritura)
export interface ResolverAlertaDTO {
  estado: 'RESUELTA';
  notasSupervisor?: string; // Opcional por si el supervisor quiere dejar registro de cómo se resolvió
}

// === PWA & OFFLINE SYNC ===

export type TipoAccionOffline = 'CAMBIAR_ESTADO' | 'REPORTAR_INCIDENCIA';

export interface PayloadCambioEstado {
  idEnvio: string | number;
  nuevoEstado: string; // O el tipo EstadoEnvio
}

export interface PayloadIncidencia {
  idEnvio: string | number;
  incidencia: IncidenciaDTO;
}

export interface AccionOffline {
  id: string; // Identificador único (ej. crypto.randomUUID) para evitar duplicados
  tipo: TipoAccionOffline;
  payload: PayloadCambioEstado | PayloadIncidencia;
  timestamp: number; // Fecha y hora exacta en la que el chofer presionó el botón en la ruta
}