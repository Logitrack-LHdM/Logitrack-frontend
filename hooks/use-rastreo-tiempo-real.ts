import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { EstadoEnvio } from '@/types';

// Definimos el tiempo de actualización como constante para facilitar cambios futuros
const INTERVALO_POLLING_MS = 30000; // 30 segundos

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

    // Efecto para cargar la ruta (Se ejecuta solo al montar o si cambia el idEnvio)
    useEffect(() => {
        if (!idEnvio) return;

        // Patrón de bandera para evitar actualizar el estado si el componente 
        // se desmonta antes de que la promesa se resuelva (Navegación rápida)
        let isMounted = true;

        const fetchRuta = async () => {
            setIsRutaCargando(true);
            setErrorRuta(null);

            try {
                const rutaObtenida = await api.getRutaPlanificada(idEnvio);

                if (isMounted) {
                    setRuta(rutaObtenida);
                }
            } catch (err) {
                if (isMounted) {
                    // Si bien nuestra API ya maneja el error devolviendo [],
                    // cubrimos cualquier fallo inesperado de red por seguridad.
                    setErrorRuta('No se pudo cargar la ruta planificada.');
                }
            } finally {
                if (isMounted) {
                    setIsRutaCargando(false);
                }
            }
        };

        fetchRuta();

        // Función de limpieza
        return () => {
            isMounted = false;
        };
    }, [idEnvio]);

    // --- NUEVA FUNCIÓN: Fase 4.1 (Consulta de Ubicación en Tiempo Real) ---
    // Memorizamos la función con useCallback para evitar recreaciones innecesarias
    const fetchUbicacion = useCallback(async (isMounted: boolean = true) => {
        if (!idEnvio) return;

        try {
            const data = await api.getUbicacionTiempoReal(idEnvio);

            if (isMounted) {
                setCamionLat(data.latitudActual);
                setCamionLng(data.longitudActual);
                setPorcentajeCompletado(data.porcentajeCompletado);
                setEstadoActual(data.estadoActual);
                setErrorTracking(null);
            }
        } catch (err) {
            if (isMounted) {
                // En lugar de romper la app, registramos el error para manejar la resiliencia en la UI
                setErrorTracking('No se pudo obtener la ubicación en tiempo real del camión.');
            }
        } finally {
            if (isMounted) {
                setIsTrackingCargando(false);
            }
        }
    }, [idEnvio]);

    // --- NUEVO EFECTO: Fase 4.2 (Lógica de Polling) ---
    useEffect(() => {
        let isMounted = true;

        // 1. Ejecución inmediata al montar el componente
        fetchUbicacion(isMounted);

        // 2. Control de intervalo: Declaramos la variable para el temporizador
        let intervalId: NodeJS.Timeout;

        // 3. Validación: Solo iniciamos el temporizador si el estado es EN_TRANSITO, EN_PUNTO_DE_RECOLECCION o EN_REPARTO
        // (O si es null, lo que significa que es la primera carga y aún no sabemos el estado)
        if (estadoActual === 'EN_TRANSITO' || estadoActual === 'EN_PUNTO_DE_RECOLECCION' || estadoActual === 'EN_REPARTO' || estadoActual === null) {
            intervalId = setInterval(() => {
                fetchUbicacion(isMounted);
            }, INTERVALO_POLLING_MS);
        }

        // 4. Limpieza de recursos (Cumplimiento Tarea #230)
        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
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