'use client';

import React from 'react';

export default function PublicTrackingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 md:p-8">
            {/* Este es el contenedor principal aislado. Al estar fuera de (dashboard) y (auth), garantizamos que no haya navegación privada. */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Estructura Base
                </h1>
                <p className="text-center text-muted-foreground text-sm">
                    Ruta pública aislada exitosamente.
                </p>
            </div>
        </div>
    );
}