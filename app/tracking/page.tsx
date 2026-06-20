'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, Search, Loader2, AlertCircle, ArrowLeft, Calendar, Clock, MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import type { TrackingPublicoResponseDTO } from '@/types/tracking';
import { formatearFechaHora } from '@/lib/utils';
import { EstadoTimeline } from '@/components/envios/estado-timeline';
import { TruckStepper } from '@/components/envios/truck-stepper';
import { MapaEnvio } from '@/components/envios/mapa-envio';
import { useTrackingPublico } from '@/hooks/use-tracking-publico';

export default function PublicTrackingPage() {
    // Consumimos toda la lógica directamente desde el hook
    const {
        trackingId,
        cuit,
        isLoading,
        error,
        trackingData,
        setTrackingId,
        setCuit,
        handleSearch,
        resetBusqueda // Lo usaremos en el botón "Volver"
    } = useTrackingPublico();

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

            {/* Renderizado Condicional: Formulario vs Vista de Detalle */}
            {!trackingData ? (
                // === VISTA 1: FORMULARIO DE BÚSQUEDA ===
                <div className="w-full max-w-md bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Línea decorativa superior */}
                    <div className="h-2 w-full bg-[#1b4332]"></div>

                    <div className="p-6 md:p-8">
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
            ) : (
                // === VISTA 2: DETALLE DEL ENVÍO PÚBLICO ===
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">

                    {/* Header Superior - Ficha Pública */}
                    <div className="bg-blue-600/10 px-4 py-4 md:px-6 md:py-5 border-b border-blue-600/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                            <Button
                                variant="ghost"
                                onClick={resetBusqueda}
                                className="text-blue-700 hover:text-blue-800 hover:bg-blue-600/20 px-2 md:px-3 h-9"
                            >
                                <ArrowLeft className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden sm:inline">Volver</span>
                            </Button>
                            <h2 className="text-lg md:text-xl font-bold flex items-center text-gray-900 m-0">
                                Seguimiento de Carga
                            </h2>
                        </div>
                        <div className="bg-white px-4 md:px-5 py-2 rounded-xl border shadow-sm text-center w-full sm:w-auto">
                            <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                                Tracking ID
                            </span>
                            <span className="font-extrabold text-lg md:text-xl text-blue-600 leading-none">
                                {trackingData.trackingId}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 md:p-8">
                        {/* Detalles del Viaje Sanitizados */}
                        <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2">
                            Detalles del Viaje
                        </h6>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-8">
                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Origen
                                </label>
                                <div className="font-medium text-gray-900 break-words">
                                    {trackingData.origenNombre}
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                                    Destino
                                </label>
                                <div className="font-medium text-gray-900 break-words">
                                    {trackingData.destinoNombre}
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3" /> Fecha Creación
                                </label>
                                <div className="font-medium text-gray-900">
                                    {formatearFechaHora(trackingData.fechaCreacion)}
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 mb-1">
                                    <Clock className="h-3 w-3" /> Tiempo Estimado (ETA)
                                </label>
                                <div className="font-bold text-blue-700">
                                    {trackingData.eta ? formatearFechaHora(trackingData.eta) : 'A calcular...'}
                                </div>
                            </div>
                        </div>

                        {/* Estado del Recorrido (Timeline y Progreso) */}
                        <h6 className="font-bold text-[#198754] mb-6 border-b border-[#198754]/20 pb-2 mt-2">
                            Estado del Recorrido
                        </h6>
                        <div className="mb-10">
                            <EstadoTimeline estadoActual={trackingData.estadoActual} />

                            <div className="mt-8">
                                {/* El componente TruckStepper se encargará de renderizar el camión animado basándose en el estado sanitizado que recibió desde el backend */}
                                <TruckStepper estadoActual={trackingData.estadoActual} />
                            </div>
                        </div>

                        {/* Mapa Interactivo Restringido */}
                        <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Ubicación Aproximada
                        </h6>
                        <div className="mb-2">
                            <div className="w-full h-[320px] md:h-[400px] bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm relative">

                                {trackingData.ubicacionActual ? (
                                    <MapaEnvio
                                        camionLat={trackingData.ubicacionActual.latitud}
                                        camionLng={trackingData.ubicacionActual.longitud}
                                        estadoActual={trackingData.estadoActual}
                                    // INTENCIONAL: No pasamos coordenadas de origen, destino ni la ruta (polyline)
                                    // De esta forma protegemos las ubicaciones exactas de los clientes.
                                    />
                                ) : (
                                    /* Empty State: Cuando el viaje no inició o se perdió la señal */
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-gray-50/50">
                                        <MapPinOff className="h-12 w-12 mb-4 opacity-20 text-gray-500" />
                                        <p className="font-bold text-lg text-gray-700">Ubicación no disponible</p>
                                        <p className="text-sm mt-1 max-w-sm">
                                            El vehículo aún no ha iniciado el recorrido o no cuenta con señal en este momento.
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Footer minimalista público */}
            <div className="mt-10 text-center">
                <p className="text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Logitrack Agro. Todos los derechos reservados.
                </p>
            </div>

        </div>
    );
}