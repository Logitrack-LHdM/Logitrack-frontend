// hooks/use-campana-alertas.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useWebSocket } from './use-websockets';
import { AlertaWebDTO } from '@/types/websockets';

export const useCampanaAlertas = () => {
    const { usuario } = useAuth();

    // FASE 3.1: Estados internos
    const [alertas, setAlertas] = useState<AlertaWebDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // FASE 3.1: Carga Inicial del Historial (REST)
    const cargarHistorial = useCallback(async () => {
        // Si no hay usuario o es un chofer, no cargamos la campana
        if (!usuario || usuario.rol === 'ROLE_CHOFER') {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const pendientes = await api.getAlertasWebPendientes();
            setAlertas(pendientes);
        } catch (error) {
            console.error('❌ Error al cargar historial de alertas:', error);
        } finally {
            setIsLoading(false);
        }
    }, [usuario]);

    useEffect(() => {
        cargarHistorial();
    }, [cargarHistorial]);

    // FASE 3.2: Lógica al recibir una alerta en tiempo real
    const handleNuevaAlerta = useCallback((mensaje: string) => {
        // 1. Disparar componente visual (Criterio 1: Toast instantáneo)
        toast.error('Atención Requerida', {
            description: mensaje,
            duration: 8000, // Duración un poco más larga para que el supervisor pueda leerla
            // style: { backgroundColor: 'var(--destructive)', color: 'white' } // Opcional: forzar colores
        });

        // 2. Añadir la alerta al estado local para actualizar el contador de la campana
        const nuevaAlerta: AlertaWebDTO = {
            id: Date.now(), // Usamos timestamp como ID temporal seguro para React key
            mensaje: mensaje,
            fechaCreacion: new Date().toISOString(),
            leida: false,
        };

        // Colocamos la nueva alerta al principio de la lista
        setAlertas((prev) => [nuevaAlerta, ...prev]);
    }, []);

    // FASE 3.2: Integración con WebSockets
    const { isConnected } = useWebSocket({
        idUsuario: usuario?.id,
        onAlertaPrivada: handleNuevaAlerta,
    });

    // FASE 3.3: Marcar como leída (Actualización Optimista)
    const marcarComoLeida = useCallback(async (idAlerta: number) => {
        // 1. Verificamos si ya está leída para no hacer trabajo innecesario
        const alertaActual = alertas.find(a => a.id === idAlerta);
        if (!alertaActual || alertaActual.leida) return;

        // 2. UI Optimista: Actualizamos el estado local INMEDIATAMENTE
        setAlertas(prevAlertas =>
            prevAlertas.map(alerta =>
                alerta.id === idAlerta ? { ...alerta, leida: true } : alerta
            )
        );

        // 3. Hacemos la petición al backend en segundo plano
        try {
            await api.marcarAlertaWebComoLeida(idAlerta);
        } catch (error) {
            console.error('❌ Error al marcar la alerta como leída en el servidor:', error);

            // Rollback: Si el servidor falla, devolvemos la alerta a "no leída"
            setAlertas(prevAlertas =>
                prevAlertas.map(alerta =>
                    alerta.id === idAlerta ? { ...alerta, leida: false } : alerta
                )
            );
            toast.error('Hubo un problema de conexión. La alerta vuelve a estar pendiente.');
        }
    }, [alertas]);

    const cantidadNoLeidas = alertas.filter(alerta => !alerta.leida).length;

    return {
        alertas,
        cantidadNoLeidas,
        isLoading,
        isConnected,
        marcarComoLeida // Exportamos la nueva función
    };
};