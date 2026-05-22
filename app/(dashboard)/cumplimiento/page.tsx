import React from 'react';
import Link from 'next/link';
import { ArrowLeftCircle } from 'lucide-react';
import { CumplimientoDashboard } from '@/components/cumplimiento/cumplimiento-dashboard';

export const metadata = {
    title: 'Análisis de Cumplimiento | Logitrack Agro',
    description: 'Panel de control para el análisis de puntualidad y desvíos en los envíos.',
};

export default function CumplimientoPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Botón de navegación alineado con la UX de reporte-operativo */}
                <Link
                    href="/menu"
                    className="text-[#198754] font-semibold mb-3 md:mb-4 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
                </Link>

                {/* Instanciación de nuestro componente orquestador */}
                <CumplimientoDashboard />

            </div>
        </div>
    );
}