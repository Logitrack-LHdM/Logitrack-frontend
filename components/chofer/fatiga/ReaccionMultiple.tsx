'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ReaccionMultipleProps {
    onFinalizar: (tiempoReaccionMs: number) => void;
}

export function ReaccionMultiple({ onFinalizar }: ReaccionMultipleProps) {
    const [iniciado, setIniciado] = useState(false);
    const [objetivoActivo, setObjetivoActivo] = useState<number | null>(null);
    const [iteracion, setIteracion] = useState(0);

    const tiemposRef = useRef<number[]>([]);
    const tiempoAparicionRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const TOTAL_ITERACIONES = 3;
    const NUMERO_CIRCULOS = 4; // Cuadrícula de 2x2

    // Función para apagar los círculos y programar el encendido aleatorio de uno nuevo
    const programarSiguienteObjetivo = () => {
        setObjetivoActivo(null);

        // Tiempo de espera impredecible entre 600ms y 1500ms
        const delayAleatorio = Math.floor(Math.random() * 900) + 600;

        timeoutRef.current = setTimeout(() => {
            const proximoObjetivo = Math.floor(Math.random() * NUMERO_CIRCULOS);
            setObjetivoActivo(proximoObjetivo);
            tiempoAparicionRef.current = Date.now(); // Marca el inicio del cronómetro
        }, delayAleatorio);
    };

    useEffect(() => {
        if (iniciado && iteracion < TOTAL_ITERACIONES) {
            programarSiguienteObjetivo();
        }

        // Limpieza de timeouts al desmontar o cambiar de iteración
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [iniciado, iteracion]);

    const handleToque = (index: number) => {
        if (!iniciado || objetivoActivo === null) return;

        if (index === objetivoActivo) {
            // El chofer acertó el círculo correcto
            const tiempoReaccion = Date.now() - tiempoAparicionRef.current;
            tiemposRef.current.push(tiempoReaccion);

            if (tiemposRef.current.length >= TOTAL_ITERACIONES) {
                // Se completaron las 3 rondas, calculamos el promedio
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                const sumaTotal = tiemposRef.current.reduce((a, b) => a + b, 0);
                const promedio = Math.floor(sumaTotal / TOTAL_ITERACIONES);

                setObjetivoActivo(null); // Apagamos la UI

                // Pausa muy breve antes de cerrar para que la UI no desaparezca bruscamente
                setTimeout(() => {
                    onFinalizar(promedio);
                }, 300);
            } else {
                // Avanzamos a la siguiente ronda
                setIteracion((prev) => prev + 1);
            }
        }
        // Si toca un círculo incorrecto, no hacemos nada. 
        // El reloj (Date.now()) sigue avanzando, lo que empeorará su promedio final.
    };

    return (
        <div className="w-full h-[60vh] md:h-[500px] flex flex-col items-center justify-center bg-slate-900 rounded-xl p-6 select-none touch-manipulation">
            {!iniciado ? (
                <div className="flex flex-col items-center">
                    <p className="text-white text-2xl font-bold mb-4 text-center px-4">
                        Toca el círculo que se ilumine lo más rápido posible.
                    </p>
                    <p className="text-slate-400 text-md font-medium mb-8 text-center px-4">
                        Se repetirá {TOTAL_ITERACIONES} veces consecutivas.
                    </p>
                    <Button
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xl h-14 px-8"
                        onClick={() => setIniciado(true)}
                    >
                        Comenzar prueba
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center w-full max-w-sm">
                    <p className="text-slate-400 text-lg font-medium mb-8">
                        Ronda {iteracion + 1} de {TOTAL_ITERACIONES}
                    </p>

                    {/* Cuadrícula 2x2 para los círculos */}
                    <div className="grid grid-cols-2 gap-6 w-full aspect-square max-w-[280px]">
                        {Array.from({ length: NUMERO_CIRCULOS }).map((_, index) => {
                            const esActivo = objetivoActivo === index;
                            return (
                                <div
                                    key={index}
                                    onPointerDown={() => handleToque(index)}
                                    className={`w-full h-full rounded-full transition-all duration-75 cursor-pointer shadow-inner border-4 ${esActivo
                                            ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.8)] scale-105'
                                            : 'bg-slate-700 border-slate-600 active:scale-95'
                                        }`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}