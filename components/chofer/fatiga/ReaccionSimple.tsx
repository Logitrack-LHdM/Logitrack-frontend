'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReaccionSimpleProps {
    // Callback que devolverá los milisegundos exactos al contenedor padre
    onFinalizar: (tiempoReaccionMs: number) => void;
}

type EstadoJuego = 'ESPERANDO' | 'LISTO' | 'TRAMPA';

export function ReaccionSimple({ onFinalizar }: ReaccionSimpleProps) {
    const [estado, setEstado] = useState<EstadoJuego>('ESPERANDO');

    // Usamos useRef para evitar que los re-renders afecten la precisión del cronómetro
    const tiempoInicioRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const iniciarTemporizador = () => {
        setEstado('ESPERANDO');
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Genera un tiempo aleatorio entre 2000 y 5000 milisegundos (2 a 5 segundos) [cite: 25]
        const tiempoAleatorio = Math.floor(Math.random() * 3000) + 2000;

        timeoutRef.current = setTimeout(() => {
            tiempoInicioRef.current = Date.now(); // Inicia el conteo en el instante exacto [cite: 25]
            setEstado('LISTO');
        }, tiempoAleatorio);
    };

    useEffect(() => {
        iniciarTemporizador();

        // Limpieza al desmontar el componente para evitar fugas de memoria
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Usamos onPointerDown para capturar el toque sin el delay nativo de los navegadores móviles [cite: 26]
    const handleInteraccion = () => {
        if (estado === 'ESPERANDO') {
            // El usuario intentó anticiparse al toque (trampa o falso positivo) [cite: 22]
            setEstado('TRAMPA');
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // Penalizamos con un pequeño mensaje y reiniciamos el juego
            setTimeout(() => {
                iniciarTemporizador();
            }, 1500);
            return;
        }

        if (estado === 'LISTO') {
            // Reacción válida: Calculamos la diferencia en milisegundos [cite: 24, 26]
            const tiempoReaccion = Date.now() - tiempoInicioRef.current;

            // Enviamos el resultado al contenedor padre para que procese el payload al servidor [cite: 26]
            onFinalizar(tiempoReaccion);
        }
    };

    return (
        <div
            className={`w-full h-[60vh] md:h-[500px] flex flex-col items-center justify-center rounded-xl cursor-pointer select-none touch-manipulation transition-colors duration-75 ${estado === 'ESPERANDO' ? 'bg-red-600 active:bg-red-700' :
                    estado === 'LISTO' ? 'bg-green-500 active:bg-green-600' :
                        'bg-orange-500'
                }`}
            onPointerDown={handleInteraccion}
        >
            {estado === 'ESPERANDO' && (
                <p className="text-white text-3xl md:text-4xl font-bold text-center p-6 tracking-wide drop-shadow-md">
                    Espera el color verde...
                </p>
            )}

            {estado === 'LISTO' && (
                <p className="text-white text-5xl md:text-7xl font-black text-center p-6 tracking-tight drop-shadow-lg animate-in zoom-in duration-100">
                    ¡TOCA AHORA!
                </p>
            )}

            {estado === 'TRAMPA' && (
                <div className="flex flex-col items-center text-white p-6">
                    <AlertTriangle className="w-20 h-20 mb-6 drop-shadow-md" />
                    <p className="text-3xl font-bold text-center drop-shadow-md">¡Demasiado pronto!</p>
                    <p className="text-xl mt-3 opacity-90 font-medium">Reiniciando prueba...</p>
                </div>
            )}
        </div>
    );
}