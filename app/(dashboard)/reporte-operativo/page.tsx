'use client';

import React, { useMemo, useState } from 'react';
import { Truck, Scale, ArrowLeftCircle, ChartColumnBig, FileDown, Loader2 } from 'lucide-react';
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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReporteOperativo } from '@/hooks/use-reporte-operativo';
import { DesgloseEstados } from '@/types/reporte-operativo';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // <-- Importamos el componente Button
import { useToast } from '@/hooks/use-toast'; // <-- Asumiendo que tu hook de notificaciones está aquí o en @/components/ui/use-toast
import { api } from '@/lib/api'; // Importas tu cliente API real

// Importamos nuestra función mock (Fase 2.2)
import { exportReporteOperativoCsvMock } from '@/lib/export-mock';

// Función para adaptar los datos crudos al formato del gráfico inyectando variables CSS
const adaptarDatosParaGrafico = (desglose: DesgloseEstados | undefined) => {
    if (!desglose) return [];
    return [
        { estado: 'Pendientes', cantidad: desglose.pendientes, fill: 'var(--status-pending)' },
        { estado: 'En Tránsito', cantidad: desglose.enTransito, fill: 'var(--status-transit)' },
        { estado: 'En Recolección', cantidad: desglose.enPuntoRecoleccion, fill: 'var(--status-pickup)' },
        { estado: 'Entregados', cantidad: desglose.entregados, fill: 'var(--status-delivered)' },
        { estado: 'Cancelados', cantidad: desglose.cancelados, fill: 'var(--status-cancelled)' }
    ];
};

export default function ReporteOperativoPage() {
    // Conectamos nuestro servicio simulado
    const { data, isLoading, error } = useReporteOperativo();

    // Memorizamos los datos del gráfico para evitar re-renderizados innecesarios
    const datosGrafico = useMemo(() => adaptarDatosParaGrafico(data?.desgloseEstados), [data]);


    // Estados y hooks para la exportación (Fases 3.1 y 3.2)
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    // Controlador del botón de exportación
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportReporteOperativoCsvMock();

            toast({
                title: "¡Exportación exitosa!",
                description: "El archivo CSV se ha descargado correctamente en su dispositivo.",
                variant: "default",
            });
        } catch (err) {
            console.error("Error en exportación:", err);
            toast({
                title: "Error al exportar",
                description: "Hubo un problema al generar el archivo. Por favor, intente nuevamente.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    // const handleExport = async () => {
    //     setIsExporting(true);
    //     try {
    //         // 1. Llamas al endpoint real de Spring Boot (la URL dependerá de lo que defina el backend)
    //         const blob = await api.descargarArchivoCsv('/reportes/operativo/exportar');

    //         // 2. Creas una URL temporal para el archivo recibido
    //         const url = window.URL.createObjectURL(blob);
    //         const link = document.createElement('a');
    //         link.href = url;

    //         // 3. Fuerzas la descarga
    //         link.setAttribute('download', `Logitrack_Reporte_${new Date().toISOString().split('T')[0]}.csv`);
    //         document.body.appendChild(link);
    //         link.click();

    //         // 4. Limpias el DOM
    //         document.body.removeChild(link);
    //         window.URL.revokeObjectURL(url);

    //         toast({
    //             title: "¡Exportación exitosa!",
    //             description: "El archivo se descargó correctamente desde el servidor.",
    //         });
    //     } catch (err) {
    //         toast({
    //             title: "Error al exportar",
    //             description: "El servidor no pudo generar el archivo.",
    //             variant: "destructive",
    //         });
    //     } finally {
    //         setIsExporting(false);
    //     }
    // };

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

                {/* Grilla de Métricas Globales */}
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
                            {/* Tarjeta: Total de Viajes */}
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

                            {/* Tarjeta: Kilos Transportados */}
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

                {/* Sección: Desglose de Estados */}
                {/* Contenedor para la sección del desglose de estados */}
                <div className="grid gap-6 grid-cols-1">

                    {isLoading ? (
                        /* Skeleton para el gráfico */
                        <Skeleton className="h-[400px] rounded-xl w-full" />
                    ) : (
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>Desglose de Envíos por Estado</CardTitle>
                                <CardDescription>Distribución actual de las operaciones logísticas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                                            <XAxis
                                                dataKey="estado"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                                                contentStyle={{
                                                    backgroundColor: 'var(--card)',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--foreground)',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                                }}
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
                            </CardContent>
                        </Card>
                    )}

                </div>

            </div>
        </div>
    );
}