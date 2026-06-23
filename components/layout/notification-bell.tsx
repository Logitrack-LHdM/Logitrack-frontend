'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCampanaAlertas } from '@/hooks/use-campana-alertas';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { formatearFechaHora } from '@/lib/utils';
import type { AlertaWebDTO } from '@/types/websockets';

// Función auxiliar para mostrar el tiempo relativo de forma amigable
function formatearTiempoRelativo(fechaIso: string) {
    if (!fechaIso) return ''; // Prevenir error si viene vacío

    // 1. Normalización de Zona Horaria (Solución al bug de refresco)
    // Si la fecha de Spring Boot no trae la 'Z' de UTC, se la agregamos.
    const fechaNormalizada = fechaIso.endsWith('Z') ? fechaIso : `${fechaIso}Z`;

    const fecha = new Date(fechaNormalizada);
    const ahora = new Date();

    // 2. Math.max(0, ...) evita que un pequeño desfase de relojes genere un número negativo
    const diffSegundos = Math.max(0, Math.floor((ahora.getTime() - fecha.getTime()) / 1000));

    if (diffSegundos < 60) return 'Hace unos segundos';

    const diffMinutos = Math.floor(diffSegundos / 60);
    if (diffMinutos < 60) return `Hace ${diffMinutos} min`;

    const diffHoras = Math.floor(diffMinutos / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} horas`;

    // 3. Si pasaron más de 24 horas, delegamos el texto a tu función de utils
    return formatearFechaHora(fechaNormalizada);
}

export function NotificationBell() {
    const { alertas, cantidadNoLeidas, marcarComoLeida } = useCampanaAlertas();

    const router = useRouter();
    const { usuario } = useAuth();

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const isOperador = usuario?.rol === 'ROLE_OPERADOR';

    const handleNotificacionClick = async (alerta: AlertaWebDTO) => {
        console.log(alerta);

        // 1. Siempre marcamos la alerta como leída primero
        marcarComoLeida(alerta.idAlertaWeb);

        // 2. Evaluamos el rol para redirigir (solo Supervisor viaja)
        if (usuario?.rol === 'ROLE_SUPERVISOR') {
            setIsOpen(false); // Cierra el Popover inmediatamente

            // 3. Redirección dinámica basada en el tipo
            if (alerta.tipo === 'FATIGA' && alerta.idEnvio) {
                router.push(`/envios/${alerta.idEnvio}`);
            } else {
                // Por defecto, o si es CRITICA, vamos al panel general
                router.push('/alertas');
            }
        }
    };

    return (
        // FASE 4.2: Popover para el menú desplegable
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {/* FASE 4.1: Botón de la Campana */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/10 hover:text-white transition-colors"
                    aria-label={
                        cantidadNoLeidas > 0
                            ? `Notificaciones: ${cantidadNoLeidas} sin leer`
                            : 'Notificaciones: sin pendientes'
                    }
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    <Bell className="h-5 w-5" aria-hidden="true" />

                    {/* Badge rojo dinámico */}
                    {cantidadNoLeidas > 0 && (
                        <Badge
                            variant={isOperador ? "default" : "destructive"}
                            className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px] border-2 border-[#1b4332] ${isOperador ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                        >
                            {cantidadNoLeidas > 99 ? '99+' : cantidadNoLeidas}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            {/* Contenido del Desplegable */}
            <PopoverContent className="w-80 p-0 mr-4 mt-1" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    <Badge variant="secondary" className="text-xs">
                        {cantidadNoLeidas} nuevas
                    </Badge>
                </div>

                {/* FASE 4.2: Listado de Alertas con Scroll */}
                <ScrollArea className="h-[300px]" aria-labelledby="notifications-title">
                    {alertas.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2" role="status">
                            <Bell className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                            <p>No tienes notificaciones pendientes</p>
                        </div>
                    ) : (
                        <ul className="flex flex-col" role="list" aria-live="polite" aria-label="Lista de notificaciones">
                            {alertas.map((alerta) => (
                                <li key={alerta.idAlertaWeb} role="listitem">
                                    <button
                                        onClick={() => handleNotificacionClick(alerta)}
                                        className={`
                    flex flex-col gap-1 p-4 border-b text-left transition-colors hover:bg-muted/50 w-full
                    ${!alerta.leido ? 'bg-primary/5' : 'opacity-70'}
                  `}
                                        aria-label={`${alerta.leido ? 'Notificación leída' : 'Notificación sin leer'}: ${alerta.mensaje}. ${formatearTiempoRelativo(alerta.fechaHora)}`}
                                    >
                                        <div className="flex items-start justify-between gap-3 w-full">
                                            <span className={`text-sm leading-snug ${!alerta.leido ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                {alerta.mensaje}
                                            </span>

                                            {/* Indicador visual de "No leída" (Punto) */}
                                            {!alerta.leido && (
                                                <span
                                                    className={`flex h-2.5 w-2.5 mt-1 rounded-full flex-shrink-0 ${isOperador ? 'bg-blue-600' : 'bg-destructive'}`}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1" aria-hidden="true">
                                            {formatearTiempoRelativo(alerta.fechaHora)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}