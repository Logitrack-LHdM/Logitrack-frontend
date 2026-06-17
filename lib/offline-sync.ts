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
 */
export async function procesarColaOffline(): Promise<void> {
    // 1. Obtenemos todas las acciones pendientes
    const pendientes = await obtenerColaPendiente();

    if (pendientes.length === 0) {
        return; // No hay nada que sincronizar
    }

    console.log(`[Offline Sync] Iniciando sincronización de ${pendientes.length} acciones pendientes...`);

    // Importación dinámica para evitar la dependencia circular con lib/api.ts
    const { api } = await import('./api');

    // 2. Iteramos sobre cada acción guardada
    for (const accion of pendientes) {
        try {
            // Aquí evaluaremos el tipo de acción y llamaremos al endpoint correspondiente
            // (Esta lógica de enrutamiento a la API la implementaremos en el Paso 4)
            if (accion.tipo === 'CAMBIAR_ESTADO') {
                const payload = accion.payload as PayloadCambioEstado;
                // Pasamos `true` al final para forzar la red y evitar que se vuelva a interceptar
                await api.cambiarEstadoChofer(payload.idEnvio, payload.nuevoEstado, true);
                console.log(`[Offline Sync] Éxito: CAMBIAR_ESTADO para ID: ${accion.id}`);

            } else if (accion.tipo === 'REPORTAR_INCIDENCIA') {
                const payload = accion.payload as PayloadIncidencia;
                await api.reportarIncidencia(payload.idEnvio, payload.incidencia, true);
                console.log(`[Offline Sync] Éxito: REPORTAR_INCIDENCIA para ID: ${accion.id}`);
            }

            // 3. Como la petición fue exitosa (no lanzó error), eliminamos la acción local
            // 3. IMPORTANTE: Solo si la petición al backend fue exitosa (no lanzó error en el try),
            // procedemos a eliminar esta acción de la cola local para no repetirla.
            await removerAccionDeCola(accion.id);

        } catch (error) {
            // Si una petición falla (ej. el internet se volvió a caer en medio de la sincronización),
            // atrapamos el error aquí para que el ciclo 'for' no se rompa y siga intentando
            // con las demás acciones (o las deje pendientes para el próximo intento).
            console.error(`[Offline Sync] Error al procesar la acción ${accion.id}:`, error);
            // Al fallar, el loop continúa pero NO se elimina de la base local, 
            // asegurando que se reintente en el futuro.
        }
    }

    console.log('[Offline Sync] Proceso de sincronización finalizado.');
}