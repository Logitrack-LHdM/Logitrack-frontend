'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-setup';

interface MapaClienteProps {
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    origenNombre?: string;
    destinoNombre?: string;
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

// Componente invisible para controlar la cámara del mapa
function AjusteEncuadre({
    origen,
    destino
}: {
    origen?: [number, number];
    destino?: [number, number];
}) {
    const map = useMap(); // Obtenemos la instancia real de Leaflet

    useEffect(() => {
        if (origen && destino) {
            // 1. Creamos una "caja" (bounding box) que envuelve ambos puntos
            const bounds = L.latLngBounds([origen, destino]);

            // 2. Le pedimos a Leaflet que ajuste el zoom para que la caja entre en pantalla.
            // El padding asegura que los pines no queden pegados a los bordes del contenedor.
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (origen) {
            map.setView(origen, 13);
        } else if (destino) {
            map.setView(destino, 13);
        }
    }, [map, origen, destino]);

    return null; // No renderiza nada en el DOM
}

export default function MapaCliente({
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
    origenNombre = 'Origen',
    destinoNombre = 'Destino',
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
                <AjusteEncuadre origen={coordsOrigen} destino={coordsDestino} />

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
            </MapContainer>
        </div>
    );
}