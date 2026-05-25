import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EstadoEnvio } from '@/types';

// Definimos el tiempo de actualización como constante para facilitar cambios futuros
const INTERVALO_POLLING_MS = 1000;

export function useRastreoTiempoReal(idEnvio: string) {
    // Definición de Estados
    // Inicializamos la ruta como un arreglo vacío para evitar errores en el primer renderizado
    const [ruta, setRuta] = useState<[number, number][]>([]);
    const [isRutaCargando, setIsRutaCargando] = useState<boolean>(true);
    const [errorRuta, setErrorRuta] = useState<string | null>(null);

    // --- NUEVOS ESTADOS: Tracking del Camión ---
    // Se gregarema los estados para el movimiento del camión
    const [camionLat, setCamionLat] = useState<number | undefined>(undefined);
    const [camionLng, setCamionLng] = useState<number | undefined>(undefined);
    const [porcentajeCompletado, setPorcentajeCompletado] = useState<number>(0);
    const [estadoActual, setEstadoActual] = useState<EstadoEnvio | null>(null);
    const [isTrackingCargando, setIsTrackingCargando] = useState<boolean>(true);
    const [errorTracking, setErrorTracking] = useState<string | null>(null);

    // --- EFECTO 1: Cargar la Ruta Planificada con Cancelación ---
    // Efecto para cargar la ruta (Se ejecuta solo al montar o si cambia el idEnvio)
    useEffect(() => {
        if (!idEnvio) return;

        // Creamos el controlador para la petición de la ruta
        const controller = new AbortController();

        const fetchRuta = async () => {
            setIsRutaCargando(true);
            setErrorRuta(null);

            try {
                const rutaObtenida = await api.getRutaPlanificada(idEnvio, controller.signal);
                setRuta(rutaObtenida);
            } catch (err) {
                // Si el error es porque se abortó, no actualizamos el estado
                if (err instanceof Error && err.name === 'AbortError') return;
                // Si bien nuestra API ya maneja el error devolviendo [],
                // cubrimos cualquier fallo inesperado de red por seguridad.
                setErrorRuta('No se pudo cargar la ruta planificada.');
            } finally {
                setIsRutaCargando(false);
            }
        };

        fetchRuta();

        // Función de limpieza
        // Al desmontar, cancelamos inmediatamente la petición si seguía en vuelo
        return () => {
            controller.abort();
        };
    }, [idEnvio]);

    // --- FUNCIÓN DE SEGUIMIENTO (Consulta de Ubicación en Tiempo Real): Acepta el AbortSignal ---
    // Memorizamos la función con useCallback para evitar recreaciones innecesarias
    const fetchUbicacion = useCallback(async (signal?: AbortSignal) => {
        if (!idEnvio) return;

        try {
            const data = await api.getUbicacionTiempoReal(idEnvio, signal);

            setCamionLat(data.latitudActual);
            setCamionLng(data.longitudActual);
            setPorcentajeCompletado(data.porcentajeCompletado);
            setEstadoActual(data.estadoActual);
            setErrorTracking(null);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            setErrorTracking('No se pudo obtener la ubicación en tiempo real del camión.');
        } finally {
            setIsTrackingCargando(false);
        }
    }, [idEnvio]);

    // --- EFECTO 2: Polling de Ubicación con Cancelación Integral ---
    useEffect(() => {
        // Creamos un controlador para el ciclo de polling
        const controller = new AbortController();

        // Ejecución inmediata usando el signal del controlador
        fetchUbicacion(controller.signal);

        // Control de intervalo: Declaramos la variable para el temporizador
        let intervalId: NodeJS.Timeout;

        // 3. Validación: Solo iniciamos el temporizador si el estado es EN_TRANSITO, EN_PUNTO_DE_RECOLECCION o EN_REPARTO
        // (O si es null, lo que significa que es la primera carga y aún no sabemos el estado)
        if (estadoActual === 'EN_TRANSITO' || estadoActual === 'EN_PUNTO_DE_RECOLECCION' || estadoActual === 'EN_REPARTO' || estadoActual === null) {
            intervalId = setInterval(() => {
                fetchUbicacion(controller.signal);
            }, INTERVALO_POLLING_MS);
        }

        // Limpieza de recursos (Cumplimiento Tarea #230): destruye el intervalo y aborta cualquier petición activa
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            controller.abort();
        };
    }, [fetchUbicacion, estadoActual]);
    // Dependencias: 
    // - fetchUbicacion está memorizada por useCallback.
    // - estadoActual nos permite detener el temporizador si el viaje finaliza (ej. pasa a ENTREGADO).

    // Exponemos los datos y estados hacia el componente
    // Retornamos tanto los datos de la ruta como las variables dinámicas del vehículo
    return {
        ruta,
        isRutaCargando,
        errorRuta,
        // Retornos de tracking:
        camionLat,
        camionLng,
        porcentajeCompletado,
        estadoActual,
        isTrackingCargando,
        errorTracking,
        fetchUbicacion
    };
}