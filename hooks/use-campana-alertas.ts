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
        // Nota: onMensajeGlobal se puede implementar en un hook separado (ej: useDashboardViajes) 
        // para no mezclar la lógica de la tabla con la lógica de la campana.
    });

    // Derivamos la cantidad de alertas no leídas para el "Badge" rojo
    const cantidadNoLeidas = alertas.filter(alerta => !alerta.leida).length;

    return {
        alertas,
        cantidadNoLeidas,
        isLoading,
        isConnected
    };
};