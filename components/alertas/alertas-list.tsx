'use client';

import { CheckCircle2 } from 'lucide-react';
import type { AlertaListadoDTO } from '@/types';
import { AlertaCard } from './alerta-card';

interface AlertasListProps {
    alertas: AlertaListadoDTO[];
    onResolver: (id: number) => void;
}

export function AlertasList({ alertas, onResolver }: AlertasListProps) {
    // Aseguramos que las alertas estén ordenadas desde la más reciente a la más antigua (Criterio 1)
    const alertasOrdenadas = [...alertas].sort(
        (a, b) => new Date(b.fechaReporte).getTime() - new Date(a.fechaReporte).getTime()
    );

    // Separamos visualmente las urgentes de las resueltas (opcional pero recomendado para UX)
    const alertasActivas = alertasOrdenadas.filter(a => a.estado !== 'RESUELTA');
    const alertasResueltas = alertasOrdenadas.filter(a => a.estado === 'RESUELTA');

    if (alertas.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500/50 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Todo en orden</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                    No hay alertas ni incidencias registradas en este momento. Los viajes se están desarrollando con normalidad.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Sección de Alertas Activas (Pendientes y No Resueltas) */}
            {alertasActivas.length > 0 && (
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        Incidencias que requieren atención
                        <span className="bg-red-100 text-red-700 text-xs py-0.5 px-2 rounded-full font-bold">
                            {alertasActivas.length}
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                        {alertasActivas.map((alerta) => (
                            <AlertaCard
                                key={alerta.id}
                                alerta={alerta}
                                onResolver={onResolver}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Sección de Historial (Resueltas) */}
            {alertasResueltas.length > 0 && (
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-t pt-6">
                        Historial de resueltas
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                        {alertasResueltas.map((alerta) => (
                            <AlertaCard
                                key={alerta.id}
                                alerta={alerta}
                            // No pasamos onResolver para las que ya están resueltas
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}