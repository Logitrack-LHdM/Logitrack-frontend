'use client';

import { useState } from 'react';
import { Plus, Search, RefreshCw, ArrowLeftCircle, History, Users } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { UsuarioTable } from '@/components/admin/usuario-table';
import { UsuarioDialog } from '@/components/admin/usuario-dialog';
import { useUsuarios } from '@/hooks/use-usuarios';
import type { UsuarioResponseDTO, UsuarioRequestDTO } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

export default function UsuariosAdminPage() {
  const {
    usuarios,
    isLoading,
    crearUsuario,
    actualizarUsuario,
    desactivarUsuario,
    refrescar,
  } = useUsuarios();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioResponseDTO | null>(null);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  // Filtrado reactivo local sobre la respuesta del servidor
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termino = filtroBusqueda.toLowerCase();
    return (
      usuario.username.toLowerCase().includes(termino) ||
      usuario.nombre.toLowerCase().includes(termino) ||
      usuario.apellido.toLowerCase().includes(termino) ||
      usuario.cuil.includes(termino)
    );
  });

  const handleAbrirAlta = () => {
    setUsuarioAEditar(null);
    setDialogOpen(true);
  };

  const handleAbrirEdicion = (usuario: UsuarioResponseDTO) => {
    setUsuarioAEditar(usuario);
    setDialogOpen(true);
  };

  const handleGuardarUsuario = async (payload: UsuarioRequestDTO) => {
    try {
      if (usuarioAEditar) {
        // Ejecuta la actualización en el servidor
        await actualizarUsuario(usuarioAEditar.idUsuario, payload);
        toast.success(`Campos modificados correctamente para ${payload.username}`);
      } else {
        // Ejecuta la persistencia del nuevo registro
        await crearUsuario(payload);
        toast.success(`Usuario para ${payload.username} creado con éxito`);
      }
    } catch (error) {
      // 1. Extraemos el mensaje real proveniente del backend (api.ts)
      const mensajeBackend = error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al contactar al servidor.';

      // 2. Lo mostramos en la descripción del toast
      toast.error('No se pudo procesar la transacción', {
        description: mensajeBackend,
      });

      throw error; // Permite que el Dialog mantenga el estado de carga activo para correcciones
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">

      {/* Botón de retroceso idéntico al de tu diseño original */}
      <Link
        href="/admin/dashboard"
        className="text-[#198754] font-semibold mb-4 md:mb-6 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
      </Link>

      {/* Encabezado Principal (Réplica exacta de tu HTML) */}
      <div className="flex justify-between">
        <div className="flex items-center gap-3 mb-6 mt-2 px-2 md:px-0">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-1 text-xl md:text-2xl">Gestión de Usuarios</h4>
            <p className="text-muted-foreground text-sm m-0">
              Registro, edición y configuración de perfiles de usuario y roles asignados.
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            onClick={handleAbrirAlta}
            className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-sm gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />Registrar Usuario
          </Button>
        </div>
      </div>


      {/* Barra de herramientas y filtros rápidos */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por usuario, nombre, apellido o CUIL..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refrescar}
          className="w-full sm:w-auto border-border hover:bg-background shadow-sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar Panel
        </Button>
      </div>

      {/* Contenedor reactivo de la Grilla/Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8 text-[#2d6a4f]" />
            <span className="ml-3 text-muted-foreground font-medium">Sincronizando usuarios...</span>
          </div>
        ) : (
          <UsuarioTable
            usuarios={usuariosFiltrados}
            onDesactivar={desactivarUsuario}
            onEditar={handleAbrirEdicion}
          />
        )}
      </div>

      {/* Formulario Unificado en Modal Central */}
      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuarioAEditar={usuarioAEditar}
        onGuardar={handleGuardarUsuario}
      />
    </div>
  );
}