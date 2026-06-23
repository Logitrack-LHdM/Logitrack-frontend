'use client';

import {
    Sun,
    Moon,
    Cloud,
    CloudFog,
    CloudDrizzle,
    CloudRain,
    CloudSnow,
    CloudLightning,
    LoaderCircle,
} from 'lucide-react';
import type { ClimaActual, CondicionClima } from '@/lib/clima';

interface ClimaBadgeProps {
    clima: ClimaActual | null;
    isLoading: boolean;
    error: boolean;
}

// Mapeamos cada condición a un ícono y una etiqueta legible.
// El ícono de "despejado" cambia a luna si es de noche.
function obtenerVisual(condicion: CondicionClima, esDeNoche: boolean) {
    switch (condicion) {
        case 'DESPEJADO':
            return esDeNoche
                ? { Icono: Moon, label: 'Despejado', color: '#6366f1' }
                : { Icono: Sun, label: 'Despejado', color: '#f59e0b' };
        case 'NUBLADO':
            return { Icono: Cloud, label: 'Nublado', color: '#64748b' };
        case 'NIEBLA':
            return { Icono: CloudFog, label: 'Niebla', color: '#94a3b8' };
        case 'LLOVIZNA':
            return { Icono: CloudDrizzle, label: 'Llovizna', color: '#0ea5e9' };
        case 'LLUVIA':
            return { Icono: CloudRain, label: 'Lluvia', color: '#0d6efd' };
        case 'NIEVE':
            return { Icono: CloudSnow, label: 'Nieve', color: '#38bdf8' };
        case 'TORMENTA':
            return { Icono: CloudLightning, label: 'Tormenta', color: '#7c3aed' };
        default:
            return { Icono: Cloud, label: 'Sin datos', color: '#94a3b8' };
    }
}

export function ClimaBadge({ clima, isLoading, error }: ClimaBadgeProps) {
    // Mientras carga el primer dato (todavía no hay nada para mostrar)
    if (isLoading && !clima) {
        return (
            <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm shadow-md rounded-full px-3 py-1.5 text-xs font-medium text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Clima...
            </div>
        );
    }

    // Si falló y no tenemos ningún dato previo, no mostramos nada (falla silenciosa)
    if (error && !clima) return null;

    if (!clima) return null;

    const { Icono, label, color } = obtenerVisual(clima.condicion, clima.esDeNoche);

    return (
        <div
            className="absolute top-3 right-3 z-[1000] flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-md rounded-full pl-2 pr-3 py-1.5"
            title={`${label}, ${clima.temperatura}°C`}
        >
            <Icono className="h-5 w-5 shrink-0" style={{ color }} />
            <span className="text-sm font-bold text-slate-800 leading-none">
                {clima.temperatura}°C
            </span>
            <span className="text-xs font-medium text-slate-500 leading-none hidden sm:inline">
                {label}
            </span>
        </div>
    );
}