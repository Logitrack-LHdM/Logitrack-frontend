import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { EstadoEnvio } from '@/types'
import { ESTADO_CONFIG } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza un enum de Java para mostrar en UI
 * "EN_TRANSITO" -> "En Transito"
 */
// export function normalizarEnum(valorEnum: string): string {
//   if (!valorEnum) return '';
//   return valorEnum
//     .toLowerCase()
//     .replace(/_/g, ' ')
//     .replace(/\b\w/g, (c) => c.toUpperCase());
// }
// Diccionario con las excepciones que llevan tilde
const DICCIONARIO_TILDES: Record<string, string> = {
  'EN_TRANSITO': 'En Tránsito',
  'EN_PUNTO_DE_RECOLECCION': 'En Punto De Recolección',
  'MAIZ': 'Maíz',
  // Agrega aquí las palabras que vayas necesitando
};

export function normalizarEnum(valorEnum: string): string {
  if (!valorEnum) return '';

  // 1. Buscamos primero si la palabra requiere una tilde obligatoria
  if (DICCIONARIO_TILDES[valorEnum]) {
    return DICCIONARIO_TILDES[valorEnum];
  }

  // 2. Si no está en el diccionario, aplica el formato genérico estándar
  return valorEnum
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^\p{L}|\s\p{L})/gu, (c) => c.toUpperCase());
}

/**
 * Convierte texto UI a enum Java
 * "En Tránsito" -> "EN_TRANSITO"
 */
// export function enumParaJava(textoSelect: string): string {
//   if (!textoSelect) return '';
//   return textoSelect.toUpperCase().replace(/ /g, '_');
// }
export function enumParaJava(textoSelect: string): string {
  if (!textoSelect) return '';
  return textoSelect
    .normalize("NFD")                      // Separa la letra de su tilde (ej: 'ó' pasa a ser 'o' + '´')
    .replace(/[\u0300-\u036f]/g, "")      // Borra físicamente todas las tildes separadas
    .toUpperCase()
    .replace(/ /g, '_');
}


/**
 * Retorna la configuracion de estado (label, color, bgColor, icon)
 */
export function getEstadoConfig(estado: EstadoEnvio) {
  return ESTADO_CONFIG[estado] || ESTADO_CONFIG.PENDIENTE;
}

/**
 * Fuerza interpretación UTC agregando 'Z' si el backend no lo incluye,
 * luego convierte a hora de Argentina (UTC-3).
 */
function parsearFechaUTC(fechaISO: string): Date {
  if (!fechaISO) return new Date();
  // Si ya tiene zona horaria (Z, +00:00, -03:00, etc.), no tocar
  const tieneZona = /Z|[+-]\d{2}:\d{2}$/.test(fechaISO);
  return new Date(tieneZona ? fechaISO : fechaISO + 'Z');
}

export function formatearFecha(fechaISO: string): string {
  if (!fechaISO) return '-';
  return parsearFechaUTC(fechaISO).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export function formatearHora(fechaISO: string): string {
  if (!fechaISO) return '-';
  return parsearFechaUTC(fechaISO).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export function formatearFechaHora(fechaISO: string): string {
  if (!fechaISO) return '-';
  return `${formatearFecha(fechaISO)} ${formatearHora(fechaISO)}`;
}
/**
 * Obtiene el nombre completo del chofer
 */
export function getNombreChofer(chofer: { personaAsociada: { nombre: string; apellido: string } }): string {
  if (!chofer?.personaAsociada) return '-';
  return `${chofer.personaAsociada.nombre} ${chofer.personaAsociada.apellido}`;
}
/**
 * Formatea peso en kg
 */
export function formatearPeso(kg: number): string {
  if (!kg) return '0 kg';
  return `${kg.toLocaleString('es-AR')} kg`;
}

/**
 * Transforma un arreglo de coordenadas GeoJSON [Longitud, Latitud] 
 * al formato que requiere Leaflet [Latitud, Longitud].
 * * @param coordenadasGeoJson Arreglo de tuplas [longitud, latitud]
 * @returns Arreglo de tuplas [latitud, longitud]
 */
export const adaptarRutaParaLeaflet = (
  coordenadasGeoJson?: [number, number][]
): [number, number][] => {
  // Verificación de seguridad por si el backend envía null o un arreglo vacío
  if (!coordenadasGeoJson || coordenadasGeoJson.length === 0) {
    return [];
  }

  // Iteramos sobre el arreglo e invertimos el orden de cada tupla
  return coordenadasGeoJson.map(([longitud, latitud]) => [latitud, longitud]);
};
