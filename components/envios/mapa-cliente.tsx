'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-setup';

// Definimos las props que el mapa necesita recibir
interface MapaClienteProps {
    origenLat?: number;
    origenLng?: number;
    destinoLat?: number;
    destinoLng?: number;
    origenNombre?: string;
    destinoNombre?: string;
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

    // Si tenemos las coordenadas de origen, centramos ahí inicialmente
    const tieneOrigen = origenLat !== undefined && origenLng !== undefined;
    const centroInicial: [number, number] = tieneOrigen
        ? [origenLat!, origenLng!]
        : centroPorDefecto;

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

                {/* Marcador de Origen (solo se dibuja si existen las coordenadas) */}
                {origenLat !== undefined && origenLng !== undefined && (
                    <Marker position={[origenLat, origenLng]}>
                        <Popup>
                            <span className="font-bold text-[#198754]">Origen:</span> {origenNombre}
                        </Popup>
                    </Marker>
                )}

                {/* Marcador de Destino (solo se dibuja si existen las coordenadas) */}
                {destinoLat !== undefined && destinoLng !== undefined && (
                    <Marker position={[destinoLat, destinoLng]}>
                        <Popup>
                            <span className="font-bold text-blue-600">Destino:</span> {destinoNombre}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}