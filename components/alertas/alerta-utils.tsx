'use client';

import {
  Wrench,
  CloudRain,
  CarFront,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EstadoAlerta, TipoIncidencia } from '@/types';

// --- COMPONENTE: BADGE DE ESTADO ---
interface AlertaEstadoBadgeProps {
  estado: EstadoAlerta;
  className?: string;
}

export function AlertaEstadoBadge({ estado, className }: AlertaEstadoBadgeProps) {
  // Configuramos colores semánticos. Pendiente y No Resuelta usan tonos de alerta.
  const config = {
    PENDIENTE: {
      label: 'Pendiente',
      badgeClass: 'bg-red-100 text-red-700 border-red-200',
      Icon: AlertTriangle,
    },
    NO_RESUELTA: {
      label: 'No Resuelta',
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
      Icon: Clock,
    },
    RESUELTA: {
      label: 'Resuelta',
      badgeClass: 'bg-green-100 text-green-700 border-green-200',
      Icon: CheckCircle2,
    },
  };

  const { label, badgeClass, Icon } = config[estado];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide",
        badgeClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// --- COMPONENTE: ÍCONO DE INCIDENCIA ---
interface IncidenciaIconProps {
  tipo: TipoIncidencia;
  className?: string;
}

export function IncidenciaIcon({ tipo, className }: IncidenciaIconProps) {
  // Mapeamos cada tipo de incidencia al ícono de Lucide más representativo
  const iconMap: Record<TipoIncidencia, React.ElementType> = {
    MECANICA: Wrench,
    CLIMA: CloudRain,
    TRAFICO: CarFront,
    CONTROLES: ShieldAlert,
    OTRO: AlertCircle,
  };

  const Icon = iconMap[tipo] || AlertCircle;

  return (
    <div className={cn("p-2 rounded-lg shrink-0 flex items-center justify-center", className)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

// --- UTILIDAD: TEXTOS DE INCIDENCIA ---
// Pequeña función para normalizar el texto del tipo de incidencia en la UI
export function formatTipoIncidencia(tipo: TipoIncidencia): string {
  const formatMap: Record<TipoIncidencia, string> = {
    MECANICA: 'Falla Mecánica',
    CLIMA: 'Problema Climático',
    TRAFICO: 'Inconveniente de Tráfico',
    CONTROLES: 'Demora en Controles',
    OTRO: 'Otro Inconveniente',
  };
  return formatMap[tipo] || 'Incidencia no especificada';
}