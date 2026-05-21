'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fixLeafletIcons } from '@/lib/leaflet-setup';

export default function MapaCliente() {
    // Ejecutamos el parche de los íconos una sola vez al montar el componente
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    // Coordenadas de prueba (ej. Buenos Aires)
    const posicionPrueba: [number, number] = [-34.6037, -58.3816];

    return (
        // Es crucial el z-[1] para que el mapa no se superponga por encima de 
        // tus modales (Dialogs) o selects (SelectContent) en la UI.
        <div className="h-full w-full rounded-xl overflow-hidden relative z-[1]">
            <MapContainer
                center={posicionPrueba}
                zoom={13}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={posicionPrueba}>
                    <Popup>Ubicación de prueba</Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}