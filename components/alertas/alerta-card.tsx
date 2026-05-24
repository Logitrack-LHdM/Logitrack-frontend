'use client';

import Link from 'next/link';
import { Phone, Truck, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AlertaListadoDTO } from '@/types';
import {
    AlertaEstadoBadge,
    IncidenciaIcon,
    formatTipoIncidencia
} from './alerta-utils';

interface AlertaCardProps {
    alerta: AlertaListadoDTO;
    onResolver?: (id: number) => void;
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
    // Determinamos los estilos de la tarjeta según el estado para resaltar criticidad
    const estilosCriticidad = {
        PENDIENTE: 'border-red-300 bg-red-50/40 shadow-red-100',
        NO_RESUELTA: 'border-amber-300 bg-amber-50/40 shadow-amber-100',
        RESUELTA: 'border-gray-200 bg-white opacity-75',
    };

    const cardEstilo = estilosCriticidad[alerta.estado];
    const isUrgente = alerta.estado !== 'RESUELTA';

    return (
        <div className={cn("rounded-xl border shadow-sm p-4 md:p-5 transition-all flex flex-col gap-4", cardEstilo)}>
            {/* Cabecera: Estado y Tiempo */}
            <div className="flex justify-between items-start border-b border-gray-200/50 pb-3">
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
                        "bg-white border shadow-sm",
                        alerta.estado === 'PENDIENTE' && 'text-red-600',
                        alerta.estado === 'NO_RESUELTA' && 'text-amber-600',
                        alerta.estado === 'RESUELTA' && 'text-gray-500'
                    )}
                />
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {formatTipoIncidencia(alerta.tipoIncidencia)}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {alerta.descripcion}
                    </p>
                </div>
            </div>

            {/* Pie de tarjeta: Datos del viaje y botón de acción */}
            <div className="flex flex-col md:flex-row items-center justify-between mt-2 pt-3 border-t border-gray-200/50 gap-4">

                {/* Info del Viaje y Chofer */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/envios/${alerta.idEnvio}`} className="text-[#198754] hover:underline">
                            {alerta.idEnvio}
                        </Link>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {alerta.chofer.nombreCompleto}
                    </div>

                    {alerta.chofer.telefono && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {alerta.chofer.telefono}
                        </div>
                    )}
                </div>

                {/* Botón de Resolución (Solo visible si no está resuelta) */}
                {isUrgente && (
                    <Button
                        onClick={() => onResolver?.(alerta.id)}
                        className="w-full md:w-auto bg-[#198754] hover:bg-[#157347] text-white shadow-sm transition-all"
                        size="sm"
                    >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Marcar como Resuelto
                    </Button>
                )}
            </div>
        </div>
    );
}