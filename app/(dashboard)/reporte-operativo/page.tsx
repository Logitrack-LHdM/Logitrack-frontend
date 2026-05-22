'use client';

import React from 'react';
import { Truck, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReporteOperativo } from '@/hooks/use-reporte-operativo';

export default function ReporteOperativoPage() {
    // Conectamos nuestro servicio simulado
    const { data, isLoading, error } = useReporteOperativo();

    // Manejo de estado de error
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                        <h2 className="font-semibold text-lg">Error al cargar el reporte</h2>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Función auxiliar para formatear los kilos con separadores de miles y decimales
    const formatearKilos = (kilos: number | undefined) => {
        if (kilos === undefined) return '0';
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(kilos);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Encabezado de la página */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Reporte Operativo
                    </h1>
                    <p className="text-muted-foreground">
                        Resumen de la actividad diaria: volumen de carga y estado de los viajes.
                    </p>
                </div>

                {/* Contenedor principal de la grilla (Layout Responsivo) */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

                    {isLoading ? (
                        <>
                            {/* Skeletons para las tarjetas de métricas */}
                            <Skeleton className="lg:col-span-2 h-32 rounded-xl" />
                            <Skeleton className="lg:col-span-2 h-32 rounded-xl" />
                        </>
                    ) : (
                        <>
                            {/* Tarjeta 1: Total de Viajes */}
                            <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Total de Viajes
                                    </CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Truck className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-foreground">
                                        {data?.metricasGlobales.totalViajes}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Viajes registrados en el período actual
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Tarjeta 2: Total de Kilos Transportados */}
                            <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        Kilos Transportados
                                    </CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Scale className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-foreground">
                                        {formatearKilos(data?.metricasGlobales.totalKilos)} <span className="text-lg font-normal text-muted-foreground">kg</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Volumen total de carga gestionada
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}

                </div>

                {/* Contenedor para la sección del desglose de estados */}
                <div className="grid gap-6 grid-cols-1">

                    {isLoading ? (
                        /* Skeleton para el gráfico */
                        <Skeleton className="h-96 rounded-xl w-full" />
                    ) : (
                        /* Espacio para la Fase 3.4: Gráfico de Estados */
                        <div className="border-2 border-dashed border-muted rounded-xl h-96 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                            <span>[Gráfico Desglose de Estados]</span>
                            <span className="text-sm mt-2">Pendientes: {data?.desgloseEstados.pendientes} | Entregados: {data?.desgloseEstados.entregados}</span>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}