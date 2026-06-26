'use client';

import { useState, useEffect } from 'react';
import { ReaccionSimple } from './ReaccionSimple';
import { ObjetivoMovil } from './ObjetivoMovil';
import { ReaccionMultiple } from './ReaccionMultiple';
import type { TipoJuego } from '@/types';

interface FatigueTestContainerProps {
    onCompletado: (resultado: { tipoJuego: TipoJuego; tiempoReaccionMs: number }) => void;
}

type FaseContenedor = 'ONBOARDING' | 'JUGANDO' | 'PROCESANDO';

export function FatigueTestContainer({ onCompletado }: FatigueTestContainerProps) {
    const [fase, setFase] = useState<FaseContenedor>('ONBOARDING');
    const [juegoSeleccionado, setJuegoSeleccionado] = useState<TipoJuego | null>(null);
    const [cuentaRegresiva, setCuentaRegresiva] = useState(5); // Temporizador de 5 segundos

    // Selección aleatoria del minijuego al montar el componente
    useEffect(() => {
        const juegosDisponibles: TipoJuego[] = [
            'REACCION_SIMPLE',
            'OBJETIVO_MOVIL',
            'REACCION_MULTIPLE',
        ];

        const indiceAleatorio = Math.floor(Math.random() * juegosDisponibles.length);
        setJuegoSeleccionado(juegosDisponibles[indiceAleatorio]);
    }, []);

    // Temporizador para la pantalla de Onboarding (Instrucciones gigantes)
    useEffect(() => {
        if (fase !== 'ONBOARDING' || !juegoSeleccionado) return;

        if (cuentaRegresiva > 0) {
            const timer = setTimeout(() => setCuentaRegresiva((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Finaliza la cuenta regresiva e iniciamos el minijuego
            setFase('JUGANDO');
        }
    }, [cuentaRegresiva, fase, juegoSeleccionado]);

    // Recepción del tiempo medido y envío al componente padre
    const handleMinijuegoFinalizado = (tiempoReaccionMs: number) => {
        setFase('PROCESANDO'); // Bloqueamos la UI mientras el padre envía al backend

        if (juegoSeleccionado) {
            onCompletado({ tipoJuego: juegoSeleccionado, tiempoReaccionMs });
        }
    };

    // UX: Textos dinámicos y claros para evitar falsos positivos por incomprensión
    const obtenerInstrucciones = () => {
        switch (juegoSeleccionado) {
            case 'REACCION_SIMPLE':
                return 'Toca la pantalla lo más rápido posible cuando el color cambie abruptamente a VERDE.';
            case 'OBJETIVO_MOVIL':
                return 'Toca la pantalla para frenar el indicador exactamente en el CENTRO de la zona verde.';
            case 'REACCION_MULTIPLE':
                return 'Se iluminará un círculo al azar. Tócalo lo más rápido posible. Esto se repetirá 3 veces seguidas.';
            default:
                return 'Preparando evaluación...';
        }
    };

    // Evitamos renderizar hasta que Math.random() haya elegido un juego
    if (!juegoSeleccionado) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 relative">

                {/* PANTALLA 1: ONBOARDING */}
                {fase === 'ONBOARDING' && (
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] md:min-h-[500px]">
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-6 uppercase tracking-wider">
                            Test de Reflejos
                        </h2>

                        <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600 mb-8 w-full shadow-inner">
                            <p className="text-2xl md:text-3xl text-amber-400 font-bold mb-4">
                                ¡PREPÁRATE!
                            </p>
                            <p className="text-lg md:text-xl text-slate-200 font-medium leading-relaxed">
                                {obtenerInstrucciones()}
                            </p>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-sm text-slate-400 uppercase font-bold tracking-widest mb-2">
                                El juego comienza en
                            </span>
                            <span className="text-7xl font-black text-white animate-pulse">
                                {cuentaRegresiva}
                            </span>
                        </div>
                    </div>
                )}

                {/* PANTALLA 2: EL MINIJUEGO SELECCIONADO */}
                {fase === 'JUGANDO' && (
                    <div className="w-full animate-in zoom-in-95 duration-200">
                        {juegoSeleccionado === 'REACCION_SIMPLE' && (
                            <ReaccionSimple onFinalizar={handleMinijuegoFinalizado} />
                        )}
                        {juegoSeleccionado === 'OBJETIVO_MOVIL' && (
                            <ObjetivoMovil onFinalizar={handleMinijuegoFinalizado} />
                        )}
                        {juegoSeleccionado === 'REACCION_MULTIPLE' && (
                            <ReaccionMultiple onFinalizar={handleMinijuegoFinalizado} />
                        )}
                    </div>
                )}

                {/* PANTALLA 3: CARGA / ESPERA DE RED */}
                {fase === 'PROCESANDO' && (
                    <div className="flex flex-col items-center justify-center p-12 min-h-[400px] md:min-h-[500px]">
                        <div className="w-16 h-16 border-4 border-t-blue-500 border-slate-700 rounded-full animate-spin mb-6" />
                        <p className="text-white text-2xl font-bold">Analizando resultado...</p>
                        <p className="text-slate-400 mt-2 text-center font-medium">
                            Verificando niveles de fatiga.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}