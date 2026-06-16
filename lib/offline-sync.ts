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

/**
 * Función maestra que procesa toda la cola de acciones pendientes.
 * Iterará sobre cada acción, intentará enviarla al backend y, si tiene éxito,
 * la eliminará de la base de datos local.
 */
export async function procesarColaOffline(): Promise<void> {
    // 1. Obtenemos todas las acciones pendientes
    const pendientes = await obtenerColaPendiente();

    if (pendientes.length === 0) {
        return; // No hay nada que sincronizar
    }

    console.log(`[Offline Sync] Iniciando sincronización de ${pendientes.length} acciones pendientes...`);

    // 2. Iteramos sobre cada acción guardada
    for (const accion of pendientes) {
        try {
            // Aquí evaluaremos el tipo de acción y llamaremos al endpoint correspondiente
            // (Esta lógica de enrutamiento a la API la implementaremos en el Paso 4)
            if (accion.tipo === 'CAMBIAR_ESTADO') {
                // TODO: Llamar a api.cambiarEstadoChofer con accion.payload
                console.log(`[Offline Sync] Procesando CAMBIAR_ESTADO para ID: ${accion.id}`);
            } else if (accion.tipo === 'REPORTAR_INCIDENCIA') {
                // TODO: Llamar a api.reportarIncidencia con accion.payload
                console.log(`[Offline Sync] Procesando REPORTAR_INCIDENCIA para ID: ${accion.id}`);
            }

            // 3. IMPORTANTE: Solo si la petición al backend fue exitosa (no lanzó error en el try),
            // procedemos a eliminar esta acción de la cola local para no repetirla.
            // await removerAccionDeCola(accion.id);

        } catch (error) {
            // Si una petición falla (ej. el internet se volvió a caer en medio de la sincronización),
            // atrapamos el error aquí para que el ciclo 'for' no se rompa y siga intentando
            // con las demás acciones (o las deje pendientes para el próximo intento).
            console.error(`[Offline Sync] Error al procesar la acción ${accion.id}:`, error);
        }
    }

    console.log('[Offline Sync] Proceso de sincronización finalizado.');
}