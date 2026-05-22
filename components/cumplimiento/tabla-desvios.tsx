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
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Envío</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>ETA (Estimado)</TableHead>
                            <TableHead>Entrega Real</TableHead>
                            <TableHead className="text-right">Desvío</TableHead>
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
                                    <TableCell className="font-medium">{viaje.idEnvio}</TableCell>
                                    <TableCell>{viaje.estadoActual}</TableCell>

                                    {/* Celdas con fechas formateadas */}
                                    <TableCell>{formatearFecha(viaje.fechaEstimadaLlegada)}</TableCell>
                                    <TableCell>{formatearFecha(viaje.fechaEntregaReal)}</TableCell>

                                    {/* Celda de Desvío con renderizado condicional (Criterio 2) */}
                                    <TableCell
                                        className={`text-right font-medium ${viaje.esRetrasado ? 'text-destructive' : 'text-[color:var(--status-delivered)]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-end gap-1.5">
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
            </CardContent>
        </Card>
    );
}