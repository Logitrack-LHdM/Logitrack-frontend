'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PublicTrackingPage() {
    const [trackingId, setTrackingId] = useState('');
    const [cuit, setCuit] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingId || !cuit) return;

        setIsLoading(true);
        // Simulación temporal para visualizar el botón de carga.
        // La conexión real con la API la haremos en la Fase 2.4.
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
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