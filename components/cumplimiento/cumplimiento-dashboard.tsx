'use client';

import { useState } from 'react';
import { ResumenPuntualidad } from './resumen-puntualidad';
import { GraficoPuntualidad } from './grafico-puntualidad';
import { TablaDesvios } from './tabla-desvios';
import { useCumplimiento } from '@/hooks/use-cumplimiento';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertCircle, FileDown, Loader2, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DateRangeFilter } from '@/components/ui/date-range-filter';

export function CumplimientoDashboard() {
    // Consumimos el hook refactorizado
    const { data, isLoading, error, ejecutarBusqueda, limpiarDatos } = useCumplimiento();

    // Estado para recordar las fechas aplicadas activamente
    const [fechasAplicadas, setFechasAplicadas] = useState({ inicio: '', fin: '' });
    const [isExporting, setIsExporting] = useState(false);

    // Funciones puente para conectar la barra de filtros con el hook
    const handleBuscar = (filtros: { fechaInicio: string; fechaFin: string }) => {
        setFechasAplicadas({ inicio: filtros.fechaInicio, fin: filtros.fechaFin });
        ejecutarBusqueda({ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin });
    };

    const handleLimpiar = () => {
        setFechasAplicadas({ inicio: '', fin: '' });
        limpiarDatos();
    };

    // Exportación dinámica basada en las fechas aplicadas
    const handleExport = async (formato: 'csv' | 'excel') => {
        setIsExporting(true);
        try {
            const rutaBase = formato === 'excel'
                ? '/reportes/cumplimiento/viajes/exportar/excel'
                : '/reportes/cumplimiento/viajes/exportar';

            const endpoint = `${rutaBase}?fechaInicio=${fechasAplicadas.inicio}&fechaFin=${fechasAplicadas.fin}`;

            const blob = await api.descargarArchivo(endpoint);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const extension = formato === 'excel' ? 'xlsx' : 'csv';
            link.setAttribute('download', `Logitrack_Cumplimiento_${new Date().toISOString().split('T')[0]}.${extension}`);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('¡Exportación exitosa!', {
                description: `El archivo ${formato.toUpperCase()} se descargó correctamente.`,
            });
        } catch (err) {
            console.error(`Error en exportación (${formato}):`, err);
            toast.error('Error al exportar', {
                description: err instanceof Error ? err.message : 'El servidor no pudo generar el archivo. Por favor, intente nuevamente.',
            });
        } finally {
            setIsExporting(false);
        }
    };

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
            {/* Encabezado con el botón de exportación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2 px-2 md:px-0">

                {/* Título e Ícono (Izquierda en PC / Arriba en Móviles) */}
                <div className="flex items-center gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
                        <Activity className="h-7 w-7" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-xl md:text-2xl">Análisis de Cumplimiento</h4>
                        {/* Subtítulo dinámico/genérico */}
                        <p className="text-muted-foreground text-sm m-0">
                            Resumen del desempeño de los viajes en el período seleccionado.
                        </p>
                    </div>
                </div>

                {/* Botón de Exportación con Menú Desplegable */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white w-full sm:w-auto shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                            disabled={isExporting || isLoading || !data}
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="h-4 w-4" />
                            )}

                            <span>
                                {isExporting ? 'Exportando...' : 'Exportar'}
                            </span>

                            {!isExporting && <ChevronDown className="h-4 w-4 opacity-70" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-full sm:w-48 bg-card border-border">
                        <DropdownMenuItem
                            onClick={() => handleExport('csv')}
                            className="flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground"
                        >
                            <FileDown className="h-4 w-4 text-muted-foreground" />
                            <span>Exportar a CSV</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleExport('excel')}
                            className="flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-[#198754]" />
                            <span>Exportar a Excel</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* --- BARRA DE FILTROS MODULARIZADA --- */}
            <DateRangeFilter
                isLoading={isLoading}
                onBuscar={handleBuscar}
                onLimpiar={handleLimpiar}
            />

            {/* Layout responsivo para móviles y PC:
            En pantallas grandes (lg), divide el espacio en 3 columnas.
            Asigna 2 columnas a los KPIs y 1 al gráfico. En móviles, se apilan. */}

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