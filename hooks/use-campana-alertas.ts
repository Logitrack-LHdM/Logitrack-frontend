// hooks/use-campana-alertas.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useWebSocket } from './use-websockets';
import { AlertaWebDTO, MensajeGlobalViaje, AlertaFatigaDTO } from '@/types/websockets';

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
                new Map(pendientes.map(item => [item.idAlertaWeb, item])).values()
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
    // Modificamos el parámetro para que acepte un objeto con los datos
    const agregarAlertaLocal = useCallback((datosAlerta: Partial<AlertaWebDTO> & { mensaje: string }) => {
        const timestamp = Date.now();

        // Si el JSON trae un ID real de la BD, lo usamos. Si no, creamos uno temporal.
        const idFinal = datosAlerta.idAlertaWeb || (timestamp + Math.floor(Math.random() * 1000000));

        // Si el JSON trae su propia fecha, la usamos. Si no, tomamos la actual.
        const fechaFinal = datosAlerta.fechaHora || new Date(timestamp).toISOString();

        const nuevaAlerta: AlertaWebDTO = {
            idAlertaWeb: idFinal,
            mensaje: datosAlerta.mensaje,
            fechaHora: fechaFinal,
            leido: datosAlerta.leido ?? false,
            tipo: datosAlerta.tipo || 'INFO', // Extraemos el tipo del JSON si viene (ej: 'FATIGA')
            idEnvio: datosAlerta.idEnvio,     // Extraemos el idEnvio del JSON
        };

        setAlertas((prev) => {
            // 🔥 SOLUCIÓN 3: Buscar duplicados en TODA la lista reciente (ventana de 1.5 seg),
            // no solamente en la primera posición.
            const esDuplicado = prev.some(a =>
                a.idAlertaWeb === idFinal || // Defensa 1: Coincidencia exacta de ID del backend
                (a.mensaje === nuevaAlerta.mensaje &&
                    (timestamp - new Date(a.fechaHora).getTime()) < 1500) // Defensa 2: Por tiempo
            );

            if (esDuplicado) {
                return prev; // Ignoramos el mensaje duplicado fantasma
            }

            return [nuevaAlerta, ...prev];
        });
    }, []);

    // Handler para alertas estructuradas de Supervisor
    // FASE 2: Handler para alertas de Supervisor (soporta String y JSON dinámicamente)
    const handleNuevaAlerta = useCallback((payload: any) => {

        // CASO 1: Es texto plano
        if (typeof payload === 'string') {
            toast.error('Atención Requerida (Supervisor)', {
                description: payload,
                duration: 8000,
            });
            agregarAlertaLocal({ mensaje: payload, tipo: 'INFO' });
            return;
        }

        // CASO 2: Es un JSON estructurado (Ej. AlertaFatigaDTO)
        // Extraemos los datos basándonos en tu JSON de ejemplo
        const esFatiga = !!payload.motivo;
        const mensajeStr = payload.mensaje || payload.motivo || 'Nueva alerta detectada';
        const tipoAlerta = payload.tipo || (esFatiga ? 'FATIGA' : 'CRITICA');

        toast.error(`Atención Requerida (${tipoAlerta})`, {
            description: mensajeStr,
            duration: 8000,
            // style: { backgroundColor: 'var(--destructive)', color: 'white' } // Opcional: forzar colores
        });

        // Pasamos los datos extraídos a agregarAlertaLocal
        agregarAlertaLocal({
            mensaje: mensajeStr,
            tipo: tipoAlerta,
            idEnvio: payload.idEnvio,
            // Si el backend no envía idAlertaWeb en el JSON, usamos idEvaluacion como base para el fallback
            idAlertaWeb: payload.idAlertaWeb || payload.idEvaluacion
        });

    }, [agregarAlertaLocal]);

    // Handler para viajes de Operador (sigue armando el string manualmente)
    const handleNuevoViaje = useCallback((data: MensajeGlobalViaje) => {
        // Transformamos el JSON complejo en un mensaje amigable para la campana
        const mensajeStr = `El envío ${data.idEnvio} cambió al estado ${data.estadoNuevo.replace('_', ' ')} (Chofer: ${data.choferNombre})`;

        toast.info('Actualización de Viaje (Operador)', {
            description: mensajeStr,
            duration: 5000,
        });

        // Le pasamos un objeto especificando el mensaje y, opcionalmente, otros datos
        agregarAlertaLocal({
            mensaje: mensajeStr,
            idEnvio: data.idEnvio
        });
    }, [agregarAlertaLocal]);

    // Handler para alertas críticas de Fatiga
    const handleAlertaFatiga = useCallback((alerta: AlertaFatigaDTO) => {
        const mensajeStr = `ALERTA FATIGA: El chofer ${alerta.nombreChofer} no superó la prueba. Viaje ${alerta.idEnvio} bloqueado.`;

        // 1. Toast global muy llamativo
        toast.error('¡Fatiga Extrema Detectada!', {
            description: mensajeStr,
            duration: 10000, // 10 segundos
        });

        // 2. Lo agregamos a la campana de notificaciones
        agregarAlertaLocal({
            mensaje: mensajeStr,
            tipo: 'FATIGA',
            idEnvio: alerta.idEnvio,
            idAlertaWeb: alerta.idAlertaWeb || alerta.idEvaluacion,
        });

        // 3. Emitimos un evento global en el navegador para que page.tsx lo escuche si está abierta
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('alerta-fatiga-ws', { detail: alerta }));
        }
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
        onAlertaFatiga: isSupervisor ? handleAlertaFatiga : undefined,
    });

    // Marcar como leída (Actualización Optimista)
    const marcarComoLeida = useCallback(async (idAlerta: number) => {
        // 1. Verificamos si ya está leída para no hacer trabajo innecesario
        const alertaActual = alertas.find(a => a.idAlertaWeb === idAlerta);
        if (!alertaActual || alertaActual.leido) return;

        // 2. UI Optimista: Actualizamos el estado local INMEDIATAMENTE
        setAlertas(prevAlertas =>
            prevAlertas.map(alerta =>
                alerta.idAlertaWeb === idAlerta ? { ...alerta, leido: true } : alerta
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
                    alerta.idAlertaWeb === idAlerta ? { ...alerta, leido: false } : alerta
                )
            );
            toast.error('Hubo un problema de conexión. La alerta vuelve a estar pendiente.');
        }
    }, [alertas]);

    const cantidadNoLeidas = alertas.filter(alerta => !alerta.leido).length;

    return {
        alertas,
        cantidadNoLeidas,
        isLoading,
        isConnected,
        marcarComoLeida
    };
};