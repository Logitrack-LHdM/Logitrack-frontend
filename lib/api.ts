import type {
  LoginRequest,
  LoginResponse,
  Envio,
  EnvioRequestDTO,
  EnvioUpdateDTO,
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
} from '@/types';

// Base URL de la API - usar variable de entorno en produccion
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// === CLIENTE HTTP ===
class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('jwt');
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
        sessionStorage.removeItem('jwt');
        sessionStorage.removeItem('usuario');

        // Evitamos recargar si, por algún motivo extraño, ya estamos en /login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error('Sesión expirada');
    }

    // if (!response.ok) {
    //   const contentType = response.headers.get('content-type');
    //   if (contentType && contentType.includes('application/json')) {
    //     const errorData = await response.json().catch(() => ({}));
    //     throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    //   } else {
    //     const errorText = await response.text().catch(() => '');
    //     throw new Error(errorText || `Error ${response.status}`);
    //   }
    // }

    // if (!response.ok) {
    //   // 1. Leemos el cuerpo de la respuesta como texto crudo primero
    //   const errorText = await response.text();
    //   let errorMessage = `Error ${response.status}`;

    //   try {
    //     // 2. Intentamos parsearlo como JSON (si el backend mandó JSON)
    //     if (errorText) {
    //       const errorData = JSON.parse(errorText);
    //       // Buscamos la propiedad message o error
    //       errorMessage = errorData.message || errorData.error || errorMessage;
    //     }
    //   } catch (e) {
    //     // 3. Si falla el parseo, significa que el backend mandó texto plano
    //     // Usamos el texto plano directamente como mensaje
    //     errorMessage = errorText || errorMessage;
    //   }

    //   throw new Error(errorMessage);
    // }

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

  // async actualizarEnvio(id: string | number, data: EnvioUpdateDTO): Promise<Envio> {
  //   return this.request<Envio>(`/envios/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(data),
  //   });
  // }

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

  // === CHOFER ===
  async getMisAsignaciones(): Promise<EnvioChofer[]> {
    return this.request<EnvioChofer[]>('/chofer/envios');
  }

  async cambiarEstadoChofer(id: string | number, nuevoEstado: string): Promise<Envio> {
    return this.request<Envio>(`/envios/${id}/estado?nuevoEstado=${nuevoEstado}`, {
      method: 'PATCH',
    });
  }

  async reportarIncidencia(id: string | number, incidencia: IncidenciaDTO): Promise<void> {
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
    return this.request<Chofer[]>('/catalogos/choferesDisponibles');
  }

  async getCamiones(): Promise<Camion[]> {
    return this.request<Camion[]>('/catalogos/camiones');
  }

  async getCamionesDisponibles(): Promise<Camion[]> {
    return this.request<Camion[]>('/catalogos/camionesDisponibles');
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
}

export const api = new ApiClient();
