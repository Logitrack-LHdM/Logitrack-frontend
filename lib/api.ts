import type {
  LoginRequest,
  LoginResponse,
  Envio,
  EnvioRequestDTO,
  EnvioUpdateDTO,
  ReasignacionViajeRequestDTO,
  IncidenciaDTO,
  BusquedaEnviosParams,
  PaginatedResponse,
  RegistroHistorial,
  Empresa,
  Establecimiento,
  Chofer,
  Camion,
  MetadatosCatalogo,
  EnvioChofer,
  UsuarioResponseDTO,
  UsuarioRequestDTO,
  UbicacionTiempoRealResponse,
  RutaCamionResponse,
  AlertaListadoDTO,
  ClienteRequestDTO,
  CartaPorteDTO,
} from '@/types';

// Agrega esta importación junto a las demás
import type {
  ReporteSimpleDTO,
  ReporteEstadoDTO,
  ReporteGranoDTO,
  ReporteEficienciaDTO
} from '@/types/reporte-operativo';

import { adaptarRutaParaLeaflet } from '@/lib/utils';
import { RespuestaCumplimiento } from '@/types/cumplimiento';
import { AlertaWebDTO } from '@/types/websockets';
import { agregarAccionACola } from '@/lib/offline-sync';
import type { TrackingPublicoRequestDTO, TrackingPublicoResponseDTO } from '@/types/tracking';
import { MOCK_TRACKING_EN_TRANSITO } from '@/mocks/trackingMock';

