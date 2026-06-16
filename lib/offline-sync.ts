import { get, set } from 'idb-keyval';
import type { AccionOffline, TipoAccionOffline, PayloadCambioEstado, PayloadIncidencia } from '@/types';

// La clave bajo la cual guardaremos nuestra lista de acciones en IndexedDB
const OFFLINE_QUEUE_KEY = 'logitrack_offline_queue';

/**
 * Agrega una nueva acción a la cola de pendientes.
 * Genera automáticamente un ID único y la marca de tiempo (timestamp).
 */
export async function agregarAccionACola(
    tipo: TipoAccionOffline,
    payload: PayloadCambioEstado | PayloadIncidencia
): Promise<void> {
    try {
        // 1. Obtenemos la cola actual (o un array vacío si no existe)
        const colaActual = (await get<AccionOffline[]>(OFFLINE_QUEUE_KEY)) || [];

        // 2. Construimos el nuevo objeto de la acción
        const nuevaAccion: AccionOffline = {
            id: crypto.randomUUID(), // Identificador único estándar
            tipo,
            payload,
            timestamp: Date.now(), // Fundamental para tu tarea de backend #429
        };

        // 3. Guardamos la cola actualizada
        await set(OFFLINE_QUEUE_KEY, [...colaActual, nuevaAccion]);

        console.log(`[Offline Sync] Acción guardada en cola: ${tipo}`);
    } catch (error) {
        console.error('[Offline Sync] Error al guardar acción:', error);
        throw new Error('No se pudo guardar la acción localmente.');
    }
}

/**
 * Recupera todas las acciones que están pendientes de envío.
 */
export async function obtenerColaPendiente(): Promise<AccionOffline[]> {
    try {
        return (await get<AccionOffline[]>(OFFLINE_QUEUE_KEY)) || [];
    } catch (error) {
        console.error('[Offline Sync] Error al leer la cola:', error);
        return [];
    }
}

/**
 * Elimina una acción específica de la cola, generalmente después 
 * de que se haya sincronizado exitosamente con el backend.
 */
export async function removerAccionDeCola(id: string): Promise<void> {
    try {
        const colaActual = (await get<AccionOffline[]>(OFFLINE_QUEUE_KEY)) || [];
        const nuevaCola = colaActual.filter((accion) => accion.id !== id);
        await set(OFFLINE_QUEUE_KEY, nuevaCola);
    } catch (error) {
        console.error(`[Offline Sync] Error al remover la acción ${id}:`, error);
    }
}