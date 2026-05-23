'use client';

import React from 'react';
import { useState } from 'react';
import { Activity, AlertCircle, FileDown, Loader2, } from 'lucide-react';
import { ResumenPuntualidad } from './resumen-puntualidad';
import { GraficoPuntualidad } from './grafico-puntualidad';
import { TablaDesvios } from './tabla-desvios';
import { useCumplimiento } from '@/hooks/use-cumplimiento';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';

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

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        // Aquí irá la lógica de consumo del mock y descarga (Fase 2 y 4)
        // Simulamos la espera por ahora:
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsExporting(false);
    };

    return (
        <div className="space-y-6">
            {/* Encabezado temporal para orientar la vista (Mayo 2026) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2 px-2 md:px-0">

                {/* Título e Ícono (Izquierda en PC / Arriba en Móviles) */}
                <div className="flex items-center gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
                        <Activity className="h-7 w-7" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-xl md:text-2xl">Resumen de Cumplimiento</h4>
                        <p className="text-muted-foreground text-sm m-0">
                            Métricas globales correspondientes a Mayo 2026.
                        </p>
                    </div>
                </div>

                {/* Botón de Exportación (Derecha en PC / Abajo y full-width en Móviles) */}
                <Button
                    className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white w-full sm:w-auto shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                    disabled={isExporting}
                    onClick={handleExport}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="h-4 w-4" />
                    )}

                    {/* Texto para PC */}
                    <span className="hidden sm:inline">
                        {isExporting ? 'Exportando...' : 'Exportar a CSV'}
                    </span>

                    {/* Texto para Móviles */}
                    <span className="sm:hidden">
                        {isExporting ? 'Exportando...' : 'Exportar'}
                    </span>
                </Button>

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

            {/* Integración del Criterio 2: Tabla de Análisis de Viajes Individuales */}
            <div className="mt-8">
                {isLoading || !data ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : (
                    <TablaDesvios viajes={data.viajes} />
                )}
            </div>
        </div>
    );
}