// Base URL de la API - usar variable de entorno en produccion
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// === CLIENTE HTTP ===
class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jwt');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // 1. Si el 401 viene del intento de login, no recargamos. 
      // Solo lanzamos el error para que el formulario lo atrape y muestre el toast rojo.
      if (endpoint === '/auth/login') {
        throw new Error('Credenciales incorrectas o usuario inactivo');
      }

      // 2. Si el 401 viene de CUALQUIER otra ruta, el token expiró. Limpiamos y redirigimos.
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt');
        localStorage.removeItem('usuario');

        // Evitamos recargar si, por algún motivo extraño, ya estamos en /login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error('Sesión expirada');
    }

    // Forma superadora de capturar errores que comnbina las dos anteriores
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      const errorText = await response.text().catch(() => '');
      let errorMessage = `Error ${response.status}`;

      const isJson = contentType?.includes('application/json') ||
        (errorText.trimStart().startsWith('{') || errorText.trimStart().startsWith('['));

      if (isJson && errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      } else {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Verificar si hay contenido para parsear
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {} as T;
  }

  // === AUTH ===
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // === ESTADO DEL SERVIDOR (RENDER COLD START) ===
  async pingServer(): Promise<void> {
    try {
      // Hacemos una petición GET simple. 
      // Render mantendrá la petición pendiente hasta que el backend en Spring Boot despierte.
      await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    } catch (error) {
      // Ignoramos errores de CORS o red prematuros; el objetivo es enviar el estímulo de red
      console.warn('Ping de inicialización finalizado.');
    }
  }

  // === ENVIOS ===
  async buscarEnvios(params: BusquedaEnviosParams): Promise<PaginatedResponse<Envio>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.fecha) searchParams.append('fecha', params.fecha); // <-- Solo enviamos 'fecha'
    searchParams.append('page', params.page.toString());
    searchParams.append('size', params.size.toString());

    return this.request<PaginatedResponse<Envio>>(
      `/envios/search?${searchParams.toString()}`
    );
  }

  async getEnvio(id: string | number): Promise<Envio> {
    return this.request<Envio>(`/envios/${id}`);
  }

  async getEnvioCompleto(id: string | number): Promise<Envio> {
    return this.request<Envio>(`/envios/buscar/${id}`);
  }

  async crearEnvio(envio: EnvioRequestDTO): Promise<Envio> {
    return this.request<Envio>('/envios', {
      method: 'POST',
      body: JSON.stringify(envio),
    });
  }

  async actualizarEnvioEdicion(id: string | number, data: EnvioRequestDTO): Promise<Envio> {
    return this.request<Envio>(`/envios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async actualizarEnvio(id: string | number, data: EnvioUpdateDTO): Promise<Envio> {
    return this.request<Envio>(`/envios/${id}/operativo`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async cancelarEnvio(id: string | number): Promise<Envio> {
    return this.request<Envio>(`/envios/${id}/cancelar`, {
      method: 'PUT',
    });
  }

  async getHistorialEnvio(id: string | number): Promise<RegistroHistorial[]> {
    return this.request<RegistroHistorial[]>(`/envios/${id}/historial`);
  }

  async getHistorialCompleto(): Promise<RegistroHistorial[]> {
    return this.request<RegistroHistorial[]>('/envios/historial-completo');
  }

  // === CARTA DE PORTE ===
  async getCartaPorte(idEnvio: string): Promise<CartaPorteDTO> {
    return this.request<CartaPorteDTO>(`/envios/${idEnvio}/carta-porte`, {
      method: 'GET',
    });
  }

  // Descarga del PDF de la Carta de Porte
  async descargarCartaPortePdf(idEnvio: string): Promise<Blob> {
    return this.descargarArchivo(`/envios/${idEnvio}/pdf-carta-porte`);
  }

  // === PORTAL PÚBLICO DE SEGUIMIENTO (MOCK) ===
  // async consultarTrackingPublico(data: TrackingPublicoRequestDTO): Promise<TrackingPublicoResponseDTO> {
  //   // 1. Simulamos latencia de red para visualizar los estados de carga en el frontend
  //   await new Promise((resolve) => setTimeout(resolve, 800));

  //   // 2. LÓGICA DE VERIFICACIÓN ESTRICTA (#620)
  //   // Definimos credenciales hardcodeadas que coincidan con nuestro mock para pruebas locales.
  //   const trackingIdValido = MOCK_TRACKING_EN_TRANSITO.trackingId; // 'ENV-2026-089'
  //   const cuitValido = '30-12345678-9'; // CUIT de prueba

  //   if (data.trackingId === trackingIdValido && data.cuit === cuitValido) {
  //     return MOCK_TRACKING_EN_TRANSITO;
  //   }

  //   // 3. MANEJO DE ERRORES DE PRIVACIDAD (#623)
  //   // Si el ID no existe o el CUIT no coincide, lanzamos un error genérico idéntico 
  //   // para evitar ataques de enumeración.
  //   throw new Error('No se encontró información para los datos ingresados');
  // }

  // === PORTAL PÚBLICO DE SEGUIMIENTO ===
  async consultarTrackingPublico(data: TrackingPublicoRequestDTO): Promise<TrackingPublicoResponseDTO> {
    // Hacemos un POST al endpoint público enviando el Tracking ID y el CUIT en el body
    return this.request<TrackingPublicoResponseDTO>('/public/tracking/consulta', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === RASTREO TIEMPO REAL DE ENVIO===
  /**
   * Obtiene la ruta completa planificada para un envío y la 
   * formatea para ser usada directamente en react-leaflet.
   * Se añade soporte opcional para AbortSignal.
   */
  async getRutaPlanificada(idEnvio: string, signal?: AbortSignal): Promise<[number, number][]> {
    try {
      const response = await this.request<RutaCamionResponse>(`/envios/${idEnvio}/ruta-completa`, { signal });

      // Transformamos inmediatamente la respuesta para que el frontend no 
      // lidie con el formato GeoJSON [longitud, latitud]
      return adaptarRutaParaLeaflet(response.coordinates);
    } catch (error) {
      // Si la petición fue cancelada intencionalmente, ignoramos el error de manera silenciosa
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      console.error(`Error al obtener la ruta para el envío ${idEnvio}:`, error);
      return [];
    }
  }

  // Obtiene la ubicación actual del camión.
  // Se añade soporte opcional para AbortSignal.
  async getUbicacionTiempoReal(idEnvio: string, signal?: AbortSignal): Promise<UbicacionTiempoRealResponse> {
    return this.request<UbicacionTiempoRealResponse>(`/envios/${idEnvio}/tracking`, { signal });
  }

  // === CHOFER ===
  async getMisAsignaciones(): Promise<EnvioChofer[]> {
    return this.request<EnvioChofer[]>('/chofer/envios');
  }

  async cambiarEstadoChofer(
    id: string | number,
    nuevoEstado: string,
    forceNetwork: boolean = false // NUEVO: Bandera para la sincronización en segundo plano
  ): Promise<Envio & { _offlineQueued?: boolean }> {

    // Intercepción Offline
    if (!forceNetwork && typeof navigator !== 'undefined' && !navigator.onLine) {
      await agregarAccionACola('CAMBIAR_ESTADO', { idEnvio: id, nuevoEstado });

      // Devolvemos una estructura mínima simulada para no romper la UI.
      // La bandera '_offlineQueued' le indicará a nuestro hook de React (Fase 4.2)
      // que la acción no llegó al backend, sino que se guardó localmente.
      return {
        idEnvio: id,
        estadoActual: nuevoEstado as any,
        _offlineQueued: true,
      } as Envio & { _offlineQueued?: boolean };
    }

    return this.request<Envio>(`/envios/${id}/estado?nuevoEstado=${nuevoEstado}`, {
      method: 'PATCH',
    });
  }

  async reportarIncidencia(
    id: string | number,
    incidencia: IncidenciaDTO,
    forceNetwork: boolean = false
  ): Promise<{ _offlineQueued?: boolean } | void> {

    // Intercepción Offline
    if (!forceNetwork && typeof navigator !== 'undefined' && !navigator.onLine) {
      await agregarAccionACola('REPORTAR_INCIDENCIA', { idEnvio: id, incidencia });
      return { _offlineQueued: true };
    }

    return this.request<void>(`/envios/${id}/incidencias`, {
      method: 'POST',
      body: JSON.stringify(incidencia),
    });
  }

  // === CATALOGOS ===
  async getMetadatos(): Promise<MetadatosCatalogo> {
    return this.request<MetadatosCatalogo>('/catalogos/metadatos');
  }

  async getEmpresas(): Promise<Empresa[]> {
    return this.request<Empresa[]>('/catalogos/empresas');
  }

  async getEstablecimientos(cuit: string): Promise<Establecimiento[]> {
    return this.request<Establecimiento[]>(`/catalogos/establecimientos?cuit=${cuit}`);
  }

  async getChoferes(): Promise<Chofer[]> {
    return this.request<Chofer[]>('/catalogos/choferes');
  }

  async getChoferesDisponibles(): Promise<Chofer[]> {
    return this.request<Chofer[]>('/catalogos/choferes/disponibles');
  }

  async getCamiones(): Promise<Camion[]> {
    return this.request<Camion[]>('/catalogos/camiones');
  }

  async getCamionesDisponibles(): Promise<Camion[]> {
    return this.request<Camion[]>('/catalogos/camiones/disponibles');
  }

  // Envíos pendientes de asignación (sin chofer ni camión)
  async getEnviosSinAsignar(): Promise<Envio[]> {
    return this.request<Envio[]>('/envios/sin-asignar');
  }

  // Asignar chofer y camión juntos
  async asignarTransporte(
    idEnvio: string,
    data: { idChofer: number; patenteCamion: string }
  ): Promise<Envio> {
    return this.request<Envio>(`/envios/${idEnvio}/asignar-transporte`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // US 67 — Reasignación de viajes (#592)
  // PUT /api/envios/{idEnvio}/reasignar (backend Tarea #586).
  // A diferencia de asignarTransporte, este endpoint además:
  //   - libera el chofer/camión anterior (#587),
  //   - desvincula los bloqueos de fatiga del chofer viejo para este viaje (#588),
  //   - registra el evento de auditoría con el motivo ingresado (#589).
  // El endpoint responde 200 OK con body vacío.
  async reasignarViaje(
    idEnvio: string,
    data: ReasignacionViajeRequestDTO
  ): Promise<void> {
    return this.request<void>(`/envios/${idEnvio}/reasignar`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async buscarEnviosAsignadosAvanzado(params: BusquedaEnviosParams): Promise<PaginatedResponse<Envio>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.estado) searchParams.append('estado', params.estado);
    if (params.fecha) searchParams.append('fecha', params.fecha);
    searchParams.append('page', params.page.toString());
    searchParams.append('size', params.size.toString());
    searchParams.append('asignado', 'true');   // filtro para solo asignados

    return this.request<PaginatedResponse<Envio>>(
      `/envios/search?${searchParams.toString()}`
    );
  }

  // === ADMIN ===
  async listarUsuarios(): Promise<UsuarioResponseDTO[]> {
    const usuarios = await this.request<any[]>('/admin/usuarios');
    // Agregamos el prefijo ROLE_ para que el frontend lo reconozca
    return usuarios.map(u => ({ ...u, rol: `ROLE_${u.rol}` as any }));
  }

  async crearUsuario(data: UsuarioRequestDTO): Promise<UsuarioResponseDTO> {
    // Quitamos el prefijo ROLE_ antes de enviarlo a Spring Boot
    const payload = { ...data, rol: data.rol.replace('ROLE_', '') };

    const res = await this.request<any>('/admin/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Volvemos a agregar el prefijo a la respuesta
    return { ...res, rol: `ROLE_${res.rol}` as any };
  }

  async actualizarUsuario(id: number, data: UsuarioRequestDTO): Promise<UsuarioResponseDTO> {
    // Quitamos el prefijo ROLE_ antes de enviarlo
    const payload = { ...data, rol: data.rol.replace('ROLE_', '') };

    const res = await this.request<any>(`/admin/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return { ...res, rol: `ROLE_${res.rol}` as any };
  }

  async deshabilitarUsuario(id: number): Promise<void> {
    return this.request<void>(`/admin/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  async resetearPassword(id: number, nuevaPassword: string): Promise<void> {
    return this.request<void>(`/admin/usuarios/${id}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ nuevaPassword }),
    });
  }

  // === REPORTES ===
  // Constante para simular el histórico completo (1 de Enero del año 2000)
  private readonly FECHA_HISTORICO_INICIO = '2000-01-01';

  // Helper interno para obtener la fecha de hoy en formato YYYY-MM-DD (hora de Argentina)
  private getFechaHoyIso(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getReporteOperativo(fechaInicio?: string, fechaFin?: string): Promise<ReporteSimpleDTO> {
    const searchParams = new URLSearchParams();
    // Si no vienen fechas, asumimos histórico por defecto para la URL
    searchParams.append('fechaInicio', fechaInicio || this.FECHA_HISTORICO_INICIO);
    searchParams.append('fechaFin', fechaFin || this.getFechaHoyIso());

    return this.request<ReporteSimpleDTO>(`/reportes/operativo?${searchParams.toString()}`);
  }

  async getReporteEstados(fechaInicio: string, fechaFin: string): Promise<ReporteEstadoDTO[]> {
    // El backend ahora se adaptará para recibir fechas también en este endpoint
    return this.request<ReporteEstadoDTO[]>(`/reportes/estadosPorFechas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }

  async getReporteGranos(fechaInicio: string, fechaFin: string): Promise<ReporteGranoDTO[]> {
    return this.request<ReporteGranoDTO[]>(`/reportes/granos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }

  async getReporteATiempo(fechaInicio: string, fechaFin: string): Promise<ReporteEficienciaDTO> {
    return this.request<ReporteEficienciaDTO>(`/reportes/a-tiempo?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }

  async getReporteCumplimiento(fechaInicio: string, fechaFin: string): Promise<RespuestaCumplimiento> {
    return this.request<RespuestaCumplimiento>(`/reportes/cumplimiento?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }


  // === EXPORTACIONES (Archivos) ===
  async descargarArchivo(endpoint: string): Promise<Blob> {
    const token = this.getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error al descargar el archivo: ${response.statusText}`);
    }

    // Retornamos directamente el blob (el archivo crudo)
    return response.blob();
  }

  // === CLIENTES ===
  async crearCliente(data: ClienteRequestDTO): Promise<Empresa> {
    return this.request<Empresa>('/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listarClientes(): Promise<Empresa[]> {
    return this.request<Empresa[]>('/clientes');
  }

  // === ALERTAS (US 33 - SUPERVISOR) ===
  async getAlertas(): Promise<AlertaListadoDTO[]> {
    // Hace un GET al endpoint protegido del supervisor
    return this.request<AlertaListadoDTO[]>('/incidencias/alertas');
  }

  async resolverAlerta(idAlerta: number, notasSupervisor?: string): Promise<void> {
    // Hace un PATCH para cambiar el estado a RESUELTA
    // Enviamos el cuerpo (dto) si hay notas, o un objeto vacío/solo con la nota
    return this.request<void>(`/incidencias/${idAlerta}/resolver`, {
      method: 'PATCH',
      body: JSON.stringify({ notasSupervisor }),
    });
  }
  // === CAMPANA DE NOTIFICACIONES (WEBSOCKETS REST COMPLEMENTARIOS) ===

  // GET /api/alertas-web/pendientes
  async getAlertasWebPendientes(): Promise<AlertaWebDTO[]> {
    return this.request<AlertaWebDTO[]>('/alertas-web/pendientes');
  }

  // PATCH /api/alertas-web/{id}/leer
  async marcarAlertaWebComoLeida(idAlerta: number): Promise<void> {
    // Como el endpoint retorna 204 No Content, no esperamos un JSON de respuesta
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/alertas-web/${idAlerta}/leer`, {
      method: 'PATCH',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error al marcar alerta como leída: ${response.status}`);
    }
  }
}

export const api = new ApiClient();