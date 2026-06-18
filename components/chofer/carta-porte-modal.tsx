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
      <DialogContent className="max-w-md w-11/12 rounded-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden outline-none">
        <DialogHeader className="p-4 border-b bg-muted/50">
          <DialogTitle className="text-center text-lg font-bold uppercase tracking-wide">
            Carta de Porte
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-muted/10 p-2 flex flex-col items-center min-h-[300px]">

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

                {/* <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 text-center">
                  Documento Electrónico de Transporte
                </h3> */}

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

                {/* <p className="mt-6 text-sm font-medium text-gray-600 text-center">
                  Muestre esta pantalla al oficial de control
                </p> */}

                {/* Datos Legibles (Respaldo) */}
                <div className="w-full mt-6 pt-6 border-t-2 border-gray-100 flex flex-col gap-4 text-left">

                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="NRO CPE / CTG" value={cartaPorte.cpe} highlight />
                    <InfoField label="Patente" value={cartaPorte.patenteCamion} />
                  </div>

                  <InfoField
                    label="Chofer"
                    value={cartaPorte.nombreChofer}
                    subValue={`CUIL: ${cartaPorte.cuilChofer} • Lic: ${cartaPorte.licenciaChofer}`}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Tipo de Grano" value={cartaPorte.tipoGrano} />
                    <InfoField label="Peso Estimado" value={`${cartaPorte.pesoEstimadoKg.toLocaleString('es-AR')} kg`} />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <InfoField label="Origen" value={cartaPorte.origen} />
                    <InfoField label="Destino" value={cartaPorte.destino} />
                  </div>

                </div>


              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}

// Subcomponente utilitario para mantener la limpieza del modal
function InfoField({
  label,
  value,
  subValue,
  highlight
}: {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider mb-1">
        {label}
      </span>
      <span className={`text-sm ${highlight ? 'font-black text-black text-base' : 'font-semibold text-gray-800'}`}>
        {value}
      </span>
      {subValue && (
        <span className="text-xs font-medium text-gray-500 mt-0.5">
          {subValue}
        </span>
      )}
    </div>
  );
}