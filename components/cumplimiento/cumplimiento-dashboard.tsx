'use client';

import React from 'react';
import { ResumenPuntualidad } from './resumen-puntualidad';
import { GraficoPuntualidad } from './grafico-puntualidad';
import { useCumplimiento } from '@/hooks/use-cumplimiento';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export function CumplimientoDashboard() {
    // Consumimos el mock a través de nuestro hook simulado
    const { data, isLoading, error } = useCumplimiento();

    // Manejo de estado de error
    if (error) {
        return (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <div>
                    <h3 className="font-semibold text-sm">Error de carga</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado temporal para orientar la vista (Mayo 2026) */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Resumen de Cumplimiento</h2>
                <p className="text-sm text-muted-foreground">Métricas globales correspondientes a Mayo 2026</p>
            </div>

            {/* 
        Layout responsivo para móviles y PC: 
        En pantallas grandes (lg), divide el espacio en 3 columnas. 
        Asigna 2 columnas a los KPIs y 1 al gráfico. En móviles, se apilan.
      */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col justify-center">
                    {isLoading || !data ? (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                            <Skeleton className="h-[120px] w-full rounded-xl" />
                            <Skeleton className="h-[120px] w-full rounded-xl" />
                            <Skeleton className="h-[120px] w-full rounded-xl" />
                        </div>
                    ) : (
                        <ResumenPuntualidad metricas={data.metricas} />
                    )}
                </div>

                <div className="lg:col-span-1">
                    {isLoading || !data ? (
                        <Skeleton className="h-[250px] w-full rounded-xl" />
                    ) : (
                        <GraficoPuntualidad
                            porcentajeATiempo={data.metricas.porcentajeATiempo}
                            porcentajeRetraso={data.metricas.porcentajeRetraso}
                        />
                    )}
                </div>
            </div>

            {/* 
        Contenedor reservado para el Paso 4: Tabla de Desvíos 
        Dejamos el Skeleton listo para cuando integremos la lista de viajes.
      */}
            <div className="mt-8">
                {isLoading || !data ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : (
                    <div className="p-8 border-2 border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-center flex flex-col items-center justify-center min-h-[300px]">
                        <p className="font-medium">Aquí se integrará el análisis de viajes individuales (Paso 4)</p>
                        <p className="text-sm mt-1">Renderizaremos la tabla de desvíos para los envíos entregados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}