import L from 'leaflet';

export const fixLeafletIcons = () => {
    // 1. Evitamos que este código se ejecute del lado del servidor (SSR)
    if (typeof window === 'undefined') return;

    // 2. Eliminamos la función por defecto que busca las imágenes en rutas relativas que Next.js no entiende
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    // 3. Forzamos a Leaflet a buscar las imágenes de los pines base en un CDN confiable
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
};