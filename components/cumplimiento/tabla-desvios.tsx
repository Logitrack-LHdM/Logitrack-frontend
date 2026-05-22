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

interface TablaDesviosProps {
    viajes: DetalleViajeCumplimiento[];
}

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
                                    <TableCell>{viaje.fechaEstimadaLlegada}</TableCell>
                                    <TableCell>{viaje.fechaEntregaReal}</TableCell>
                                    <TableCell className="text-right">{viaje.desvioHoras}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}