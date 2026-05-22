import { useState, useEffect } from 'react';
import { api } from '@/lib/api'; // Ajustá esta ruta según dónde esté tu archivo api.ts

export function useRastreoTiempoReal(idEnvio: string) {
    // 1. Definición de Estados
    // Inicializamos la ruta como un arreglo vacío para evitar errores en el primer renderizado
    const [ruta, setRuta] = useState<[number, number][]>([]);
    const [isRutaCargando, setIsRutaCargando] = useState<boolean>(true);
    const [errorRuta, setErrorRuta] = useState<string | null>(null);

    // (En el Paso 4 agregaremos aquí los estados para el movimiento del camión)

    // 2. Efecto para cargar la ruta (Se ejecuta solo al montar o si cambia el idEnvio)
    useEffect(() => {
        if (!idEnvio) return;

        // Patrón de bandera para evitar actualizar el estado si el componente 
        // se desmonta antes de que la promesa se resuelva (Navegación rápida)
        let isMounted = true;

        const fetchRuta = async () => {
            setIsRutaCargando(true);
            setErrorRuta(null);

            try {
                const rutaObtenida = await api.getRutaPlanificada(idEnvio);

                if (isMounted) {
                    setRuta(rutaObtenida);
                }
            } catch (err) {
                if (isMounted) {
                    // Si bien nuestra API ya maneja el error devolviendo [],
                    // cubrimos cualquier fallo inesperado de red por seguridad.
                    setErrorRuta('No se pudo cargar la ruta planificada.');
                }
            } finally {
                if (isMounted) {
                    setIsRutaCargando(false);
                }
            }
        };

        fetchRuta();

        // Función de limpieza
        return () => {
            isMounted = false;
        };
    }, [idEnvio]);

    // 3. Exponemos los datos y estados hacia el componente
    return {
        ruta,
        isRutaCargando,
        errorRuta,
    };
}