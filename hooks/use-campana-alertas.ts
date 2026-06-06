// hooks/use-campana-alertas.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useWebSocket } from './use-websockets';
import { AlertaWebDTO, MensajeGlobalViaje } from '@/types/websockets';

export const useCampanaAlertas = () => {
    const { usuario } = useAuth();

    // Estados internos
    const [alertas, setAlertas] = useState<AlertaWebDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Carga Inicial - Restringida SOLO a Supervisores
    const cargarHistorial = useCallback(async () => {
        // Si no es supervisor, no cargamos el historial de la BD
        if (!usuario || usuario.rol !== 'ROLE_SUPERVISOR') {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const pendientes = await api.getAlertasWebPendientes();

            // 🔥 SOLUCIÓN 1: Defensa contra el Backend. 
            // Limpiamos la respuesta de la API descartando cualquier objeto que traiga un ID repetido.
            const alertasUnicas = Array.from(
                new Map(pendientes.map(item => [item.id, item])).values()
            );

            setAlertas(alertasUnicas);
        } catch (error) {
            console.error('❌ Error al cargar historial de alertas:', error);
        } finally {
            setIsLoading(false);
        }
    }, [usuario]);

    useEffect(() => {
        cargarHistorial();
    }, [cargarHistorial]);

    // Función Helper: Añade notificaciones al estado local (reutilizable)
    const agregarAlertaLocal = useCallback((mensaje: string) => {
        const timestamp = Date.now();
        // 🔥 SOLUCIÓN 2: Generación de ID verdaderamente irrepetible usando Random.
        const idTemporal = timestamp + Math.floor(Math.random() * 1000000);

        const nuevaAlerta: AlertaWebDTO = {
            id: idTemporal,
            mensaje: mensaje,
            fechaCreacion: new Date(timestamp).toISOString(),
            leida: false,
        };

        setAlertas((prev) => {
            // 🔥 SOLUCIÓN 3: Buscar duplicados en TODA la lista reciente (ventana de 1.5 seg),
            // no solamente en la primera posición.
            const esDuplicado = prev.some(a =>
                a.mensaje === mensaje &&
                (timestamp - new Date(a.fechaCreacion).getTime()) < 1500
            );

            if (esDuplicado) {
                return prev; // Ignoramos el mensaje duplicado fantasma
            }

            return [nuevaAlerta, ...prev];
        });
    }, []);

    // FASE 1: Handler para alertas de Supervisor (Cola Privada)
    const handleNuevaAlerta = useCallback((mensaje: string) => {
        toast.error('Atención Requerida (Supervisor)', {
            description: mensaje,
            duration: 8000,
            // style: { backgroundColor: 'var(--destructive)', color: 'white' } // Opcional: forzar colores
        });
        agregarAlertaLocal(mensaje);
    }, [agregarAlertaLocal]);

    // FASE 2: Handler para viajes de Operador (Dashboard Global)
    const handleNuevoViaje = useCallback((data: MensajeGlobalViaje) => {
        // Transformamos el JSON complejo en un mensaje amigable para la campana
        const mensajeStr = `El envío ${data.idEnvio} cambió al estado ${data.estadoNuevo.replace('_', ' ')} (Chofer: ${data.choferNombre})`;

        toast.info('Actualización de Viaje (Operador)', {
            description: mensajeStr,
            duration: 5000,
        });
        agregarAlertaLocal(mensajeStr);
    }, [agregarAlertaLocal]);

    // FASE 1: Segregación lógica de variables booleanas
    const isSupervisor = usuario?.rol === 'ROLE_SUPERVISOR';
    const isOperador = usuario?.rol === 'ROLE_OPERADOR';

    // FASE 1 y 2: Pasamos los handlers condicionalmente según el rol
    const { isConnected } = useWebSocket({
        idUsuario: usuario?.id,
        // Si NO es supervisor, pasamos undefined (se ignora)
        onAlertaPrivada: isSupervisor ? handleNuevaAlerta : undefined,
        // Si NO es operador, pasamos undefined (se ignora)
        onMensajeGlobal: isOperador ? handleNuevoViaje : undefined,
    });

    // Marcar como leída (Actualización Optimista)
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
            // Solo hacemos la petición si es un id numérico del servidor (no los generados en tiempo real temporalmente)
            if (idAlerta < 1000000000000) {
                await api.marcarAlertaWebComoLeida(idAlerta);
            }
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
        marcarComoLeida
    };
};