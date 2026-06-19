import type { CartaPorteDTO } from '@/types';

/**
 * Genera un string en formato JSON optimizado y comprimido 
 * con los datos estrictamente legales para el código QR de la Carta de Porte.
 */
export function generarPayloadQR(cartaPorte: CartaPorteDTO): string {
    // Mapeamos a un objeto con claves cortas para ahorrar la mayor cantidad de bytes posibles
    // y cumplir estrictamente con los datos legales requeridos en ruta.
    const payloadOptimizada = {
        cpe: cartaPorte.cpe,
        pat: cartaPorte.patenteCamion,
        chf: `${cartaPorte.cuilChofer} - ${cartaPorte.licenciaChofer}`,
        grn: cartaPorte.tipoGrano,
        kg: cartaPorte.pesoEstimadoKg,
        dst: cartaPorte.destino
    };

    // Retornamos el JSON stringificado sin formato (sin espacios ni indentación)
    // Ej: {"cpe":"...","pat":"...","chf":"...","grn":"...","kg":30000,"dst":"..."}
    return JSON.stringify(payloadOptimizada);
}

/**
 * Genera la URL absoluta para la descarga del PDF de la Carta de Porte.
 * Esta URL es la que se inyectará en el Código QR.
 */
export function generarUrlPdfCartaPorte(idEnvio: string): string {
    // Obtenemos la URL base de las variables de entorno, con un fallback para desarrollo local
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

    return `${API_BASE_URL}/envios/${idEnvio}/pdf-carta-porte`;
}