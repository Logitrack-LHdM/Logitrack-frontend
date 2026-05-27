'use client';

import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
// 1. Agregamos Polyline a las importaciones de react-leaflet
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-setup';

interface MapaClienteProps {
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    origenNombre?: string;
    destinoNombre?: string;
    // Nuevas propiedades para el rastreo en tiempo real:
    camionLat?: number;
    camionLng?: number;
    ruta?: [number, number][]; // Array de tuplas [latitud, longitud] ya adaptadas
}

// Función para crear un pin SVG personalizado con el color que le pasemos
const crearIconoPersonalizado = (colorFill: string) => {
    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorFill}" width="36px" height="36px" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `;

    return L.divIcon({
        html: svgString,
        className: 'bg-transparent border-none', // Anulamos el cuadrado blanco por defecto de Leaflet
        iconSize: [36, 36],
        iconAnchor: [18, 36], // El ancla es la punta de abajo al centro
        popupAnchor: [0, -36] // El popup se abre arriba del pin
    });
};

// Instanciamos los dos íconos usando los colores de tu interfaz
const iconoOrigen = crearIconoPersonalizado('#198754');
const iconoDestino = crearIconoPersonalizado('#0d6efd');

// Función para crear el marcador del camión en movimiento
const crearIconoCamion = (colorFondo: string) => {
    // SVG de un círculo con un camión de carga en el medio
    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36px" height="36px">
      <circle cx="18" cy="18" r="16" fill="${colorFondo}" stroke="white" stroke-width="2"/>
      <g transform="translate(8, 9) scale(0.85)">
        <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 9h4l4 4v5h-3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="7" cy="18" r="2" fill="none" stroke="white" stroke-width="2"/>
        <circle cx="17" cy="18" r="2" fill="none" stroke="white" stroke-width="2"/>
      </g>
    </svg>
  `;

    return L.divIcon({
        html: svgString,
        className: 'bg-transparent border-none', // Anulamos estilos por defecto
        iconSize: [36, 36],
        iconAnchor: [18, 18], // A diferencia de los pines, el ancla de un círculo es su centro exacto
        popupAnchor: [0, -18] // El popup se abre justo arriba del círculo
    });
};

// Instanciamos el ícono del camión usando el color ámbar de tu interfaz
const iconoCamion = crearIconoCamion('#f59e0b');

// Configuración visual para la Polyline (Ruta planificada)
const opcionesRuta = {
    color: '#64748b', // Gris pizarra (slate-500 de Tailwind)
    weight: 4,        // Grosor de la línea
    opacity: 0.8,     // Ligeramente transparente para no tapar calles del mapa base
    dashArray: '10, 10', // Crea el efecto de línea punteada
    lineJoin: 'round' as const // Suaviza las esquinas de la línea cuando el camión dobla
};

// Componente invisible para controlar la cámara del mapa
function AjusteEncuadre({
    origen,
    destino,
    camion,
    ruta
}: {
    origen?: [number, number];
    destino?: [number, number];
    camion?: [number, number];
    ruta?: [number, number][];
}) {
    const map = useMap();

    // 1. Ref para saber si ya encuadramos específicamente la RUTA completa
    const rutaEncuadrada = useRef(false);

    // 2. Ref para saber si ya hicimos el encuadre básico (origen/destino) cuando no había ruta
    const encuadreBasicoRealizado = useRef(false);

    useEffect(() => {
        // Prioridad Absoluta: Si llegó la ruta y AÚN NO la encuadramos
        if (ruta && ruta.length > 0 && !rutaEncuadrada.current) {
            const bounds = L.latLngBounds(ruta);
            map.fitBounds(bounds, { padding: [50, 50] });

            // Marcamos la ruta como encuadrada para que no vuelva a saltar la cámara 
            // con las actualizaciones de 30 segundos del camión
            rutaEncuadrada.current = true;
            encuadreBasicoRealizado.current = true; // Cancelamos el básico por las dudas
            return; // Salimos del efecto
        }

        // Fallback: Si no hay ruta todavía, y no hicimos el encuadre básico
        if (!rutaEncuadrada.current && !encuadreBasicoRealizado.current) {
            const puntosBase = [];
            if (origen) puntosBase.push(origen);
            if (destino) puntosBase.push(destino);
            if (camion) puntosBase.push(camion);

            if (puntosBase.length > 1) {
                const bounds = L.latLngBounds(puntosBase);
                map.fitBounds(bounds, { padding: [50, 50] });
                encuadreBasicoRealizado.current = true;
            } else if (puntosBase.length === 1) {
                map.setView(puntosBase[0], 13);
                encuadreBasicoRealizado.current = true;
            }
        }
    }, [map, origen, destino, camion, ruta]);

    return null;
}

const MapaCliente = memo(function MapaCliente({
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
    origenNombre = 'Origen',
    destinoNombre = 'Destino',
    camionLat,
    camionLng,
    ruta = [] // Por defecto un array vacío para evitar errores de iteración
}: MapaClienteProps) {

    useEffect(() => {
        fixLeafletIcons();
    }, []);

    // Coordenadas por defecto (Buenos Aires) como plan de contingencia
    const centroPorDefecto: [number, number] = [-34.6037, -58.3816];

    // Preparamos las tuplas de coordenadas para pasarlas más fácil
    const coordsOrigen: [number, number] | undefined =
        origenLat !== undefined && origenLng !== undefined ? [origenLat, origenLng] : undefined;

    const coordsDestino: [number, number] | undefined =
        destinoLat !== undefined && destinoLng !== undefined ? [destinoLat, destinoLng] : undefined;

    // 2. Preparamos las coordenadas del camión
    const coordsCamion: [number, number] | undefined =
        camionLat !== undefined && camionLng !== undefined ? [camionLat, camionLng] : undefined;

    const centroInicial = coordsOrigen || centroPorDefecto;

    return (
        <div className="h-full w-full rounded-xl overflow-hidden relative z-[1]">
            <MapContainer
                center={centroInicial}
                zoom={11}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Ejecutamos la lógica de encuadre */}
                <AjusteEncuadre
                    origen={coordsOrigen}
                    destino={coordsDestino}
                    camion={coordsCamion}
                    ruta={ruta}
                />

                {/* 3. Renderizamos la Polyline (Ruta planificada) solo si hay coordenadas */}
                {ruta.length > 0 && (
                    <Polyline
                        positions={ruta}
                        pathOptions={opcionesRuta}
                    />
                )}

                {/* Marcador de Origen con su ícono verde (solo se dibuja si existen las coordenadas)*/}
                {coordsOrigen && (
                    <Marker position={coordsOrigen} icon={iconoOrigen}>
                        <Popup>
                            <span className="font-bold text-[#198754]">Origen:</span> {origenNombre}
                        </Popup>
                    </Marker>
                )}

                {/* Marcador de Destino con su ícono azul (solo se dibuja si existen las coordenadas)*/}
                {coordsDestino && (
                    <Marker position={coordsDestino} icon={iconoDestino}>
                        <Popup>
                            <span className="font-bold text-blue-600">Destino:</span> {destinoNombre}
                        </Popup>
                    </Marker>
                )}

                {/* 4. Renderizamos el marcador del camión en movimiento */}
                {coordsCamion && (
                    <Marker position={coordsCamion} icon={iconoCamion}>
                        <Popup>
                            <span className="font-bold text-amber-500">Ubicación Actual</span>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
});

// Exportamos el componente ya memorizado
export default MapaCliente;