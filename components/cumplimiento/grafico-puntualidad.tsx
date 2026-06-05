import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Label
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface GraficoPuntualidadProps {
    porcentajeATiempo: number;
    porcentajeRetraso: number;
}

export function GraficoPuntualidad({ porcentajeATiempo, porcentajeRetraso }: GraficoPuntualidadProps) {
    // Preparamos los datos para Recharts, inyectando las variables CSS del proyecto
    const datosGrafico = [
        {
            name: 'A Tiempo',
            value: porcentajeATiempo,
            fill: 'var(--status-delivered)'
        },
        {
            name: 'Con Retraso',
            value: porcentajeRetraso,
            fill: 'hsl(var(--destructive))'
        }
    ];

    return (
        <Card className="shadow-sm h-full flex flex-col">
            <CardHeader>
                <CardTitle>Índice de Puntualidad</CardTitle>
                <CardDescription>Proporción global del mes en curso</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* Tooltip adaptado al tema claro/oscuro */}
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    color: 'var(--foreground)',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
                                formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                            />
                            <Pie
                                data={datosGrafico}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}  // Radio interno para crear el efecto "anillo"
                                outerRadius={90}  // Radio externo
                                paddingAngle={5}  // Espacio entre los segmentos
                                dataKey="value"
                                stroke="none"
                            >
                                {datosGrafico.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                {/* Etiqueta central con el porcentaje de éxito */}
                                <Label
                                    value={`${porcentajeATiempo}%`}
                                    position="center"
                                    fill="var(--foreground)"
                                    style={{
                                        fontSize: '36px',
                                        fontWeight: 'bold',
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Leyenda central descriptiva */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-muted-foreground mt-14 font-medium">
                            A Tiempo
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}