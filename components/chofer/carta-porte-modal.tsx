'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { generarPayloadQR, generarUrlPdfCartaPorte } from '@/lib/qr-utils';
import type { CartaPorteDTO } from '@/types';
import { obtenerCartaPorteCache, obtenerPdfCache } from '@/lib/offline-sync';

interface CartaPorteModalProps {
  idEnvio: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartaPorteModal({ idEnvio, open, onOpenChange }: CartaPorteModalProps) {
  const [cartaPorte, setCartaPorte] = useState<CartaPorteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false); // Nuevo estado

  const handleDescargarPdf = async () => {
    if (!cartaPorte) return;

    setIsDownloading(true);
    try {
      // 1. Intentamos obtener el PDF físico desde el caché local (Modo Offline)
      let blob = await obtenerPdfCache(cartaPorte.idEnvio);

      // 2. Si no está en caché (ej. el chofer limpió los datos de su navegador), 
      // intentamos hacer la petición a la API como plan de respaldo (Modo Online)
      if (!blob) {
        console.warn('[Offline Sync] PDF no encontrado en caché, intentando descargar desde el servidor...');
        blob = await api.descargarCartaPortePdf(cartaPorte.idEnvio);
      }

      // 3. Generamos la URL local para forzar la descarga en el dispositivo
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      // Asignamos un nombre por defecto al archivo descargado
      a.download = `Carta_Porte_${cartaPorte.cpe || cartaPorte.idEnvio}.pdf`;

      // Forzamos el click invisible para que inicie la descarga
      document.body.appendChild(a);
      a.click();

      // 4. Limpieza de memoria
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(blob.type ? 'Carta de Porte descargada exitosamente' : 'Descarga completada (desde caché)');
    } catch (err) {
      toast.error('Error al descargar el PDF. El archivo no está guardado en el dispositivo y no hay conexión a internet.');
    } finally {
      setIsDownloading(false);
    }
  };

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
                    value={generarUrlPdfCartaPorte(cartaPorte.idEnvio)} // Actualizado con la URL
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                    includeMargin={false}
                  />
                </div>

                {/* <p className="mt-6 text-sm font-medium text-gray-600 text-center">
                  Muestre esta pantalla al oficial de control
                </p> */}

                <Button
                  onClick={handleDescargarPdf}
                  disabled={isDownloading}
                  className="mt-6 w-full max-w-[240px] text-white bg-[#1b4332] hover:bg-[#2d6a4f]"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </>
                  )}
                </Button>

                {/* Datos Legibles (Respaldo) */}
                <div className="w-full mt-6 pt-6 border-t-2 border-gray-100 flex flex-col gap-4 text-left">

                  {/* Fila 1: ID Envío y Autorización ARCA */}
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <InfoField label="ID Viaje" value={cartaPorte.idEnvio} />
                    <InfoField label="Auth. ARCA" value={cartaPorte.autorizacionArca} />
                  </div>

                  {/* Fila 2: CPE y Patente */}
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <InfoField label="NRO CPE / CTG" value={cartaPorte.cpe} highlight />
                    <InfoField label="Patente" value={cartaPorte.patenteCamion} />
                  </div>

                  {/* Fila 3: Chofer (Agrupado) */}
                  <div className="border-b border-gray-100 pb-3">
                    <InfoField
                      label="Chofer Asignado"
                      value={cartaPorte.nombreChofer}
                      subValue={`CUIL: ${cartaPorte.cuilChofer} • Licencia: ${cartaPorte.licenciaChofer}`}
                    />
                  </div>

                  {/* Fila 4: Carga */}
                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                    <InfoField label="Tipo de Grano" value={cartaPorte.tipoGrano} />
                    <InfoField label="Peso Estimado" value={`${cartaPorte.pesoEstimadoKg.toLocaleString('es-AR')} kg`} />
                  </div>

                  {/* Fila 5: Ruta */}
                  <div className="grid grid-cols-1 gap-3 pt-1">
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