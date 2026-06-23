// Servicio de clima usando Open-Meteo (https://open-meteo.com)
// Es una API pública y gratuita que no requiere API key, ideal para
// consumir directamente desde el frontend con las coordenadas del envío.

export type CondicionClima =
    | 'DESPEJADO'
    | 'NUBLADO'
    | 'NIEBLA'
    | 'LLOVIZNA'
    | 'LLUVIA'
    | 'NIEVE'
    | 'TORMENTA'
    | 'DESCONOCIDO';

export interface ClimaActual {
    temperatura: number; // en °C
    condicion: CondicionClima;
    esDeNoche: boolean;
    codigoOriginal: number;
}

interface OpenMeteoResponse {
    current: {
        temperature_2m: number;
        weather_code: number;
        is_day: number; // 1 = día, 0 = noche
    };
}

const ENDPOINT_BASE = 'https://api.open-meteo.com/v1/forecast';

// Tabla de códigos WMO que devuelve Open-Meteo, agrupados en categorías simples
function mapearCodigoAClima(codigo: number): CondicionClima {
    if (codigo === 0) return 'DESPEJADO';
    if ([1, 2, 3].includes(codigo)) return 'NUBLADO';
    if ([45, 48].includes(codigo)) return 'NIEBLA';
    if ([51, 53, 55, 56, 57].includes(codigo)) return 'LLOVIZNA';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return 'LLUVIA';
    if ([71, 73, 75, 77, 85, 86].includes(codigo)) return 'NIEVE';
    if ([95, 96, 99].includes(codigo)) return 'TORMENTA';
    return 'DESCONOCIDO';
}

// Obtiene el clima actual para una coordenada dada
export async function obtenerClimaActual(
    lat: number,
    lng: number,
    signal?: AbortSignal
): Promise<ClimaActual> {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lng.toString(),
        current: 'temperature_2m,weather_code,is_day',
        timezone: 'auto',
    });

    const response = await fetch(`${ENDPOINT_BASE}?${params.toString()}`, { signal });

    if (!response.ok) {
        throw new Error('No se pudo obtener el clima');
    }

    const data: OpenMeteoResponse = await response.json();

    return {
        temperatura: Math.round(data.current.temperature_2m),
        condicion: mapearCodigoAClima(data.current.weather_code),
        esDeNoche: data.current.is_day === 0,
        codigoOriginal: data.current.weather_code,
    };
}