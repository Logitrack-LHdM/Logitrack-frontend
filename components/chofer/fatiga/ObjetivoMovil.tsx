'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ObjetivoMovilProps {
    onFinalizar: (tiempoReaccionMs: number) => void;
}

export function ObjetivoMovil({ onFinalizar }: ObjetivoMovilProps) {
    const [iniciado, setIniciado] = useState(false);
    const [posicion, setPosicion] = useState(5); // Porcentaje de 0 a 100

    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);

    // Usamos una función seno para lograr un movimiento de rebote fluido (ping-pong)
    const animarIndicador = (time: number) => {
        if (!startTimeRef.current) startTimeRef.current = time;

        // Ajustar el divisor (400) para hacer el movimiento más rápido o más lento
        const elapsed = time - startTimeRef.current;

        // Math.sin oscila entre -1 y 1. Lo mapeamos para que vaya del 5% al 95% del contenedor
        const oscilacion = Math.sin(elapsed / 400);
        const nuevaPosicion = 50 + (oscilacion * 45);

        setPosicion(nuevaPosicion);
        requestRef.current = requestAnimationFrame(animarIndicador);
    };

    useEffect(() => {
        if (iniciado) {
            requestRef.current = requestAnimationFrame(animarIndicador);
        }

        return () => {
            cancelAnimationFrame(requestRef.current);
        };
    }, [iniciado]);

    const handleInteraccion = () => {
        if (!iniciado) return;

        // Frenamos la animación
        cancelAnimationFrame(requestRef.current);
        setIniciado(false);

        // El centro perfecto es 50%
        const errorEspacial = Math.abs(posicion - 50);

        // Mapeo matemático para el backend:
        // Si acierta perfecto (error = 0), enviamos 150ms (reacción base excelente, pasa validación bot >100ms).
        // Por cada 1% de error, sumamos 20ms.
        // Si frena en 25% (error de 25%), enviamos 150 + (25 * 20) = 650ms (Supera el umbral de 600ms y falla).
        const tiempoCalculado = Math.floor(150 + (errorEspacial * 20));

        // Damos un feedback visual brevísimo antes de cerrar el componente
        setTimeout(() => {
            onFinalizar(tiempoCalculado);
        }, 400);
    };

    return (
        <div className="w-full h-[60vh] md:h-[500px] flex flex-col items-center justify-center bg-slate-900 rounded-xl p-6 select-none touch-manipulation">

            {!iniciado && posicion === 5 ? (
                <div className="flex flex-col items-center">
                    <p className="text-white text-2xl font-bold mb-8 text-center px-4">
                        Detén la línea azul exactamente en la zona verde.
                    </p>
                    <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xl h-14 px-8"
                        onClick={() => setIniciado(true)}
                    >
                        Comenzar prueba
                    </Button>
                </div>
            ) : (
                <div
                    className="w-full max-w-sm flex flex-col items-center gap-12 cursor-pointer"
                    onPointerDown={handleInteraccion}
                >
                    <p className="text-white text-xl font-medium animate-pulse">
                        ¡Toca la pantalla para frenar!
                    </p>

                    {/* Contenedor de la barra */}
                    <div className="relative w-full h-16 bg-slate-700 rounded-full overflow-hidden shadow-inner border border-slate-600">

                        {/* Zona Segura (Centro) */}
                        <div className="absolute left-[35%] right-[35%] h-full bg-green-500/30 border-x-4 border-green-400" />

                        {/* Indicador Móvil */}
                        <div
                            className="absolute top-0 bottom-0 w-3 bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] rounded-full -ml-1.5"
                            style={{ left: `${posicion}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}