'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export default function PublicTrackingPage() {
    const [trackingId, setTrackingId] = useState('');
    const [cuit, setCuit] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId || !cuit) return;

        setIsLoading(true);
        setError(null); // Limpiamos errores previos

        try {
            const resultado = await api.consultarTrackingPublico({ trackingId, cuit });

            // Por ahora lo mostramos en consola. 
            // En el Paso 3, guardaremos este 'resultado' en un estado para mostrar la Vista de Detalle.
            console.log('Datos obtenidos de forma segura:', resultado);

        } catch (err) {
            // Aplicamos el Criterio 2: Manejo de errores de privacidad.
            // Mostramos estrictamente el mensaje genérico.
            setError(err instanceof Error ? err.message : 'No se encontró información para los datos ingresados');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">

            {/* Header con Logotipo y Títulos */}
            <div className="mb-6 md:mb-8 text-center w-full max-w-md">
                <div className="relative w-48 h-16 mx-auto mb-4">
                    <Image
                        src="/images/logo-logitrack.png"
                        alt="Logitrack Agro Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#081c15] flex items-center justify-center gap-2">
                    <MapPin className="h-6 w-6 md:h-7 md:w-7 text-[#1b4332]" />
                    Rastreo de Envíos
                </h1>
                <p className="text-muted-foreground mt-2 text-sm md:text-base">
                    Consulte el estado actual, historial y ubicación de su carga de forma rápida y segura.
                </p>
            </div>

            {/* Tarjeta del Formulario (Contenedor para la Fase 2.3) */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {/* Línea decorativa superior */}
                <div className="h-2 w-full bg-[#1b4332]"></div>

                <div className="p-6 md:p-8">
                    {/* Skeletons como placeholders visuales mientras implementamos los inputs reales */}
                    <div className="space-y-5">

                        {/* Mensaje de Error de Privacidad */}
                        {error && (
                            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSearch} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="trackingId" className="text-gray-700 font-bold">Tracking ID</Label>
                                <Input
                                    id="trackingId"
                                    placeholder="Ej: ENV-2026-089"
                                    value={trackingId}
                                    onChange={(e) => setTrackingId(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cuit" className="text-gray-700 font-bold">CUIT (Remitente/Destinatario)</Label>
                                <Input
                                    id="cuit"
                                    placeholder="Ej: 30-12345678-9"
                                    value={cuit}
                                    onChange={(e) => setCuit(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={isLoading || !trackingId || !cuit}
                                    className="w-full h-11 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold transition-all shadow-md hover:shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Buscando información...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="mr-2 h-5 w-5" />
                                            Rastrear Envío
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer minimalista público */}
            <div className="mt-10 text-center">
                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Logitrack Agro. Todos los derechos reservados.
                </p>
            </div>

        </div>
    );
}