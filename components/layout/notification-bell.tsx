// components/layout/notification-bell.tsx
'use client';

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

// Función auxiliar para mostrar el tiempo relativo de forma amigable
function formatearTiempoRelativo(fechaIso: string) {
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    const diffSegundos = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);

    if (diffSegundos < 60) return 'Hace unos segundos';
    const diffMinutos = Math.floor(diffSegundos / 60);
    if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
    const diffHoras = Math.floor(diffMinutos / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} horas`;

    return fecha.toLocaleDateString('es-AR');
}

export function NotificationBell() {
    const { alertas, cantidadNoLeidas, marcarComoLeida } = useCampanaAlertas();

    return (
        // FASE 4.2: Popover para el menú desplegable
        <Popover>
            <PopoverTrigger asChild>
                {/* FASE 4.1: Botón de la Campana */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/10 hover:text-white transition-colors"
                >
                    <Bell className="h-5 w-5" />

                    {/* Badge rojo dinámico */}
                    {cantidadNoLeidas > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px] border-2 border-[#1b4332]"
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
                <ScrollArea className="h-[300px]">
                    {alertas.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 text-muted-foreground/50" />
                            <p>No tienes notificaciones pendientes</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {alertas.map((alerta) => (
                                <button
                                    key={alerta.id}
                                    onClick={() => marcarComoLeida(alerta.id)}
                                    className={`
                    flex flex-col gap-1 p-4 border-b text-left transition-colors hover:bg-muted/50
                    ${!alerta.leida ? 'bg-primary/5' : 'opacity-70'}
                  `}
                                >
                                    <div className="flex items-start justify-between gap-3 w-full">
                                        <span className={`text-sm leading-snug ${!alerta.leida ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                            {alerta.mensaje}
                                        </span>

                                        {/* FASE 4.2: Indicador visual de "No leída" (Punto rojo) */}
                                        {!alerta.leida && (
                                            <span className="flex h-2.5 w-2.5 mt-1 rounded-full bg-destructive flex-shrink-0" />
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {formatearTiempoRelativo(alerta.fechaCreacion)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}