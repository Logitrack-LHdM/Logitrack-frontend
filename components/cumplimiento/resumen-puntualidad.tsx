import React from 'react';
import { PackageCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricasCumplimiento } from '@/types/cumplimiento';

interface ResumenPuntualidadProps {
    metricas: MetricasCumplimiento;
}

export function ResumenPuntualidad({ metricas }: ResumenPuntualidadProps) {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">

            {/* Tarjeta 1: Total Entregados */}
            <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Entregados
                    </CardTitle>
                    <div className="p-2 bg-primary/10 rounded-full">
                        <PackageCheck className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                        {metricas.totalEntregados}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Envíos completados en el período
                    </p>
                </CardContent>
            </Card>

            {/* Tarjeta 2: Entregados a Tiempo (Éxito) */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-[color:var(--status-delivered)]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        A Tiempo
                    </CardTitle>
                    <div
                        className="p-2 rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--status-delivered) 10%, transparent)' }}
                    >
                        <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--status-delivered)' }} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold" style={{ color: 'var(--status-delivered)' }}>
                        {metricas.entregadosATiempo}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Cumplieron con el ETA estimado
                    </p>
                </CardContent>
            </Card>

            {/* Tarjeta 3: Entregados con Retraso (Alerta) */}
            <Card className="shadow-sm hover:shadow-md transition-shadow border-destructive/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Con Retraso
                    </CardTitle>
                    <div className="p-2 bg-destructive/10 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-destructive">
                        {metricas.entregadosConRetraso}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Superaron el ETA estimado
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}