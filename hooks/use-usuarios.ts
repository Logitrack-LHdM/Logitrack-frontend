'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { UsuarioResponseDTO, UsuarioRequestDTO } from '@/types';
import { toast } from 'sonner';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Leer todos los usuarios del sistema
  const cargarUsuarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listarUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al obtener la lista de usuarios:', error);
      toast.error('No se pudo conectar con el servidor', {
        description: 'No se lograron sincronizar los usuarios activos.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Crear una nueva cuenta
  const crearUsuario = useCallback(async (nuevoUsuario: UsuarioRequestDTO) => {
    try {
      const creado = await api.crearUsuario(nuevoUsuario);
      // Actualizamos el estado agregando el nuevo usuario al listado de forma reactiva
      setUsuarios((prev) => [...prev, creado]);
      return creado;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error; // Delegamos el manejo del error (ej. mostrar alertas en el formulario)
    }
  }, []);

  // 3. Modificar datos de un usuario existente
  const actualizarUsuario = useCallback(async (id: number, datosActualizados: UsuarioRequestDTO) => {
    try {
      const actualizado = await api.actualizarUsuario(id, datosActualizados);
      // Reemplazamos el usuario modificado en el arreglo local preservando el orden
      setUsuarios((prev) =>
        prev.map((u) => (u.idUsuario === id ? actualizado : u))
      );
      return actualizado;
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      throw error;
    }
  }, []);

  // 4. Desactivación o borrado lógico (Soft Delete)
  const desactivarUsuario = useCallback(async (id: number) => {
    try {
      await api.deshabilitarUsuario(id);
      // Modificamos el flag activo localmente para que la tabla se redibuje al instante
      setUsuarios((prev) =>
        prev.map((u) => (u.idUsuario === id ? { ...u, activo: false } : u))
      );
    } catch (error) {
      console.error('Error al deshabilitar el acceso del usuario:', error);
      throw error;
    }
  }, []);

  // 5. Restablecer credenciales de acceso
  const resetearPassword = useCallback(async (id: number, nuevaPassword: string) => {
    try {
      await api.resetearPassword(id, nuevaPassword);
      toast.success('Contraseña restablecida correctamente');
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      toast.error('No se pudo actualizar la credencial de acceso');
      throw error;
    }
  }, []);

  // Efecto para la carga inicial automática al montar el componente/pantalla
  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  return {
    usuarios,
    isLoading,
    refrescar: cargarUsuarios,
    crearUsuario,
    actualizarUsuario,
    desactivarUsuario,
    resetearPassword,
  };
}