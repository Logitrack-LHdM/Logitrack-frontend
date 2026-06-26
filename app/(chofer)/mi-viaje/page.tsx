'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Package, RefreshCw, GlobeX, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ViajeCard } from '@/components/chofer/viaje-card';
import { ActionButton } from '@/components/chofer/action-button';
import { IncidenciaDrawer } from '@/components/chofer/incidencia-drawer';
import { CartaPorteModal } from '@/components/chofer/carta-porte-modal';
import { useViajeChofer } from '@/hooks/use-viaje-chofer';
import { FLUJO_LOGISTICO } from '@/lib/constants';
import type { IncidenciaDTO, TipoJuego } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

// Importamos el contenedor del test de fatiga
import { FatigueTestContainer } from '@/components/chofer/fatiga/FatigueTestContainer';

export default function MiViajePage() {
  const {
    viaje,
    isLoading,
    isUpdating,
    error,
    recargar,
    avanzarEstado,
    reportarIncidencia,
  } = useViajeChofer();

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // NUEVOS ESTADOS PARA INTERCEPCIÓN
  const [mostrarTestFatiga, setMostrarTestFatiga] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { usuario } = useAuth();
  const [isVerificando, setIsVerificando] = useState(false);

  // Intercepta el clic principal según el estado del viaje
  const handleAccionPrincipal = async () => {
    if (!viaje) return;

    if (viaje.estadoActual === 'PENDIENTE') {
      setIsVerificando(true);
      try {
        // Consultamos al backend si hay un bloqueo vigente para este viaje
        const evaluacionPendiente = await api.getEvaluacionFatigaPendiente(viaje.idEnvio);

        // Validación estricta: si hay un bloqueo, mostramos la alerta y cortamos el flujo
        if (evaluacionPendiente && evaluacionPendiente.idEvaluacion) {
          toast.warning('Bloqueo activo', {
            description: 'Tienes un bloqueo preventivo por fatiga. Espera la resolución de un supervisor.',
            duration: 5000,
          });
          return;
        }

        // Si no hay bloqueo, lanzamos el minijuego
        setMostrarTestFatiga(true);
      } catch (error) {
        toast.error('Error de validación', {
          description: 'No pudimos verificar tu estado operativo. Verifica tu conexión e intenta de nuevo.',
        });
      } finally {
        setIsVerificando(false);
      }
    } else {
      // Flujo normal para el resto de los estados
      setIsConfirmOpen(true);
    }
  };

  // Para procesar el test
  const handleTestCompletado = async (resultado: { tipoJuego: TipoJuego; tiempoReaccionMs: number }) => {
    if (!viaje || !usuario) return;

    try {
      // Enviamos el resultado a la API
      const response = await api.registrarEvaluacion({
        idEnvio: viaje.idEnvio.toString(),
        tipoJuego: resultado.tipoJuego,
        tiempoReaccionMs: resultado.tiempoReaccionMs,
        idChofer: usuario.username,
      });

      setMostrarTestFatiga(false);

      // BLOQUE DE VALIDACIÓN
      if (response._offlineQueued) {
        toast.warning('Sin conexión: Test de fatiga guardado localmente', {
          description: 'El viaje iniciará ahora y el test se enviará cuando recuperes la señal.',
        });
        await handleAvanzarEstado();
      } else if (response.aprobado) {
        toast.success('Test aprobado. ¡Buen viaje!', { description: response.mensaje });
        // Si aprueba, forzamos el avance de estado sin pasar por el Dialog
        await handleAvanzarEstado();
      } else {
        toast.error('Test fallido: Fatiga extrema detectada', {
          description: 'Viaje bloqueado. El supervisor ha sido notificado.',
        });
        // setViajeBloqueado(true); // Bloqueamos la UI permanentemente
      }
    } catch (error) {
      setMostrarTestFatiga(false);
      // Manejo Offline
      toast.error('Error de conexión', {
        description: 'No se pudo procesar el test de reflejos.',
      });
    }
  };

  const handleAvanzarEstado = async () => {
    try {
      const response = await avanzarEstado();

      // Verificamos si la acción fue interceptada localmente
      if (response && (response as any)._offlineQueued) {
        toast.warning('Guardado sin conexión. Se sincronizará automáticamente');
      } else {
        const flujo = viaje ? FLUJO_LOGISTICO[viaje.estadoActual] : null;
        toast.success(flujo?.siguiente ? 'Estado actualizado' : 'Viaje completado');
      }
    } catch (err) {
      toast.error('Error al actualizar el estado');
    } finally {
      setIsConfirmOpen(false);
    }
  };

  const handleReportarIncidencia = async (datos: IncidenciaDTO) => {
    try {
      const response = await reportarIncidencia(datos);

      // Verificamos si la acción fue interceptada localmente
      if (response && (response as any)._offlineQueued) {
        toast.warning('Guardado sin conexión. Se sincronizará automáticamente');
      } else {
        toast.success('Incidencia reportada correctamente');
        // Solo recargamos si la petición fue real (online), ya que offline no hay datos nuevos que traer del servidor
        await recargar();
      }
    } catch (err) {
      const mensajeBackend = err instanceof Error ? err.message : 'Error inesperado';
      toast.error('El envío de la incidencia falló', { description: mensajeBackend });
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
        <div className="text-center py-12">
          {/* <p className="text-destructive mb-4">{obtenerMensajeError(error)}</p> */}
          <div className="p-6 bg-muted rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <GlobeX className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Sin conexión
          </h2>
          <p className="text-muted-foreground mb-6">
            No se pudo conectar con el servidor. Verifique su conexión o intente más tarde.
          </p>
          <Button onClick={recargar} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Sin viaje asignado
  if (!viaje) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="p-6 bg-muted rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Sin viajes asignados
          </h2>
          <p className="text-muted-foreground mb-6">
            Actualmente no tienes ningun viaje pendiente. Consulta con tu supervisor si esperas una asignacion.
          </p>
          <Button onClick={recargar} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>
    );
  }

  const flujo = FLUJO_LOGISTICO[viaje.estadoActual];
  const isCompleted = !flujo.siguiente;

  // Validamos que el viaje esté efectivamente en curso, excluyendo PENDIENTE y ENTREGADO/CANCELADO
  const esViajeEnCurso = ['EN_TRANSITO', 'EN_REPARTO'].includes(viaje.estadoActual);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Card del viaje */}
        <ViajeCard viaje={viaje} />

        {/* Acciones */}

        {/* Si aún el viaje no está completado */}
        {!isCompleted && (
          <div className="space-y-3">

            {/* BOTÓN DESACOPLADO DEL DIALOG */}
            <div>
              <ActionButton
                estadoActual={viaje.estadoActual}
                onClick={handleAccionPrincipal}
                // Sumamos isVerificando al isLoading para que muestre el spinner al consultar
                isLoading={isUpdating || isVerificando}
              // Elimina la propiedad disabled={viajeBloqueado}
              />
            </div>

            {/* DIALOG CONTROLADO MANUALMENTE POR ESTADO */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar accion</AlertDialogTitle>
                  <AlertDialogDescription>
                    {flujo.confirmacionText}<br />Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleAvanzarEstado}
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Confirmar'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>


            {/* NUEVO BOTÓN: Carta de Porte QR (US 55) */}
            <Button
              variant="outline"
              size="lg"
              className="w-full border-2 border-[#1b4332] text-[#1b4332] hover:bg-[#1b4332] hover:text-white transition-all bg-white"
              onClick={() => setIsQrModalOpen(true)}
            >
              <QrCode className="mr-2 h-5 w-5" />
              Ver Carta de Porte
            </Button>

            {/* Boton de incidencia */}
            <IncidenciaDrawer
              onSubmit={handleReportarIncidencia}
              isLoading={isUpdating}
              disabled={!esViajeEnCurso}// Deshabilita si el viaje no está en curso
            />
            {/* Mensaje explicativo*/}
            {!esViajeEnCurso && (
              <p className="text-xs text-muted-foreground text-center pt-1 px-2">
                Solo se pueden reportar incidencias sobre viajes en curso.
              </p>
            )}
          </div>
        )}

        {/* Mensaje de viaje completado */}
        {isCompleted && (
          <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">
              Viaje completado exitosamente
            </p>
            <Button onClick={recargar} variant="link" className="mt-2">
              Buscar nuevo viaje
            </Button>
          </div>
        )}
      </div>

      {/* MODAL CARTA DE PORTE QR (US 55) */}
      <CartaPorteModal
        idEnvio={viaje.idEnvio}
        open={isQrModalOpen}
        onOpenChange={setIsQrModalOpen}
      />

      {/* CONTENEDOR DEL MINIJUEGO INTERCEPTOR */}
      {mostrarTestFatiga && (
        <FatigueTestContainer onCompletado={handleTestCompletado} />
      )}
    </div>
  );
}
