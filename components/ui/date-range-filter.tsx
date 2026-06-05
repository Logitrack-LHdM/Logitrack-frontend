'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Importamos nuestra nueva utilidad matemática y de formato
import { calcularFechasRango, formatearFechaIsoLocal } from '@/utils/formatters';

// Definimos los tipos aquí para desacoplarlo de los DTOs de "reportes" específicos
export type RangoFechas = 'historico' | 'ultimos7dias' | 'ultimos30dias' | 'ultimos90dias' | 'otro';

export interface FiltrosFechas {
    fechaInicio: string;
    fechaFin: string;
    rango: string;
}

interface DateRangeFilterProps {
    isLoading: boolean;
    onBuscar: (filtros: FiltrosFechas) => void;
    onLimpiar: () => void;
}

export function DateRangeFilter({ isLoading, onBuscar, onLimpiar }: DateRangeFilterProps) {
    const [rango, setRango] = useState<RangoFechas | ''>('');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

    // Manejador del cambio en el Selector de Rango
    const handleRangoChange = (nuevoRango: RangoFechas) => {
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
        setRango('otro'); // Si el usuario toca las fechas manualmente, cambia a "Otro"
    };

    const handleLimpiarClick = () => {
        setRango('');
        setFechaInicio('');
        setFechaFin('');
        onLimpiar();
    };

    const handleBuscarClick = () => {
        const fechaHistorico = '2000-01-01';
        const fechaHoy = formatearFechaIsoLocal(new Date()) || '';

        const filtros = {
            fechaInicio: rango === 'historico' ? fechaHistorico : fechaInicio,
            fechaFin: rango === 'historico' ? fechaHoy : fechaFin,
            rango: rango
        };

        onBuscar(filtros);
    };

    // Validaciones
    const faltaUnaFecha = Boolean((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin));
    const faltanFechas = !fechaInicio || !fechaFin;
    const isBotonBuscarDeshabilitado = isLoading || (rango !== 'historico' && faltanFechas);

    return (
        <div className="bg-card p-4 md:p-5 rounded-xl border border-border shadow-sm mb-6 relative">
            {faltaUnaFecha && (
                <div className="absolute -top-6 right-0 text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-md animate-in fade-in zoom-in">
                    Debe seleccionar ambas fechas
                </div>
            )}

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                {/* 1. Rango de Días */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-medium text-muted-foreground px-1">
                        Rango de Días
                    </label>
                    <Select value={rango} onValueChange={(value) => handleRangoChange(value as RangoFechas)}>
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
                        className="w-full bg-background disabled:opacity-50 focus-visible:ring-[#198754]"
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
                        className="w-full bg-background disabled:opacity-50 focus-visible:ring-[#198754]"
                        min={fechaInicio || undefined}
                        disabled={rango === 'historico'}
                    />
                </div>

                {/* 4. Botones de Acción */}
                <div className="grid grid-cols-2 gap-2 w-full">
                    <Button variant="outline" onClick={handleLimpiarClick} className="w-full" disabled={isLoading}>
                        Limpiar
                    </Button>
                    <Button onClick={handleBuscarClick} disabled={isBotonBuscarDeshabilitado} className="w-full bg-[#1b4332] hover:bg-[#2d6a4f] text-white">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Buscar
                    </Button>
                </div>
            </div>
        </div>
    );
}