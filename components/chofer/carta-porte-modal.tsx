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
import { QRCodeSVG } from 'qrcode.react';
import { generarPayloadQR } from '@/lib/qr-utils';

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

          {/* Estado: Éxito (QR con Alto Contraste) */}
          {!isLoading && !error && cartaPorte && (
            <div className="flex flex-col items-center justify-center w-full">

              {/* CONTENEDOR DE ALTO CONTRASTE (AISLADO DEL MODO OSCURO) */}
              <div className="bg-white text-black w-full flex flex-col items-center p-8 rounded-xl shadow-sm border-2 border-gray-200">

                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 text-center">
                  Documento Electrónico de Transporte
                </h3>

                {/* Código QR */}
                <div className="bg-white p-2 rounded-xl border-4 border-black">
                  <QRCodeSVG
                    value={generarPayloadQR(cartaPorte)}
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L" // Nivel de corrección 'L' (Low) hace que los cuadros sean más grandes y fáciles de leer
                    includeMargin={false}
                  />
                </div>

                <p className="mt-6 text-sm font-medium text-gray-600 text-center">
                  Muestre esta pantalla al oficial de control
                </p>

                {/* (Placeholder temporal para la Fase 3.3: Datos Legibles) */}

              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}