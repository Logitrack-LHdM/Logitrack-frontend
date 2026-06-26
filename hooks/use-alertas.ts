'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AlertaListadoDTO } from '@/types';

export function useAlertas() {
    const [alertas, setAlertas] = useState<AlertaListadoDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Envolvemos en useCallback para evitar renderizados innecesarios si exponemos la función
    const cargarAlertas = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Consumimos el método para obtener las alertas
            const data = (await api.getAlertas()) as unknown as AlertaListadoDTO[];
            setAlertas(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar el listado de alertas';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carga inicial al montar el hook
    useEffect(() => {
        cargarAlertas();
    }, [cargarAlertas]);

    // Función para manejar la resolución de la incidencia
    const resolverAlerta = async (idAlerta: number) => {
        try {
            // 1. Enviamos la petición al backend (o mock en este caso)
            await api.resolverAlerta(idAlerta, 'Incidencia gestionada por el supervisor desde el panel.');

            // 2. Actualizamos el estado local (UI) solo si la API responde con éxito
            setAlertas((prevAlertas) =>
                prevAlertas.map((alerta) =>
                    alerta.id === idAlerta
                        ? {
                            ...alerta,
                            estado: 'RESUELTA',
                            fechaResolucion: new Date().toISOString()
                        }
                        : alerta
                )
            );

            return { success: true };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al intentar resolver la alerta';
            return { success: false, error: message };
        }
    };

    return {
        alertas,
        isLoading,
        error,
        resolverAlerta,
        recargarAlertas: cargarAlertas, // Lo exponemos por si querés agregar un botón de "Actualizar" más adelante
    };
}