import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface GraficoPuntualidadProps {
    porcentajeATiempo: number;
    porcentajeRetraso: number;
}

export function GraficoPuntualidad({ porcentajeATiempo, porcentajeRetraso }: GraficoPuntualidadProps) {
    const data = [
        { name: 'A Tiempo', value: porcentajeATiempo, color: 'var(--status-delivered)' },
        { name: 'Con Retraso', value: porcentajeRetraso, color: 'var(--destructive)' }
    ];

    return (
        <Card className="shadow-sm h-full flex flex-col">
            <CardHeader>
                <CardTitle>Índice de Puntualidad</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-between gap-4">

                {/* Lado izquierdo: El gráfico */}
                <div className="h-[120px] w-[120px] relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: 'var(--foreground)' }}
                            />
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Porcentaje principal en el centro del anillo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-foreground">{porcentajeATiempo}%</span>
                    </div>
                </div>

                {/* Lado derecho: Leyenda detallada */}
                <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--status-delivered)]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>A Tiempo</span>
                        </div>
                        <span className="text-xl font-bold mt-0.5">{porcentajeATiempo}%</span>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Con Retraso</span>
                        </div>
                        <span className="text-xl font-bold mt-0.5">{porcentajeRetraso}%</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}