'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Truck, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { AlertaListadoDTO } from '@/types';
import {
    AlertaEstadoBadge,
    IncidenciaIcon,
    formatTipoIncidencia
} from './alerta-utils';

interface AlertaCardProps {
    alerta: AlertaListadoDTO;
    // Tipamos la función para que admita promesas (asíncrona)
    onResolver?: (id: number) => Promise<void> | void;
}

// Función auxiliar para calcular el tiempo relativo
function calcularTiempoTranscurrido(fechaIso: string): string {
    const msMinuto = 60 * 1000;
    const msHora = msMinuto * 60;
    const msDia = msHora * 24;
    const transcurrido = Date.now() - new Date(fechaIso).getTime();

    if (transcurrido < msMinuto) return 'Hace unos instantes';
    if (transcurrido < msHora) return `Hace ${Math.floor(transcurrido / msMinuto)} min`;
    if (transcurrido < msDia) return `Hace ${Math.floor(transcurrido / msHora)} hs`;
    return `Hace ${Math.floor(transcurrido / msDia)} días`;
}

export function AlertaCard({ alerta, onResolver }: AlertaCardProps) {
    // 1. Agregamos el estado de carga
    const [isResolving, setIsResolving] = useState(false);

    // Determinamos los estilos de la tarjeta según el estado para resaltar criticidad
    const estilosCriticidad = {
        PENDIENTE: 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/30 shadow-red-100 dark:shadow-none',
        NO_RESUELTA: 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 shadow-amber-100 dark:shadow-none',
        RESUELTA: 'border-border bg-card opacity-75',
    };

    const cardEstilo = estilosCriticidad[alerta.estado];
    const isUrgente = alerta.estado !== 'RESUELTA';

    // 2. Creamos la función manejadora con async/await
    const handleResolveClick = async () => {
        if (!onResolver) return;

        setIsResolving(true);
        try {
            await onResolver(alerta.id);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className={cn("rounded-xl border shadow-sm p-4 md:p-5 transition-all flex flex-col gap-4", cardEstilo)}>
            {/* Cabecera: Estado y Tiempo */}
            <div className="flex justify-between items-start border-b border-border/60 pb-3">
                <AlertaEstadoBadge estado={alerta.estado} />
                <span className="text-xs font-medium text-muted-foreground">
                    {calcularTiempoTranscurrido(alerta.fechaReporte)}
                </span>
            </div>

            {/* Cuerpo principal: Tipo y Descripción */}
            <div className="flex gap-4 items-start">
                <IncidenciaIcon
                    tipo={alerta.tipoIncidencia}
                    className={cn(
                        "bg-card border shadow-sm",
                        alerta.estado === 'PENDIENTE' && 'text-red-600 dark:text-red-400',
                        alerta.estado === 'NO_RESUELTA' && 'text-amber-600 dark:text-amber-400',
                        alerta.estado === 'RESUELTA' && 'text-muted-foreground'
                    )}
                />
                <div className="flex-1">
                    <h4 className="font-bold text-foreground text-lg mb-1">
                        {formatTipoIncidencia(alerta.tipoIncidencia)}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {alerta.descripcion}
                    </p>
                </div>
            </div>

            {/* Pie de tarjeta: Datos del viaje y botón de acción */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-2 pt-3 border-t border-border/60 gap-4">

                {/* Info del Viaje y Chofer */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/envios/${alerta.idEnvio}`} className="text-[#198754] dark:text-[#5cd693] hover:underline">
                            {alerta.idEnvio}
                        </Link>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {alerta.chofer.nombreCompleto}
                    </div>

                    {alerta.chofer.telefono && (
                        <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {alerta.chofer.telefono}
                        </div>
                    )}
                </div>

                {/* 3. Actualizamos el botón de Resolución */}
                {isUrgente && onResolver && (
                    <Button
                        onClick={handleResolveClick}
                        disabled={isResolving}
                        className="w-full md:w-auto bg-[#1b4332] hover:bg-[#2d6a4f] text-white shadow-sm transition-all"
                        size="sm"
                    >
                        {isResolving ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4 border-white" />
                                Resolviendo...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-1.5" />
                                Marcar como Resuelto
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}