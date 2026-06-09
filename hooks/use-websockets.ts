import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MensajeGlobalViaje } from '@/types/websockets';

// Leemos la URL desde las variables de entorno o usamos la de la guía por defecto
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws-logistica';

interface UseWebSocketProps {
    idUsuario?: number;
    onMensajeGlobal?: (mensaje: MensajeGlobalViaje) => void;
    onAlertaPrivada?: (mensaje: string) => void;
}

export const useWebSocket = ({ idUsuario, onMensajeGlobal, onAlertaPrivada }: UseWebSocketProps) => {
    // FASE 2.1: Estado interno para saber si estamos conectados
    const [isConnected, setIsConnected] = useState(false);

    // Usamos una referencia para mantener la instancia del cliente viva
    // a través de los re-renders sin disparar ciclos infinitos
    const clientRef = useRef<Client | null>(null);

    // Guardamos las funciones en referencias para que siempre tengan su valor más reciente
    // sin forzar al useEffect principal a volver a ejecutarse (lo que reiniciaría la conexión).
    const onMensajeGlobalRef = useRef(onMensajeGlobal);
    const onAlertaPrivadaRef = useRef(onAlertaPrivada);

    useEffect(() => {
        onMensajeGlobalRef.current = onMensajeGlobal;
        onAlertaPrivadaRef.current = onAlertaPrivada;
    }, [onMensajeGlobal, onAlertaPrivada]);

    useEffect(() => {
        // Si no hay ventana (SSR), no intentamos conectar
        if (typeof window === 'undefined') return;

        // FASE 2.2: Configuración del Cliente STOMP y Reconexión Automática
        const client = new Client({
            webSocketFactory: () => new SockJS(SOCKET_URL),
            // Criterio 2: Reintento automático cada 5 segundos si hay micro-cortes
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            // Ocultamos el debug en producción para mantener la consola limpia
            debug: (str) => {
                if (process.env.NODE_ENV !== 'production') {
                    // console.log(str); // Descomentar si necesitas ver los pings/pongs
                }
            },

            onConnect: () => {
                console.log('✅ Conectado a WebSockets LogiTrack');
                setIsConnected(true);

                // FASE 3: Suscripción condicionada para OPERADOR
                if (onMensajeGlobalRef.current) {
                    client.subscribe('/topic/viajes', (mensaje) => {
                        if (mensaje.body) {
                            try {
                                // El backend manda un JSON en este tópico
                                const data = JSON.parse(mensaje.body) as MensajeGlobalViaje;
                                if (onMensajeGlobalRef.current) {
                                    onMensajeGlobalRef.current(data);
                                }
                            } catch (error) {
                                console.error("❌ Error al parsear el mensaje global:", error);
                            }
                        }
                    });
                    console.log('📡 Suscrito a /topic/viajes (Dashboard Global)');
                }

                // FASE 3: Suscripción condicionada para SUPERVISOR
                if (idUsuario && onAlertaPrivadaRef.current) {
                    client.subscribe(`/queue/alertas-${idUsuario}`, (mensaje) => {
                        if (mensaje.body) {
                            // El backend manda un String (texto plano) en este tópico
                            if (onAlertaPrivadaRef.current) {
                                onAlertaPrivadaRef.current(mensaje.body);
                            }
                        }
                    });
                    console.log(`🚨 Suscrito a /queue/alertas-${idUsuario} (Campana Privada)`);
                }
            },
            onStompError: (frame) => {
                console.error('❌ Error STOMP:', frame.headers['message']);
            },

            onWebSocketClose: () => {
                // Esto se dispara en micro-cortes. setIsConnected(false) puede servir 
                // para mostrar un indicador visual de "Reconectando..." si lo deseas a futuro.
                console.warn('🔌 Desconexión temporal del WebSocket. Intentando reconectar...');
                setIsConnected(false);
            }
        });

        // Iniciamos la conexión
        client.activate();
        clientRef.current = client;

        // Desconexión limpia al desmontar el componente (ej. cuando se cierra sesión)
        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [idUsuario]); // Solo se reconecta si cambia el ID del usuario

    return { isConnected };
};