'use client';

import React, { useMemo, useState } from 'react';
import { Truck, Scale, ArrowLeftCircle, ChartColumnBig, FileDown, Loader2, Clock, CheckCircle, PackageOpen } from 'lucide-react'; import {
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
import { exportReporteOperativoCsvMock } from '@/lib/export-mock';
import { adaptarDatosParaGrafico, formatearTextoEnum, formatearFechaIsoLocal } from '@/utils/formatters';
import { api } from '@/lib/api';

export default function ReporteOperativoPage() {
    // 1. Estados iniciales: Ahora por defecto arranca en "historico"
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [rango, setRango] = useState<RangoReporte | ''>('');
    // 2. Conectamos nuestro nuevo hook manual
    const { data, isLoading, error, ejecutarBusqueda, limpiarDatos } = useReporteOperativo();

    // 3. Modificamos el useMemo para que soporte que data sea null inicialmente
    const datosGrafico = useMemo(() => {
        return adaptarDatosParaGrafico(data?.estados || []);
    }, [data?.estados]);

    // --- NUEVAS FUNCIONES DE BÚSQUEDA (Fase 3) ---
    const handleBuscar = () => {
        // Preparamos las fechas. Si es histórico, simulamos las fechas extremas.
        const fechaHistorico = '2000-01-01';
        const fechaHoy = formatearFechaIsoLocal(new Date()) || '';

        const filtros = {
            fechaInicio: rango === 'historico' ? fechaHistorico : fechaInicio,
            fechaFin: rango === 'historico' ? fechaHoy : fechaFin
        };

        ejecutarBusqueda(filtros);
    };

    const handleLimpiar = () => {
        setRango(''); // Vuelve al estado inicial "Seleccione un rango"
        setFechaInicio('');
        setFechaFin('');
        limpiarDatos();
    };

    // Validación en tiempo real para la advertencia
    const faltaUnaFecha = Boolean((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin));

    // NUEVO: El botón buscar se deshabilita si NO es histórico y faltan fechas (una o ambas)
    const faltanFechas = !fechaInicio || !fechaFin;
    const isBotonBuscarDeshabilitado = isLoading || (rango !== 'historico' && faltanFechas);

    // --- LÓGICA DE SINCRONIZACIÓN DE FILTROS (Fase 2) ---

    // Función para calcular las fechas restando días a la fecha de hoy
    const calcularFechasRango = (diasAtras: number) => {
        const fechaActual = new Date();
        const fechaPasada = new Date();
        fechaPasada.setDate(fechaActual.getDate() - diasAtras);

        return {
            inicio: formatearFechaIsoLocal(fechaPasada) || '',
            fin: formatearFechaIsoLocal(fechaActual) || ''
        };
    };

    // Manejador del cambio en el Selector de Rango
    const handleRangoChange = (nuevoRango: RangoReporte) => {
        setRango(nuevoRango);

        if (nuevoRango === 'historico') {
            setFechaInicio('');
            setFechaFin('');
        } else if (nuevoRango === 'ultimos7dias') {
            const fechas = calcularFechasRango(7);
            setFechaInicio(fechas.inicio);
            setFechaFin(fechas.fin);
        } else if (nuevoRango === 'ultimos30dias') {
            const fechas = calcularFechasRango(30);
            setFechaInicio(fechas.inicio);
            setFechaFin(fechas.fin);
        } else if (nuevoRango === 'ultimos90dias') {
            const fechas = calcularFechasRango(90);
            setFechaInicio(fechas.inicio);
            setFechaFin(fechas.fin);
        }
    };

    // Manejador del cambio manual en los Inputs de Fecha
    const handleFechaChange = (tipo: 'inicio' | 'fin', valor: string) => {
        if (tipo === 'inicio') setFechaInicio(valor);
        if (tipo === 'fin') setFechaFin(valor);

        // Si el usuario toca las fechas manualmente, el selector cambia a "Otro"
        setRango('otro');
    };

    // Estado para la exportación
    const [isExporting, setIsExporting] = useState(false);

    // 4. Controlador del botón de exportación actualizado
    // const handleExport = async () => {
    //     setIsExporting(true);
    //     try {
    //         // Ahora le pasamos la "foto" exacta de los datos actuales con filtros aplicados
    //         await exportReporteOperativoCsvMock(data);
    //         toast.success('¡Exportación exitosa!', {
    //             description: 'El archivo CSV se ha descargado correctamente en su dispositivo.',
    //         });
    //     } catch (err) {
    //         console.error("Error en exportación:", err);
    //         toast.error('Error al exportar', {
    //             description: err instanceof Error ? err.message : 'Hubo un problema al generar el archivo. Por favor, intente nuevamente.',
    //         });
    //     } finally {
    //         setIsExporting(false);
    //     }
    // };

    const handleExport = async () => {
        setIsExporting(true);
        try {

            // CONSTRUIMOS EL ENDPOINT CON LOS QUERY PARAMETERS
            const endpoint = `/reportes/operativo/exportar?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;

            // 1. Llamas al endpoint real de Spring Boot (la URL dependerá de lo que defina el backend)
            const blob = await api.descargarArchivoCsv(endpoint);

            // 2. Creas una URL temporal para el archivo recibido
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // 3. Fuerzas la descarga
            link.setAttribute('download', `Logitrack_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();

            // 4. Limpias el DOM
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('¡Exportación exitosa!', {
                description: 'El archivo se descargó correctamente desde el servidor.',
            });
        } catch (err) {
            console.error("Error en exportación:", err);
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

    // // Manejo de estado de error visual
    // if (error) {
    //     return (
    //         <div className="container mx-auto px-4 py-8">
    //             <div className="max-w-6xl mx-auto">
    //                 <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex justify-between items-center">
    //                     <div>
    //                         <h2 className="font-semibold text-lg">Error en el reporte</h2>
    //                         <p>{error}</p>
    //                     </div>
    //                     <Button variant="outline" onClick={() => { setFechaInicio(''); setFechaFin(''); }}>
    //                         Limpiar Filtros
    //                     </Button>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Encabezado de la página */}
                {/* Botón Volver */}
                <Link
                    href="/menu"
                    className="text-[#198754] font-semibold mb-3 md:mb-4 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
                </Link>

                {/* Encabezado Principal (Réplica exacta de tu HTML) */}
                {/* <div className="flex items-center gap-3 mb-6 mt-2 px-2 md:px-0">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
                        <ChartColumnBig className="h-7 w-7" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 mb-1 text-xl md:text-2xl">Reporte Operativo</h4>
                        <p className="text-muted-foreground text-sm m-0">
                            Resumen de la actividad diaria: volumen de carga y estado de los viajes.
                        </p>
                    </div>
                </div> */}

                {/* Encabezado Principal Modificado para incluir el botón */}
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

                    {/* Botón de Exportación (Derecha en PC / Abajo y full-width en Móviles) */}
                    <Button
                        className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white w-full sm:w-auto shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                        disabled={isExporting || isLoading || !data}
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
                {/* ... Fin del Encabezado Principal ... */}

                {/* --- CARTEL DE ADVERTENCIA NO INTRUSIVO --- */}
                {error && (
                    <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg flex justify-between items-center text-sm shadow-sm">
                        <p className="font-medium">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setFechaInicio(''); setFechaFin(''); }}
                            className="hover:bg-destructive/20 text-destructive"
                        >
                            Limpiar fechas
                        </Button>
                    </div>
                )}

                {/* --- NUEVA BARRA DE FILTROS --- */}
                <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm mb-6 relative">

                    {/* Alerta si falta una fecha (Flotante arriba) */}
                    {faltaUnaFecha && (
                        <div className="absolute -top-6 right-0 text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-md animate-in fade-in zoom-in">
                            Debe seleccionar ambas fechas
                        </div>
                    )}

                    {/* Usamos un Grid de 4 columnas, alineando el contenido hacia abajo (items-end) para que los botones cuadren con los inputs */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">

                        {/* 1. Rango de Días */}
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-medium text-muted-foreground px-1">
                                Rango de Días
                            </label>
                            <Select
                                value={rango}
                                onValueChange={(value) => handleRangoChange(value as RangoReporte)}
                            >
                                <SelectTrigger className="w-full bg-background">
                                    <SelectValue placeholder="Seleccione un rango" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="historico">Histórico Completo</SelectItem>
                                    <SelectItem value="ultimos7dias">Últimos 7 días</SelectItem>
                                    <SelectItem value="ultimos30dias">Últimos 30 días</SelectItem>
                                    <SelectItem value="ultimos90dias">Últimos 90 días</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 2. Fecha Inicio */}
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-medium text-muted-foreground px-1">
                                Fecha Inicio
                            </label>
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => handleFechaChange('inicio', e.target.value)}
                                className="w-full bg-background disabled:opacity-50"
                                max={fechaFin || undefined}
                                disabled={rango === 'historico'}
                            />
                        </div>

                        {/* 3. Fecha Fin */}
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-medium text-muted-foreground px-1">
                                Fecha Fin
                            </label>
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => handleFechaChange('fin', e.target.value)}
                                className="w-full bg-background disabled:opacity-50"
                                min={fechaInicio || undefined}
                                disabled={rango === 'historico'}
                            />
                        </div>

                        {/* 4. Botones de Acción */}
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <Button
                                variant="outline"
                                onClick={handleLimpiar}
                                className="w-full"
                                disabled={isLoading}
                            >
                                Limpiar
                            </Button>

                            <Button
                                onClick={handleBuscar}
                                disabled={isBotonBuscarDeshabilitado}
                                className="w-full bg-[#1b4332] hover:bg-[#2d6a4f] text-white"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Buscar
                            </Button>
                        </div>

                    </div>
                </div>

                {/* Grilla de Métricas Globales */}
                {/* Contenedor principal de la grilla (Layout Responsivo) */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-32 rounded-xl" />
                            <Skeleton className="h-32 rounded-xl" />
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