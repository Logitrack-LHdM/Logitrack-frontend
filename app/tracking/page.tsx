'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

export default function PublicTrackingPage() {
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
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-11 bg-gray-100 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="h-11 w-full bg-[#1b4332]/20 rounded-lg animate-pulse mt-6"></div>
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