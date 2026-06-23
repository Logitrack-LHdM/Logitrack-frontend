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

// Sub-componente reutilizable para los botones de exportación
interface ExportMenuProps {
    modulo: 'metricas' | 'detalle';
    isExporting: boolean;
    isDisabled: boolean;
    onExport: (modulo: 'metricas' | 'detalle', formato: 'csv' | 'excel') => void;
    label?: string; // Permite personalizar el texto del botón
}

function ExportMenu({ modulo, isExporting, isDisabled, onExport, label = "Exportar" }: ExportMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white w-full sm:w-auto shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                    disabled={isDisabled || isExporting}
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileDown className="h-4 w-4" />
                    )}

                    <span className="font-medium">
                        {isExporting ? 'Procesando...' : label}
                    </span>

                    {!isExporting && <ChevronDown className="h-4 w-4 opacity-70" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full sm:w-48 bg-card border-border">
                <DropdownMenuItem
                    onClick={() => onExport(modulo, 'csv')}
                    className="flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground"
                >
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <span>Exportar a CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onExport(modulo, 'excel')}
                    className="flex items-center gap-2 cursor-pointer focus:bg-muted focus:text-foreground"
                >
                    <FileSpreadsheet className="h-4 w-4 text-[color:var(--status-delivered)]" />
                    <span>Exportar a Excel</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function CumplimientoDashboard() {
    // Consumimos el hook refactorizado
    const { data, isLoading, error, ejecutarBusqueda, limpiarDatos } = useCumplimiento();

    // Estado para recordar las fechas aplicadas activamente
    const [fechasAplicadas, setFechasAplicadas] = useState({ inicio: '', fin: '' });

    // Estados independientes para la carga de cada botón
    const [isExportingMetricas, setIsExportingMetricas] = useState(false);
    const [isExportingDetalle, setIsExportingDetalle] = useState(false);

    // Funciones puente para conectar la barra de filtros con el hook
    const handleBuscar = (filtros: { fechaInicio: string; fechaFin: string }) => {
        setFechasAplicadas({ inicio: filtros.fechaInicio, fin: filtros.fechaFin });
        ejecutarBusqueda({ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin });
    };

    const handleLimpiar = () => {
        setFechasAplicadas({ inicio: '', fin: '' });
        limpiarDatos();
    };

    // Lógica de exportación dividida por módulo ---
    const handleExport = async (modulo: 'metricas' | 'detalle', formato: 'csv' | 'excel') => {
        // Activamos el spinner de carga solo en el botón presionado
        if (modulo === 'metricas') setIsExportingMetricas(true);
        else setIsExportingDetalle(true);

        try {
            let rutaBase = '';

            // Mapeo exacto de las rutas solicitadas
            if (modulo === 'metricas') {
                rutaBase = formato === 'excel'
                    ? '/reportes/cumplimiento/metricas/exportar/excel'
                    : '/reportes/cumplimiento/metricas/exportar';
            } else if (modulo === 'detalle') {
                rutaBase = formato === 'excel'
                    ? '/reportes/detalle/exportar/excel'
                    : '/reportes/detalle/exportar';
            }

            // Mantenemos la lógica de inyectar las fechas aplicadas en el filtro
            const endpoint = `${rutaBase}?fechaInicio=${fechasAplicadas.inicio}&fechaFin=${fechasAplicadas.fin}`;

            const blob = await api.descargarArchivo(endpoint);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const extension = formato === 'excel' ? 'xlsx' : 'csv';
            // Dinamizamos el nombre del archivo de descarga para mayor claridad
            const nombreModulo = modulo === 'metricas' ? 'Metricas' : 'Detalle_Viajes';
            link.setAttribute('download', `Logitrack_${nombreModulo}_${new Date().toISOString().split('T')[0]}.${extension}`);

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('¡Exportación exitosa!', {
                description: `El archivo ${formato.toUpperCase()} de ${nombreModulo.replace('_', ' ')} se descargó correctamente.`,
            });
        } catch (err) {
            console.error(`Error en exportación de ${modulo} (${formato}):`, err);
            toast.error('Error al exportar', {
                description: err instanceof Error ? err.message : 'El servidor no pudo generar el archivo. Por favor, intente nuevamente.',
            });
        } finally {
            // Apagamos el spinner correspondiente al finalizar
            if (modulo === 'metricas') setIsExportingMetricas(false);
            else setIsExportingDetalle(false);
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
            {/* Encabezado limpio (sin el botón de exportación global) */}
            <div className="flex items-center gap-3 mb-6 mt-2 px-2 md:px-0">
                {/* Título e Ícono (Izquierda en PC / Arriba en Móviles) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md">
                    <Activity className="h-7 w-7" />
                </div>
                <div>
                    <h4 className="font-bold text-foreground mb-1 text-xl md:text-2xl">Análisis de Cumplimiento</h4>
                    {/* Subtítulo dinámico/genérico */}
                    <p className="text-muted-foreground text-sm m-0">
                        Resumen del desempeño de los viajes en el período seleccionado.
                    </p>
                </div>
            </div>

            {/* --- BARRA DE FILTROS MODULARIZADA --- */}
            <DateRangeFilter
                isLoading={isLoading}
                onBuscar={handleBuscar}
                onLimpiar={handleLimpiar}
            />
            {/* Sección Métricas con su propio botón */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
                    <h3 className="text-lg font-bold text-foreground">Resumen de Desempeño</h3>
                    <ExportMenu
                        modulo="metricas"
                        isExporting={isExportingMetricas}
                        isDisabled={isLoading || !data}
                        onExport={handleExport}
                        label="Exportar Métricas"
                    />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 1. KPIs (Resumen de Puntualidad) */}
                    <div className="lg:col-span-2 flex flex-col justify-center">
                        {isLoading ? (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                                <Skeleton className="h-[120px] w-full rounded-xl" />
                                <Skeleton className="h-[120px] w-full rounded-xl" />
                                <Skeleton className="h-[120px] w-full rounded-xl" />
                            </div>
                        ) : !data ? (
                            <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-muted-foreground space-y-3 border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/10">
                                <Activity className="h-8 w-8 opacity-20" />
                                <p className="text-sm italic">Filtre por fechas para calcular</p>
                            </div>
                        ) : (
                            <ResumenPuntualidad metricas={data.metricas} />
                        )}
                    </div>
                    {/* 2. Gráfico de Puntualidad */}
                    <div className="lg:col-span-1">
                        {isLoading ? (
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        ) : !data ? (
                            <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground space-y-3 border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/10">
                                <Activity className="h-8 w-8 opacity-20" />
                                <p className="text-sm italic">Filtre por fechas para calcular</p>
                            </div>
                        ) : (
                            <GraficoPuntualidad
                                porcentajeATiempo={data.metricas.porcentajeATiempo}
                                porcentajeRetraso={data.metricas.porcentajeRetraso}
                            />
                        )}
                    </div>
                </div>
            </div>
            {/* 3. Tabla de Análisis de Viajes Individuales */}
            <div className="mt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-1">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Análisis de Viajes Individuales</h3>
                        {/* Subtítulo dinámico/genérico */}
                        <p className="text-muted-foreground text-sm m-0">
                            Detalle de entregas completadas y sus respectivos desvíos frente al ETA estimado.
                        </p>
                    </div>

                    <ExportMenu
                        modulo="detalle"
                        isExporting={isExportingDetalle}
                        isDisabled={isLoading || !data}
                        onExport={handleExport}
                        label="Exportar Detalle"
                    />
                </div>

                {isLoading ? (
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                ) : !data ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3 border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/10">
                        <Activity className="h-10 w-10 opacity-20" />
                        <p className="text-sm italic">Filtre por fechas para calcular</p>
                    </div>
                ) : (
                    <TablaDesvios viajes={data.viajes} />
                )}
            </div>
        </div>
    );
}