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