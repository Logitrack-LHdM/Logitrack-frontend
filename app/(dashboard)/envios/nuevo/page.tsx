'use client';

import Link from 'next/link';
import { ArrowLeftCircle, Search, Truck } from 'lucide-react';
import { EnvioForm } from '@/components/envios/envio-form';

export default function CrearEnvioPage() {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
      {/* Botón de retroceso idéntico al de tu diseño original */}
      <Link
        href="/menu"
        className="text-[#198754] font-semibold mb-4 md:mb-6 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
      </Link>


      <div className="flex md:flex-row items-start md:items-center w-full md:w-auto gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
          <Truck className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-bold mb-1 text-xl md:text-2xl flex items-center gap-2 text-gray-900">
            Crear Nuevo Envío
          </h4>
          <p className="text-muted-foreground text-sm m-0">Complete la orden de transporte seleccionando el cliente y la ruta.</p>
        </div>
      </div>


      {/* Aquí renderizamos directamente el formulario para que ocupe todo el ancho disponible */}
      <EnvioForm />
    </div>
  );
}