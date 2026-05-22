'use client';

import React from 'react';
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
                            {/* Espacio para la Fase 3.3: Tarjetas de Métricas Globales */}
                            <div className="lg:col-span-2 border-2 border-dashed border-muted rounded-xl h-32 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                <span>[Card Total Viajes]</span>
                                <span className="font-bold text-foreground mt-2">Dato mock: {data?.metricasGlobales.totalViajes}</span>
                            </div>

                            <div className="lg:col-span-2 border-2 border-dashed border-muted rounded-xl h-32 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                <span>[Card Total Kilos]</span>
                                <span className="font-bold text-foreground mt-2">Dato mock: {data?.metricasGlobales.totalKilos} kg</span>
                            </div>
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