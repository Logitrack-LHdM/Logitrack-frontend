import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EstadoBadge } from '../envios/estado-badge';
import { DetalleViajeCumplimiento } from '@/types/cumplimiento';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface TablaDesviosProps {
    viajes: DetalleViajeCumplimiento[];
}

// Helper para formatear fechas a un formato legible (DD/MM/AAAA HH:mm)
const formatearFecha = (fechaIso: string | null) => {
    if (!fechaIso) return 'N/A';
    const date = new Date(fechaIso);
    return new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

// Helper para formatear el desvío según el Criterio 2 (horas o días)
const formatearDesvio = (horas: number | null, esRetrasado: boolean | null) => {
    if (horas === null || esRetrasado === null) return '-';
    if (!esRetrasado || horas <= 0) return 'A tiempo';

    if (horas > 24) {
        const dias = Math.floor(horas / 24);
        const horasRestantes = Math.round(horas % 24);
        return `${dias} d ${horasRestantes} h de retraso`;
    }
    return `${Math.round(horas)} h de retraso`;
};

export function TablaDesvios({ viajes }: TablaDesviosProps) {
    // Criterio 3: Inclusión en métricas solo de viajes completados.
    // Filtramos estrictamente en el frontend como medida de seguridad adicional.
    const viajesCompletados = viajes.filter(
        (viaje) => viaje.estadoActual === 'ENTREGADO'
    );

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Análisis de Viajes Individuales</CardTitle>
                <CardDescription>
                    Detalle de entregas completadas y sus respectivos desvíos frente al ETA estimado.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">

                {/* --- VISTA DESKTOP (Tabla tradicional) --- */}
                <div className="hidden md:block overflow-x-auto">
                    <Table className="min-w-[700px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4 sm:pl-0">ID Envío</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>ETA (Estimado)</TableHead>
                                <TableHead>Entrega Real</TableHead>
                                <TableHead className="text-right pr-4 sm:pr-0">Desvío</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viajesCompletados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay viajes completados para analizar en este período.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                viajesCompletados.map((viaje) => (
                                    <TableRow key={viaje.idEnvio}>
                                        <TableCell className="font-medium pl-4 sm:pl-0">#{viaje.idEnvio}</TableCell>
                                        <TableCell>
                                            <EstadoBadge estado={viaje.estadoActual} />
                                        </TableCell>
                                        <TableCell>{formatearFecha(viaje.fechaEstimadaLlegada)}</TableCell>
                                        <TableCell>{formatearFecha(viaje.fechaEntregaReal)}</TableCell>
                                        <TableCell
                                            className={`text-right font-medium pr-4 sm:pr-0 ${viaje.esRetrasado ? 'text-destructive' : 'text-[color:var(--status-delivered)]'
                                                }`}
                                        >
                                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                                {viaje.esRetrasado ? (
                                                    <AlertCircle className="h-4 w-4" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                {formatearDesvio(viaje.desvioHoras, viaje.esRetrasado)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* --- VISTA MOBILE (Tarjetas) --- */}
                <div className="md:hidden p-4 space-y-4 bg-muted/5">
                    {viajesCompletados.length === 0 ? (
                        <div className="text-center py-10 px-4 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                            No hay viajes completados para analizar en este período.
                        </div>
                    ) : (
                        viajesCompletados.map((viaje) => (
                            <div key={viaje.idEnvio} className="bg-card border rounded-xl shadow-sm p-4 flex flex-col gap-3">
                                {/* Encabezado de la tarjeta: ID y Estado */}
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-bold text-[color:var(--agro-primary)] block">#{viaje.idEnvio}</span>
                                    {/* Pasamos showIcon={false} si el componente EstadoBadge lo soporta, como en tu envío-table */}
                                    <EstadoBadge estado={viaje.estadoActual} />
                                </div>

                                {/* Fechas */}
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">ETA (Estimado)</span>
                                    <span className="text-sm font-medium text-foreground text-right">{formatearFecha(viaje.fechaEstimadaLlegada)}</span>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Entrega Real</span>
                                    <span className="text-sm font-medium text-foreground text-right">{formatearFecha(viaje.fechaEntregaReal)}</span>
                                </div>

                                {/* Desvío (Destacado en la parte inferior) */}
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Desvío</span>
                                    <div className={`flex items-center justify-end gap-1.5 text-sm font-bold ${viaje.esRetrasado ? 'text-destructive' : 'text-[color:var(--status-delivered)]'}`}>
                                        {viaje.esRetrasado ? (
                                            <AlertCircle className="h-4 w-4" />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        {formatearDesvio(viaje.desvioHoras, viaje.esRetrasado)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </CardContent>
        </Card>
    );
}