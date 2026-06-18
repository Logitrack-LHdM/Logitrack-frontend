'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import type { CartaPorteDTO } from '@/types';
import { obtenerCartaPorteCache } from '@/lib/offline-sync';

interface CartaPorteModalProps {
  idEnvio: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartaPorteModal({ idEnvio, open, onOpenChange }: CartaPorteModalProps) {
  const [cartaPorte, setCartaPorte] = useState<CartaPorteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook para cargar los datos desde el caché local cada vez que se abre el modal
  useEffect(() => {
    let isMounted = true;

    async function cargarDatos() {
      // Si el modal está cerrado o no hay ID, no hacemos nada
      if (!open || !idEnvio) return;

      setIsLoading(true);
      setError(null);

      try {
        // Leemos estrictamente del caché offline para cumplir el Criterio 3
        const datos = await obtenerCartaPorteCache(idEnvio);

        if (isMounted) {
          if (datos) {
            setCartaPorte(datos);
          } else {
            setError('No se encontraron los datos en el dispositivo. Asegúrese de haber sincronizado el viaje previamente con conexión a internet.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Ocurrió un error al intentar leer los datos guardados en el dispositivo.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    cargarDatos();

    // Función de limpieza para evitar fugas de memoria si el componente se desmonta rápido
    return () => {
      isMounted = false;
    };
  }, [idEnvio, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-11/12 rounded-xl max-h-[85vh] flex flex-col p-0 overflow-hidden outline-none">
        <DialogHeader className="p-4 border-b bg-muted/50">
          <DialogTitle className="text-center text-lg font-bold uppercase tracking-wide">
            Carta de Porte
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-4 flex flex-col items-center justify-center min-h-[300px]">

          {/* Estado: Cargando */}
          {isLoading && (
            <div className="flex flex-col items-center text-muted-foreground animate-pulse">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="font-medium">Cargando documento seguro...</p>
            </div>
          )}

          {/* Estado: Error (No se encontró el caché) */}
          {!isLoading && error && (
            <div className="flex flex-col items-center text-center text-destructive p-6 bg-destructive/10 rounded-xl border border-destructive/20">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
          )}

          {/* Estado: Éxito (Placeholder temporal para la Fase 3.2 y 3.3) */}
          {!isLoading && !error && cartaPorte && (
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-700 rounded-full mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <p className="text-foreground font-medium">Datos recuperados correctamente.</p>
              <p className="text-sm text-muted-foreground">(El código QR se renderizará aquí en el siguiente paso)</p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}