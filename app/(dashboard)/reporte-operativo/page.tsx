'use client';

import React, { useMemo, useState } from 'react';
import { Truck, Scale, ArrowLeftCircle, ChartColumnBig, FileDown, Loader2, Clock, CheckCircle, PackageOpen, AlertTriangle, Percent, FileSpreadsheet, ChevronDown } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";

// Importamos nuestros custom hooks y tipos actualizados
import { useReporteOperativo } from '@/hooks/use-reporte-operativo';
import { RangoReporte } from '@/types/reporte-operativo';

// Importamos las funciones utilitarias
import { adaptarDatosParaGrafico, formatearTextoEnum, formatearFechaIsoLocal } from '@/utils/formatters';

import { DateRangeFilter } from '@/components/ui/date-range-filter';

import { api } from '@/lib/api';

export default function ReporteOperativoPage() {

    // 1. Conectamos nuestro hook operativo
    const { data, isLoading, error, ejecutarBusqueda, limpiarDatos } = useReporteOperativo();

    // 2. Estado para recordar las fechas aplicadas activamente (evita el bug de exportar fechas no buscadas)
    const [fechasAplicadas, setFechasAplicadas] = useState({ inicio: '', fin: '' });

    // 3. Handlers simplificados que se conectan al componente modular
    const handleBuscar = (filtros: { fechaInicio: string; fechaFin: string }) => {
        setFechasAplicadas({ inicio: filtros.fechaInicio, fin: filtros.fechaFin });
        ejecutarBusqueda({ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin });
    };

    const handleLimpiar = () => {
        setFechasAplicadas({ inicio: '', fin: '' });
        limpiarDatos();
    };

    // Modificamos el useMemo para que soporte que data sea null inicialmente
    const datosGrafico = useMemo(() => {
        return adaptarDatosParaGrafico(data?.estados || []);
    }, [data?.estados]);

    // Estado para la exportación
    const [isExporting, setIsExporting] = useState(false);

    // Controlador del botón de exportación
    const handleExport = async (formato: 'csv' | 'excel') => {
        setIsExporting(true);
        try {
            // 1. Construimos el endpoint según el formato seleccionado
            // Modificación: usar fechasAplicadas en lugar de los estados individuales borrados
            const rutaBase = formato === 'excel' ? '/reportes/operativo/exportar/excel' : '/reportes/operativo/exportar';
            const endpoint = `${rutaBase}?fechaInicio=${fechasAplicadas.inicio}&fechaFin=${fechasAplicadas.fin}`;

            // 2. Consumimos el endpoint (el método recibe la URL completa y procesa el Blob)
            const blob = await api.descargarArchivo(endpoint);

            // 3. Creamos la URL temporal para el archivo recibido
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // 4. Definimos la extensión correcta de salida (.xlsx para Excel, .csv para CSV)
            const extension = formato === 'excel' ? 'xlsx' : 'csv';
            link.setAttribute('download', `Logitrack_Reporte_${new Date().toISOString().split('T')[0]}.${extension}`);

            document.body.appendChild(link);
            link.click();

            // 5. Limpiamos el DOM
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('¡Exportación exitosa!', {
                description: `El archivo ${formato.toUpperCase()} se descargó correctamente desde el servidor.`,
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

    // Función auxiliar para formatear los kilos con separadores de miles y decimales
    const formatearKilos = (kilos: number | undefined) => {
        if (kilos === undefined) return '0';
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(kilos);
    };

    // Formateador para el porcentaje a tiempo
    const formatearPorcentaje = (valor: number | undefined) => {
        if (valor === undefined) return '0,00';
        return new Intl.NumberFormat('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(valor);
    };
    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Encabezado Principal Modificado para incluir el botón */}
                <Link
                    href="/menu"
                    className="text-[#198754] font-semibold mb-3 md:mb-4 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2 px-2 md:px-0">

                    {/* Título e Ícono (Izquierda en PC / Arriba en Móviles) */}
                    <div className="flex items-center gap-3">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
                            <ChartColumnBig className="h-7 w-7" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-1 text-xl md:text-2xl">Reporte Operativo</h4>
                            <p className="text-muted-foreground text-sm m-0">
                                Resumen de la actividad diaria: volumen de carga y estado de los viajes.
                            </p>
                        </div>
                    </div>

                    {/* Botón de Exportación con Menú Desplegable  (Derecha en PC / Abajo y full-width en Móviles)  */}
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
                {/* ... Fin del Encabezado Principal ... */}

                {/* --- CARTEL DE ADVERTENCIA NO INTRUSIVO --- */}
                {error && (
                    <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg flex items-center text-sm shadow-sm mb-6">
                        <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {/* --- BARRA DE FILTROS MODULARIZADA --- */}
                <DateRangeFilter
                    isLoading={isLoading}
                    onBuscar={handleBuscar}
                    onLimpiar={handleLimpiar}
                />

                {/* Grilla de Métricas Globales */}
                {/* Contenedor principal de la grilla (Layout Responsivo) */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                            {/* Nuevos Skeletons para Incidencias y Porcentaje */}
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
                        </>
                    ) : (
                        <>
                            {/* Tarjeta 1: Total de Viajes */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total de Viajes</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Truck className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {data ? (
                                        <>
                                            <div className="text-3xl font-bold text-foreground">{data.operativo?.totalViajes || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Viajes registrados en el período</p>
                                        </>
                                    ) : (
                                        <div className="flex items-center h-full pt-3">
                                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md w-full text-center">Filtre por fechas para calcular</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tarjeta 2: Kilos Transportados */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Kilos Transportados</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Scale className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {data ? (
                                        <>
                                            <div className="text-3xl font-bold text-foreground">{formatearKilos(data.operativo?.totalKilos)} <span className="text-lg font-normal text-muted-foreground">kg</span></div>
                                            <p className="text-xs text-muted-foreground mt-1">Volumen total de carga gestionada</p>
                                        </>
                                    ) : (
                                        <div className="flex items-center h-full pt-3">
                                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md w-full text-center">Filtre por fechas para calcular</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tarjeta 3: Envíos a Tiempo */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Envíos a Tiempo</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <CheckCircle className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {data ? (
                                        <>
                                            <div className="text-3xl font-bold text-foreground">{data.eficiencia?.cantidadEnviosATiempo || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Entregas dentro del plazo</p>
                                        </>
                                    ) : (
                                        <div className="flex items-center h-full pt-3">
                                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md w-full text-center">Filtre por fechas para calcular</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tarjeta 4: Kilos a Tiempo */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Kilos a Tiempo</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {data ? (
                                        <>
                                            <div className="text-3xl font-bold text-foreground">{formatearKilos(data.eficiencia?.totalKilosEnTiempo)} <span className="text-lg font-normal text-muted-foreground">kg</span></div>
                                            <p className="text-xs text-muted-foreground mt-1">Volumen entregado puntualmente</p>
                                        </>
                                    ) : (
                                        <div className="flex items-center h-full pt-3">
                                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md w-full text-center">Filtre por fechas para calcular</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tarjeta 5: Incidencias (Paso 3) */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Incidencias</CardTitle>
                                    <div className={`p-2 rounded-full ${data?.operativo?.totalIncidencias && data.operativo.totalIncidencias > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                                        <AlertTriangle className={`h-4 w-4 ${data?.operativo?.totalIncidencias && data.operativo.totalIncidencias > 0 ? 'text-destructive' : 'text-primary'}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {data ? (
                                        <>
                                            <div className={`text-3xl font-bold ${data.operativo?.totalIncidencias && data.operativo.totalIncidencias > 0 ? 'text-destructive' : 'text-foreground'}`}>
                                                {data.operativo?.totalIncidencias || 0}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Problemas reportados en el período</p>
                                        </>
                                    ) : (
                                        <div className="flex items-center h-full pt-3">
                                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md w-full text-center">Filtre por fechas para calcular</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tarjeta 6: Porcentaje a Tiempo / Efectividad (Paso 4) */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Efectividad de Entrega</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <Percent className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {data ? (
                                        <>
                                            <div className="text-3xl font-bold text-foreground">
                                                {formatearPorcentaje(data.eficiencia?.porcentajeATiempo)}
                                                <span className="text-lg font-normal text-muted-foreground"> %</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Porcentaje de viajes entregados a tiempo</p>
                                        </>
                                    ) : (
                                        <div className="flex items-center h-full pt-3">
                                            <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded-md w-full text-center">Filtre por fechas para calcular</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                        </>
                    )}
                </div>

                {/* Contenedor de Gráficos y Tablas */}
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 pb-8">

                    {/* Gráfico de Estados */}
                    {isLoading ? (
                        <Skeleton className="h-[400px] rounded-xl w-full" />
                    ) : (
                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <CardTitle>Desglose de Envíos por Estado</CardTitle>
                                <CardDescription>Distribución de las operaciones logísticas</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                {!data ? (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3 mt-2 border-2 border-dashed border-border rounded-xl">
                                        <ChartColumnBig className="h-10 w-10 opacity-20" />
                                        <p className="text-sm">Realice una búsqueda para ver el desglose por estados.</p>
                                    </div>
                                ) : datosGrafico.length > 0 ? (
                                    <div className="h-[300px] w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                                                <XAxis dataKey="estado" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                                                <Tooltip
                                                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                                                    contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    itemStyle={{ color: 'var(--foreground)' }}
                                                />
                                                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                                                    {datosGrafico.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-3 mt-2 border-2 border-dashed border-border rounded-xl">
                                        <ChartColumnBig className="h-10 w-10 opacity-20" />
                                        <p className="text-sm">No hay envíos registrados para los filtros actuales.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tabla de Granos */}
                    {isLoading ? (
                        <Skeleton className="h-[400px] rounded-xl w-full" />
                    ) : (
                        <Card className="shadow-sm flex flex-col">
                            <CardHeader>
                                <CardTitle>Volumen por Tipo de Grano</CardTitle>
                                <CardDescription>Desglose de envíos y peso transportado</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                {!data ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-3 border-2 border-dashed border-border rounded-xl p-6 text-center mt-2">
                                        <PackageOpen className="h-10 w-10 opacity-20" />
                                        <p className="text-sm">Realice una búsqueda para visualizar el desglose por tipo de grano.</p>
                                    </div>
                                ) : data.granos && data.granos.length > 0 ? (
                                    <div className="border rounded-md mt-2 overflow-hidden flex-1">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-foreground">Tipo de Grano</TableHead>
                                                    <TableHead className="text-right font-semibold text-foreground">Envíos</TableHead>
                                                    <TableHead className="text-right font-semibold text-foreground">Total (kg)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.granos.map((grano, index) => (
                                                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                                                        <TableCell className="font-medium">{formatearTextoEnum(grano.tipoGrano)}</TableCell>
                                                        <TableCell className="text-right">{grano.cantidadEnvios}</TableCell>
                                                        <TableCell className="text-right">{formatearKilos(grano.totalKilos)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-3 border-2 border-dashed border-border rounded-xl p-6 text-center mt-2">
                                        <PackageOpen className="h-10 w-10 opacity-20" />
                                        <p className="text-sm">No se encontraron movimientos de granos en el período seleccionado.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}