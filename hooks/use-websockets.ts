import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { MensajeGlobalViaje, AlertaFatigaDTO } from '@/types/websockets';
import { useNetwork } from '@/hooks/use-network';
import { useAuth } from '@/contexts/auth-context';

// En hooks/use-websocket.ts

// Generador dinámico de URL para blindar los entornos
const getSocketUrl = () => {
    const envUrl = process.env.NEXT_PUBLIC_WS_URL;

    // Si estamos en Vercel (producción) y la URL por error dice http://, la forzamos a https://
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        if (envUrl && envUrl.startsWith('http://')) {
            return envUrl.replace('http://', 'https://');
        }
        // Si por alguna razón la variable está vacía en Vercel, pon tu URL de render aquí:
        if (!envUrl) {
            return 'https://logitrack-omv3.onrender.com/ws-logistica'; // REEMPLAZA ESTO
        }
    }

    return envUrl || 'http://localhost:8080/ws-logistica';
};

const SOCKET_URL = getSocketUrl();
console.log("🔗 URL del WebSocket que se va a usar:", SOCKET_URL); // Esto te dirá la verdad en DevTools

// // Leemos la URL desde las variables de entorno o usamos la de la guía por defecto
// const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws-logistica';

interface UseWebSocketProps {
    idUsuario?: number;
    onMensajeGlobal?: (mensaje: MensajeGlobalViaje) => void;
    onAlertaPrivada?: (mensaje: string) => void;
    onAlertaFatiga?: (alerta: AlertaFatigaDTO) => void;
}

export const useWebSocket = ({ idUsuario, onMensajeGlobal, onAlertaPrivada, onAlertaFatiga }: UseWebSocketProps) => {    // Estado interno para saber si estamos conectados
    const { usuario } = useAuth();

    const [isConnected, setIsConnected] = useState(false);

    // Usamos una referencia para mantener la instancia del cliente viva
    // a través de los re-renders sin disparar ciclos infinitos
    const clientRef = useRef<Client | null>(null);

    // Guardamos las funciones en referencias para que siempre tengan su valor más reciente
    // sin forzar al useEffect principal a volver a ejecutarse (lo que reiniciaría la conexión).
    const onMensajeGlobalRef = useRef(onMensajeGlobal);
    const onAlertaPrivadaRef = useRef(onAlertaPrivada);

    const onAlertaFatigaRef = useRef(onAlertaFatiga);

    // Observamos si hay internet a nivel de aplicación
    const { isOnline } = useNetwork();

    useEffect(() => {
        onMensajeGlobalRef.current = onMensajeGlobal;
        onAlertaPrivadaRef.current = onAlertaPrivada;
        onAlertaFatigaRef.current = onAlertaFatiga;
    }, [onMensajeGlobal, onAlertaPrivada, onAlertaFatiga]);

    // EFECTO PRINCIPAL: Control de ciclo de vida del WebSocket basado en red
    useEffect(() => {
        // Si no hay ventana (SSR), no intentamos conectar
        if (typeof window === 'undefined') return;

        // Candado de verdad inmediata. 
        // navigator.onLine nos dice la verdad exacta en el milisegundo cero (útil para el F5).
        // isOnline reacciona a los cambios posteriores (útil para cuando se cae la red durante el uso).
        const tieneInternetReal = navigator.onLine && isOnline;

        // Bloqueo de conexión con el doble candado
        if (!tieneInternetReal) {
            console.log('📶 Sin internet: Bloqueando intentos de WebSocket.');

            if (clientRef.current?.active) {
                clientRef.current.deactivate();
            }
            setIsConnected(false);
            return;
        }

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

                // Suscripción condicionada para OPERADOR
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
                                console.error("❌ Error al parsear:", error);
                            }
                        }
                    });
                    console.log('📡 Suscrito a /topic/viajes (Dashboard Global)');
                }

                // Suscripción condicionada para SUPERVISOR
                if (usuario?.rol === 'ROLE_SUPERVISOR' && onAlertaPrivadaRef.current) {
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

                // Suscripción exclusiva para el canal de fatiga (US 68)
                if (onAlertaFatigaRef.current) {
                    client.subscribe('/topic/alertas-supervisores', (mensaje) => {
                        if (mensaje.body) {
                            // 1. Obtenemos el content-type directamente de las cabeceras STOMP
                            const contentType = mensaje.headers['content-type'] || '';

                            // 2. Si es JSON (Mensaje de FALLO con el DTO)
                            if (contentType.includes('application/json')) {
                                try {
                                    const data = JSON.parse(mensaje.body) as AlertaFatigaDTO;
                                    if (onAlertaFatigaRef.current) {
                                        onAlertaFatigaRef.current(data);
                                    }
                                } catch (error) {
                                    console.error("❌ Error al parsear alerta de fatiga:", error);
                                }
                            }
                            // 3. Si es Texto Plano (Mensaje de ÉXITO)
                            else if (contentType.includes('text/plain')) {
                                // Como el chofer aprobó, no necesitamos desplegar el banner amarillo de bloqueo.
                                // Lo registramos silenciosamente en consola para fines de depuración.
                                console.log("✅ Test de fatiga superado:", mensaje.body);
                            }
                        }
                    });
                    console.log('🚨 Suscrito a /topic/alertas-supervisores (Prevención de Fatiga)');
                }

                // // Suscripción exclusiva para el canal de fatiga (US 68)
                // if (usuario?.rol === 'ROLE_SUPERVISOR' && onAlertaPrivadaRef.current) {
                //     client.subscribe('/topic/alertas-supervisores', (mensaje) => {
                //         if (mensaje.body) {
                //             if (onAlertaPrivadaRef.current) {
                //                 try {
                //                     // Intentamos parsear como JSON (para la alerta de Fatiga)
                //                     const dataJSON = JSON.parse(mensaje.body);
                //                     onAlertaPrivadaRef.current(dataJSON);
                //                 } catch (error) {
                //                     // Si falla el parseo, asumimos que es texto plano (MENSAJE simple)
                //                     onAlertaPrivadaRef.current(mensaje.body);
                //                 }
                //             }
                //         }
                //     });
                //     console.log('🚨 Suscrito a /topic/alertas-supervisores (Prevención de Fatiga)');
                // }

            },
            onStompError: (frame) => {
                console.error('❌ Error STOMP:', frame.headers['message']);
            },

            onWebSocketClose: () => {
                // Esto se dispara en micro-cortes. setIsConnected(false) puede servir 
                // para mostrar un indicador visual de "Reconectando..." si lo deseas a futuro.
                console.warn('🔌 Desconexión del WebSocket.');
                setIsConnected(false);
            }
        });

        // Activamos solo si llegamos aquí (hay internet)
        client.activate();
        clientRef.current = client;

        // Desconexión limpia al desmontar el componente (ej. cuando se cierra sesión)
        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [idUsuario, isOnline]); // Añadimos isOnline como dependencia vital

    return { isConnected };
};