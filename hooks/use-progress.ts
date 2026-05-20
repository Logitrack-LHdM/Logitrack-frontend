import { useState, useEffect } from 'react';
import type { EstadoEnvio } from '@/types';

export function useProgresoEnvio(
    estado: EstadoEnvio,
    fechaSalida?: string,
    fechaEstimadaLlegada?: string
) {
    const [progreso, setProgreso] = useState(0);

    useEffect(() => {
        // Si ya terminó o se canceló, no calculamos tiempo
        if (estado === 'ENTREGADO') return setProgreso(100);
        if (estado === 'CANCELADO' || estado === 'PENDIENTE') return setProgreso(0);

        // Si faltan datos vitales, no podemos calcular
        if (!fechaSalida || !fechaEstimadaLlegada) return setProgreso(0);

        const inicio = new Date(fechaSalida).getTime();
        const fin = new Date(fechaEstimadaLlegada).getTime();

        // Actualizamos cada minuto para no saturar el renderizado
        const interval = setInterval(() => {
            const ahora = Date.now();

            if (ahora <= inicio) {
                setProgreso(0);
            } else if (ahora >= fin) {
                // Tope en 99% si hay demora y aún no está ENTREGADO
                setProgreso(99);
            } else {
                const totalDuration = fin - inicio;
                const elapsed = ahora - inicio;
                const porcentaje = (elapsed / totalDuration) * 100;
                setProgreso(Math.round(porcentaje));
            }
        }, 60000); // 60.000 ms = 1 minuto

        // Ejecución inicial inmediata
        const ahora = Date.now();
        if (ahora > inicio && ahora < fin) {
            setProgreso(Math.round(((ahora - inicio) / (fin - inicio)) * 100));
        } else if (ahora >= fin) {
            setProgreso(99);
        }

        return () => clearInterval(interval);
    }, [estado, fechaSalida, fechaEstimadaLlegada]);

    return progreso;
}