'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EnvioChofer, IncidenciaDTO } from '@/types';
import { api } from '@/lib/api';
import { FLUJO_LOGISTICO } from '@/lib/constants';
import { guardarCartaPorteCache } from '@/lib/offline-sync';

interface UseViajeChoferState {
  viaje: EnvioChofer | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

export function useViajeChofer() {
  const [state, setState] = useState<UseViajeChoferState>({
    viaje: null,
    isLoading: true,
    isUpdating: false,
    error: null,
  });

  const cargarViaje = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const asignaciones = await api.getMisAsignaciones();

      // Buscar viaje activo (no entregado ni cancelado)
      const viajeActivo = asignaciones.find(
        (e) => e.estadoActual !== 'ENTREGADO' && e.estadoActual !== 'CANCELADO'
      ) ?? null;

      setState({
        viaje: viajeActivo,
        isLoading: false,
        isUpdating: false,
        error: null,
      });

      // === DESCARGA SILENCIOSA EN SEGUNDO PLANO ===
      if (viajeActivo) {
        try {
          // Intentamos obtener los datos legales desde el nuevo endpoint de backend
          const cartaPorteData = await api.getCartaPorte(viajeActivo.idEnvio);

          // Si la petición es exitosa, guardamos/actualizamos el caché en IndexedDB
          await guardarCartaPorteCache(viajeActivo.idEnvio, cartaPorteData);

          console.log(`[Cache Offline] Carta de porte guardada con éxito para el envío: ${viajeActivo.idEnvio}`);
        } catch (cacheError) {
          // Captura de error silenciosa: Si el endpoint falla o el chofer tiene una señal
          // intermitente que corta esta petición secundaria, no bloqueamos la renderización 
          // ni la experiencia principal del viaje activo.
          console.warn('[Cache Offline] No se pudo precargar la carta de porte:', cacheError);
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar viaje';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    cargarViaje();
  }, [cargarViaje]);

  const avanzarEstado = useCallback(async () => {
    if (!state.viaje) return;

    const flujo = FLUJO_LOGISTICO[state.viaje.estadoActual];
    if (!flujo.siguiente) return;

    setState((prev) => ({ ...prev, isUpdating: true }));

    try {
      const viajeActualizado = await api.cambiarEstadoChofer(
        state.viaje.idEnvio,
        flujo.siguiente
      );

      // El endpoint de cambio de estado devuelve Envio completo,
      // por eso mapeamos solo los campos que necesitamos
      setState((prev) => ({
        ...prev,
        viaje: prev.viaje
          ? { ...prev.viaje, estadoActual: viajeActualizado.estadoActual }
          : null,
        isUpdating: false,
      }));

      return viajeActualizado;
    } catch (error) {
      setState((prev) => ({ ...prev, isUpdating: false }));
      throw error;
    }
  }, [state.viaje]);

  const reportarIncidencia = useCallback(
    async (datosIncidencia: IncidenciaDTO) => {
      if (!state.viaje) return;

      setState((prev) => ({ ...prev, isUpdating: true }));

      try {
        // Guardamos el resultado para saber si se encoló offline
        const resultado = await api.reportarIncidencia(state.viaje.idEnvio, datosIncidencia);
        setState((prev) => ({ ...prev, isUpdating: false }));

        return resultado; // <-- Retornamos el resultado para que la UI lo lea
      } catch (error) {
        setState((prev) => ({ ...prev, isUpdating: false }));
        throw error;
      }
    },
    [state.viaje]
  );

  const getSiguienteAccion = useCallback(() => {
    if (!state.viaje) return null;
    return FLUJO_LOGISTICO[state.viaje.estadoActual];
  }, [state.viaje]);

  return {
    ...state,
    recargar: cargarViaje,
    avanzarEstado,
    reportarIncidencia,
    getSiguienteAccion,
  };
}