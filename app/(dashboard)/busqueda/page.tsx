'use client';

import Link from 'next/link';
import { ArrowLeftCircle, Search } from 'lucide-react';
import { SearchFilters } from '@/components/busqueda/search-filters';
import { EnvioTable } from '@/components/envios/envio-table';
import { Pagination } from '@/components/busqueda/pagination';
import { EmptyState } from '@/components/busqueda/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useEnvios } from '@/hooks/use-envios';
import type { EstadoEnvio } from '@/types';

export default function BusquedaPage() {
  const {
    envios, isLoading, totalPages, totalElements, currentPage,
    filters, hasSearched, updateFilters, limpiarFiltros, buscar,
    cancelarEnvio,   // ← agregar
    paginaAnterior, paginaSiguiente, hasPreviousPage, hasNextPage,
  } = useEnvios();

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
      <Link
        href="/menu"
        className="text-[#198754] font-semibold mb-4 md:mb-6 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
      </Link>

       <div className="flex md:flex-row items-start md:items-center w-full md:w-auto gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
          <Search className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-bold mb-1 text-xl md:text-2xl flex items-center gap-2 text-foreground">
            {/* <FileText className="text-blue-600 h-6 w-6" />  */} Ficha Operativa
          </h4>
          <p className="text-muted-foreground text-sm m-0">Detalles del transporte de carga.</p>
        </div>
      </div>

      <SearchFilters
        query={filters.query}
        estado={filters.estado}
        fecha={filters.fecha} // <-- Pasamos solo fecha
        onQueryChange={(value) => updateFilters({ query: value })}
        onEstadoChange={(value) => updateFilters({ estado: value })}
        onFechaChange={(value) => updateFilters({ fecha: value })} // <-- Un solo handler
        onSearch={() => buscar(0)}
        onClear={limpiarFiltros}
        isLoading={isLoading}
      />

      <div className="mt-6 md:mt-8">
        {!hasSearched && !isLoading && <EmptyState type="initial" />}

        {isLoading && (
          <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-sm border-0">
            <Spinner className="h-8 w-8 text-[#198754]" />
            <span className="ml-3 text-muted-foreground font-medium">Obteniendo datos...</span>
          </div>
        )}

        {hasSearched && !isLoading && envios.length === 0 && <EmptyState type="no-results" />}

        {hasSearched && !isLoading && envios.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h5 className="font-bold text-foreground m-0 text-lg">Resultados de la consulta</h5>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
              <EnvioTable envios={envios} onCancelar={cancelarEnvio} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalElements={totalElements}
                onPreviousPage={paginaAnterior}
                onNextPage={paginaSiguiente}
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}