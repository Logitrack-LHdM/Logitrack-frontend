'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeftCircle,
  FileText,
  MapPin,
  MapPinOff,
  ClipboardList,
  Loader2,
  FileDown,
  AlertTriangle
} from 'lucide-react';
import { EstadoTimeline } from '@/components/envios/estado-timeline';
import { HistorialTable } from '@/components/envios/historial-table';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { TruckStepper } from '@/components/envios/truck-stepper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEnvioDetail } from '@/hooks/use-envio-detail';
import { useAuth } from '@/contexts/auth-context';
import { ESTADO_CONFIG, PRIORIDAD_CONFIG } from '@/lib/constants';
import type { EstadoEnvio, Prioridad } from '@/types';
import { normalizarEnum } from '@/lib/utils';
import { MapaEnvio } from '@/components/envios/mapa-envio';
// import { useProgresoEnvio } from '@/hooks/use-progress';
import { useRastreoTiempoReal } from '@/hooks/use-rastreo-tiempo-real';
import { api } from '@/lib/api';

import type { AlertaFatigaDTO } from '@/types/websockets';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function DetalleEnvioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // Pasamos el "id" directamente como string sin usar parseInt. Hook existente con los datos generales estáticos
  const { envio, historial, isLoading, isUpdating, error, actualizarEnvio, recargar } = useEnvioDetail(id);

  // Consumimos la ruta desde el nuevo hook independiente. Extraemos también las coordenadas dinámicas del camión y el estado de error
  // MODIFICACIÓN: Le inyectamos 'envio?.estadoActual' al hook
  const { ruta, camionLat, camionLng, errorTracking } = useRastreoTiempoReal(id, envio?.estadoActual);

  const { permisos } = useAuth();

  const [nuevoEstado, setNuevoEstado] = useState<EstadoEnvio | ''>('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<Prioridad | ''>('');

  // Estado para la exportación
  const [isExporting, setIsExporting] = useState(false);

  // =========================================================================
  // NUEVOS ESTADOS Y ESCUCHA DE EVENTOS LOCALES - FASE 5 (US 68)
  // =========================================================================
  const [alertaFatiga, setAlertaFatiga] = useState<AlertaFatigaDTO | null>(null);
  const [isFuerzaMayorModalOpen, setIsFuerzaMayorModalOpen] = useState(false);
  const [motivoFuerzaMayor, setMotivoFuerzaMayor] = useState('');

  // ESTADOS PARA EL RECHAZO
  const [isRechazarModalOpen, setIsRechazarModalOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const [isProcesandoFatiga, setIsProcesandoFatiga] = useState(false);

  // Escuchamos el evento que emite useCampanaAlertas sin abrir otro WebSocket
  useEffect(() => {
    const handleFatigaWs = (e: Event) => {
      const customEvent = e as CustomEvent<AlertaFatigaDTO>;
      // Validación estricta: atrapamos la alerta SOLO si pertenece a este envío
      if (customEvent.detail.idEnvio === id) {
        setAlertaFatiga(customEvent.detail);
      }
    };

    window.addEventListener('alerta-fatiga-ws', handleFatigaWs);
    return () => window.removeEventListener('alerta-fatiga-ws', handleFatigaWs);
  }, [id]);
  // =========================================================================

  // =========================================================================
  // FUNCIONES DE RESOLUCIÓN DE FATIGA - FASE 5.4
  // =========================================================================
  const handleResetearFatiga = async () => {
    if (!alertaFatiga) return;
    setIsProcesandoFatiga(true);

    try {
      await api.resetearEvaluacion(alertaFatiga.idEvaluacion);
      toast.success('Evaluación reseteada', {
        description: 'Se ha notificado al sistema. El chofer ya puede intentar nuevamente.'
      });
      setAlertaFatiga(null); // Ocultamos el banner
      await recargar(); // Refrescamos el historial en pantalla
    } catch (err) {
      toast.error('Error al resetear', {
        description: err instanceof Error ? err.message : 'Error inesperado del servidor'
      });
    } finally {
      setIsProcesandoFatiga(false);
    }
  };

  const handleAutorizarFatiga = async () => {
    if (!alertaFatiga || !motivoFuerzaMayor.trim()) return;
    setIsProcesandoFatiga(true);

    try {
      await api.autorizarFuerzaMayor(alertaFatiga.idEvaluacion, motivoFuerzaMayor);
      toast.success('Autorización forzada aplicada', {
        description: 'El viaje ha sido desbloqueado exitosamente.'
      });

      // Limpiamos la UI
      setAlertaFatiga(null);
      setIsFuerzaMayorModalOpen(false);
      setMotivoFuerzaMayor('');

      await recargar(); // Refrescamos la auditoría para ver el registro
    } catch (err) {
      toast.error('Error al autorizar', {
        description: err instanceof Error ? err.message : 'Error inesperado del servidor'
      });
    } finally {
      setIsProcesandoFatiga(false);
    }
  };

  const handleRechazarFatiga = async () => {
    if (!alertaFatiga || !motivoRechazo.trim()) return;
    setIsProcesandoFatiga(true);

    try {
      await api.rechazarEvaluacion(alertaFatiga.idEvaluacion, motivoRechazo);
      toast.success('Rechazo confirmado', {
        description: 'El viaje se mantiene bloqueado y se ha registrado su justificación.'
      });

      // Limpiamos la UI
      setAlertaFatiga(null);
      setIsRechazarModalOpen(false);
      setMotivoRechazo('');

      await recargar(); // Refrescamos la auditoría
    } catch (err) {
      toast.error('Error al rechazar', {
        description: err instanceof Error ? err.message : 'Error inesperado del servidor'
      });
    } finally {
      setIsProcesandoFatiga(false);
    }
  };

  // Sincronizar el estado local cuando se carga el envío
  useEffect(() => {
    if (envio) {
      setNuevoEstado(envio.estadoActual);
      setNuevaPrioridad(envio.prioridadIa);
    }
  }, [envio]);

  // Feedback visual si se pierde la conexión con el camión
  useEffect(() => {
    if (errorTracking) {
      // toast.warning('Atención', {
      //   description: 'Se perdió la conexión temporal con el vehículo. Mostrando la última ubicación conocida en el mapa.',
      //   duration: 6000, // Le damos un poco más de tiempo para que el operador lo lea
      // });
    }
  }, [errorTracking]);

  // Código original (comentado por ahora)
  /*
  const porcentajeTiempo = useProgresoEnvio(
     envio?.estadoActual || 'PENDIENTE',
     envio?.fechaSalida,
     envio?.fechaEstimadaLlegada
  );
  */

  // Mock activo:
  // const porcentajeTiempo = useProgresoEnvio(
  //   envio?.estadoActual || 'PENDIENTE',
  //   '2026-05-17T23:20:00', // fechaSalida
  //   '2026-05-19T23:40:00'  // fechaEstimadaLlegada
  // );

  // Verificar si hay cambios reales para habilitar el botón de guardado
  const hayCambios = envio && (nuevoEstado !== envio.estadoActual || nuevaPrioridad !== envio.prioridadIa);

  const handleGuardarCambios = async () => {
    if (!nuevoEstado || !nuevaPrioridad) return;

    if (!envio?.chofer && (nuevoEstado !== envio?.estadoActual)) {
      toast.error('Error al cambiar el estado', {
        description: "No se puede iniciar el viaje sin un chofer asignado.",
        action: {
          label: "Asignar chofer",
          onClick: () => router.push('/asignaciones'),
        },
        actionButtonStyle: {
          backgroundColor: 'var(--destructive)',
          color: 'var(--background)',
        },
      });
      return;
    }

    try {
      // Usamos los nombres que espera el DTO de Java
      await actualizarEnvio({
        estado: nuevoEstado,
        prioridadIa: nuevaPrioridad
      });
      // IMPORTANTE: Recargamos la página igual que en detalleEnvio.js para actualizar el historial
      toast.success('Operación actualizada con éxito');
      // setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      toast.error('No se pudo actualizar el envío', { description: message });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8 flex justify-center items-center min-h-[60vh]">
        <Spinner className="h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (error || !envio) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8 text-center pt-20">
        <p className="text-destructive font-bold text-lg mb-4">
          {error || 'Envío no encontrado'}
        </p>
        <p className="text-muted-foreground text-sm mt-1">
          Si el problema persiste, contacte al soporte.
        </p>
        <Button variant="outline" onClick={() => router.push('/busqueda')}>Volver a Rastreo</Button>
      </div>
    );
  }

  const pesoTn = envio.kgOrigen ? (envio.kgOrigen / 1000).toFixed(1) : '0';

  // // Función para formatear las fechas al estilo argentino (ej: 17 may, 17:00 hs)
  const formatearHora = (fechaString?: string) => {
    if (!fechaString) return '--:--';
    const fecha = new Date(fechaString);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fecha).replace(',', ' -');
  };

  // Controlador del botón de exportación
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const endpoint = `/envios/${id}/pdf-carta-porte`;

      // 1. Llamas al endpoint real de Spring Boot (la URL dependerá de lo que defina el backend)
      const blob = await api.descargarArchivo(endpoint);

      // 2. Creas una URL temporal para el archivo recibido
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // 3. Fuerzas la descarga
      link.setAttribute('download', `Carta_Porte_${envio.cpe}.pdf`);
      document.body.appendChild(link);
      link.click();

      // 4. Limpias el DOM
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('¡Exportación exitosa!', {
        description: `El archivo se descargó correctamente desde el servidor.`,
      });
    } catch (err) {
      toast.error('Error al exportar', {
        description: err instanceof Error ? err.message : 'El servidor no pudo generar el archivo. Por favor, intente nuevamente.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
      {/* Botón Volver */}
      <Link
        href="/busqueda"
        className="text-[#198754] font-semibold mb-3 md:mb-4 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ArrowLeftCircle className="h-5 w-5" /> Volver a Rastreo
      </Link>

      {/* ======================================================================= */}
      {/* NUEVO: BANNER AMARILLO DE ALERTA DE FATIGA (FASE 5.3)                   */}
      {/* ======================================================================= */}
      {alertaFatiga && (
        <div className="mb-6 mt-2 rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 md:p-6 shadow-md animate-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4 w-full md:w-auto">
              <div className="rounded-full bg-amber-100 p-3 shrink-0">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-amber-900">
                  Bloqueo por Prevención de Fatiga
                </h3>
                <p className="text-amber-800 mt-1 font-medium text-sm md:text-base">
                  El chofer <span className="font-bold">{alertaFatiga.nombreChofer}</span> no superó el test de reflejos.
                </p>
                <p className="text-xs md:text-sm text-amber-700/80 mt-1">
                  Motivo del sistema: {alertaFatiga.motivo}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
              <Button
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-100 bg-white"
                disabled={isProcesandoFatiga}
                onClick={handleResetearFatiga}
              >
                Permitir reintento
              </Button>

              <Button
                className="bg-red-600 text-white hover:bg-red-700 shadow-sm"
                disabled={isProcesandoFatiga}
                onClick={() => setIsRechazarModalOpen(true)}
              >
                Rechazar
              </Button>

              <Button
                className="bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
                disabled={isProcesandoFatiga}
                onClick={() => setIsFuerzaMayorModalOpen(true)}
              >
                Forzar autorización
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor principal original */}
      <div className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden mt-2 md:mt-3 mb-10">

        {/* Header Azul - Ficha Operativa */}
        <div className="bg-blue-600/10 px-6 py-5 md:px-8 md:py-6 border-b border-blue-600/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex md:flex-row items-start md:items-center w-full md:w-auto gap-4">
              <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-md group-hover:shadow-lg transition-shadow">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-bold mb-1 text-xl md:text-2xl flex items-center gap-2 text-foreground">
                  {/* <FileText className="text-blue-600 h-6 w-6" />  */} Ficha Operativa
                </h4>
                <p className="text-muted-foreground text-sm m-0">Detalles del transporte de carga.</p>
              </div>
            </div>
            <div className="bg-white px-6 py-3 rounded-xl border shadow-sm text-center w-full md:w-auto">
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                ID Rastreo
              </span>
              <span className="font-extrabold text-2xl text-blue-600 leading-none">
                {envio.idEnvio}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10">

          {/* Empresa Cliente */}
          <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2">
            Empresa Cliente
          </h6>
          <div className="grid md:grid-cols-12 gap-6 mb-8">
            <div className="col-span-12 md:col-span-8">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Razón Social
              </label>
              <input
                type="text"
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={envio.origen?.empresa?.razonSocial || "No especificado"}
              />
            </div>
          </div>

          {/* Ruta del Viaje */}
          <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2">
            Ruta del Viaje
          </h6>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Establecimiento Origen
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={envio.origen?.nombreLugar || "No especificado"}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Establecimiento Destino
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={envio.destino?.nombreLugar || "No especificado"}
              />
            </div>
          </div>

          {/* Geolocalización con tolerancia a fallos*/}
          <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2 flex items-center gap-2">
            {/* <MapPin className="h-4 w-4" /> Geolocalización del Recorrido */}
            <MapPin className="h-4 w-4" /> Mapa interactivo
          </h6>
          <div className="mb-10">
            <div className="w-full h-[320px] md:h-[480px] bg-background border border-gray-100 rounded-2xl overflow-hidden shadow-sm relative">

              {/* Evaluamos si tenemos la data geográfica completa */}
              {envio.origen?.latitud && envio.origen?.longitud && envio.destino?.latitud && envio.destino?.longitud ? (
                <MapaEnvio
                  origenLat={envio.origen.latitud}
                  origenLng={envio.origen.longitud}
                  destinoLat={envio.destino.latitud}
                  destinoLng={envio.destino.longitud}
                  origenNombre={envio.origen.nombreLugar}
                  destinoNombre={envio.destino.nombreLugar}
                  ruta={ruta}
                  camionLat={camionLat} // Latitud en tiempo real
                  camionLng={camionLng} // Longitud en tiempo real
                  estadoActual={envio.estadoActual}
                />
              ) : (
                /* Empty State: UI amigable cuando no hay coordenadas */
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-gray-50/50">
                  <MapPinOff className="h-12 w-12 mb-4 opacity-20 text-gray-500" />
                  <p className="font-bold text-lg text-gray-700">Coordenadas no disponibles</p>
                  <p className="text-sm mt-1 max-w-sm">
                    El sistema no pudo recuperar la información geográfica de los establecimientos para este viaje.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Detalle de Carga */}
          <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2">
            Detalle de Carga
          </h6>
          <div className="grid md:grid-cols-12 gap-6 mb-10">
            <div className="col-span-12 md:col-span-4">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Peso Neto (Tn)
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={pesoTn}
              />
            </div>
            <div className="col-span-12 md:col-span-8">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Tipo de Grano
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={normalizarEnum(envio.tipoGrano) || "General"}
              />
            </div>
          </div>



          {/* Documentación y Transporte */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 md:px-0">
            <div className="w-full">
              <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2">
                Documentación y Transporte
              </h6>
            </div>
            <div>
              <Button
                className="bg-[#1b4332] hover:bg-[#2d6a4f] text-white w-full sm:w-auto shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                disabled={isExporting}
                onClick={handleExport}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}

                {/* Texto para PC */}
                <span className="hidden sm:inline">
                  {isExporting ? 'Exportando...' : 'Descargar CPE'}
                </span>

                {/* Texto para Móviles */}
                <span className="sm:hidden">
                  {isExporting ? 'Exportando...' : 'Descargar CPE'}
                </span>
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                CPE (Carta de Porte)
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={envio.cpe || 'No especificado'}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Chofer Asignado
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={
                  envio.chofer
                    ? `${envio.chofer.personaAsociada.nombre} ${envio.chofer.personaAsociada.apellido}`
                    : 'Sin asignar'
                }
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Fecha de Salida
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={formatearHora(envio.fechaSalida)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Fecha Estimada de Llegada
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={formatearHora(envio.fechaEstimadaLlegada)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Distancia Estimada
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-border pb-2 text-gray-700 font-medium outline-none"
                value={envio.distanciaKm ? `${envio.distanciaKm.toFixed(1)} km` : 'No disponible'}
              />
            </div>
          </div>

          {/* Estado del Recorrido (Timeline) */}
          <h6 className="font-bold text-[#198754] mb-6 border-b border-[#198754]/20 pb-2">
            Estado del Recorrido
          </h6>
          <div className="mb-12">
            <EstadoTimeline estadoActual={envio.estadoActual} />

            <div className="mt-6">
              <TruckStepper estadoActual={envio.estadoActual} />
            </div>
          </div>

          {/* Panel Avanzado de Progreso de Viaje*/}
          {/* {envio.estadoActual !== 'PENDIENTE' && envio.estadoActual !== 'CANCELADO' && (
            <div className="mb-12">
              <div className="mt-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-6"> */}

          {/* Texto indicativo*/}
          {/* <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-2">
                  <div className="mb-1">
                    <h6 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      Progreso del Recorrido
                      {envio.estadoActual !== 'ENTREGADO' && porcentajeTiempo < 99 && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                      )}
                    </h6>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-blue-600">
                      {porcentajeTiempo}%
                    </span>
                  </div>
                </div> */}

          {/* Barra de progreso */}
          {/* <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${porcentajeTiempo === 99 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                    style={{ width: `${porcentajeTiempo}%` }}
                  />
                </div> */}

          {/* Hitos temporales en los extremos */}
          {/* <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <div className="flex flex-col">
                    <span className="uppercase text-[10px] tracking-wider mb-0.5">Salida</span>
                    <span className="text-slate-600">{formatearHora(envio.fechaSalida)}</span>
                  </div>
                  {envio.estadoActual !== 'ENTREGADO' && (
                    <div className="flex flex-col text-right">
                      <span className="uppercase text-[10px] tracking-wider mb-0.5">Llegada Estimada</span>
                      <span className={porcentajeTiempo === 99 ? 'text-amber-600' : 'text-slate-600'}>
                        {formatearHora(envio.fechaEstimadaLlegada)}
                      </span>
                    </div>
                  )}
                  {envio.estadoActual == 'ENTREGADO' && (
                    <div className="flex flex-col text-right">
                      <span className="uppercase text-[10px] tracking-wider mb-0.5">Llegada</span>
                      <span className="text-slate-600">
                        {formatearHora(envio.fechaLlegada)}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )} */}

          {/* Panel Simple de Progreso de Viaje*/}
          {/* {envio.estadoActual !== 'PENDIENTE' && envio.estadoActual !== 'CANCELADO' && (
            <div className="mb-12">
              <div className="mt-8 bg-slate-50 rounded-xl p-4 border border-slate-100"> */}

          {/* Texto indicativo*/}
          {/* <div className="flex justify-between items-center mb-2">

                  <h6 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    Progreso del Recorrido
                    {envio.estadoActual !== 'ENTREGADO' && porcentajeTiempo < 99 && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                      </span>
                    )}
                  </h6>

                  <span className="text-sm font-bold text-blue-600">{porcentajeTiempo}%</span>
                </div> */}

          {/* Barra de progreso */}
          {/* <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${porcentajeTiempo}%` }}
                  ></div>
                </div> */}

          {/* Mensaje de demora */}
          {/* {porcentajeTiempo === 99 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    El envío presenta una demora respecto a la fecha estimada original.
                  </p>
                )}
              </div>
            </div>
          )} */}


          {/* Gestión Operativa (Roles y Permisos) */}
          {
            (permisos?.editarEstado || permisos?.editarPrioridad) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 md:p-8 mb-10">
                <h6 className="font-bold mb-5 text-lg flex items-center gap-2 text-foreground">
                  <ClipboardList className="text-amber-500 h-6 w-6" /> Gestión Operativa
                </h6>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2">
                      Estado
                    </label>
                    <Select
                      value={nuevoEstado}
                      onValueChange={(v) => setNuevoEstado(v as EstadoEnvio)}
                      disabled={!permisos?.editarEstado || isUpdating}
                    >
                      <SelectTrigger className="w-full h-11 bg-white border-0 shadow-sm focus:ring-amber-500">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ESTADO_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2">
                      Prioridad
                    </label>
                    <Select
                      value={nuevaPrioridad}
                      onValueChange={(v) => setNuevaPrioridad(v as Prioridad)}
                      disabled={!permisos?.editarPrioridad || isUpdating || envio.estadoActual !== 'PENDIENTE'}                  >
                      <SelectTrigger className="w-full h-11 bg-white border-0 shadow-sm focus:ring-amber-500">
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORIDAD_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleGuardarCambios}
                    disabled={!hayCambios || isUpdating}
                    className="w-full md:w-auto h-11 px-8 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm transition-all"
                  >
                    {isUpdating ? (
                      <><Spinner className="mr-2 h-4 w-4 border-white" /> Actualizando...</>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </div>
              </div>
            )
          }

          {/* Auditoría */}
          <h6 className="font-bold text-foreground mb-4">Auditoría</h6>
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <HistorialTable historial={historial} />
          </div>

        </div >
      </div >

      {/* ======================================================================= */}
      {/* NUEVO: MODAL DE FUERZA MAYOR (FASE 5.3)                                 */}
      {/* ======================================================================= */}
      <Dialog open={isFuerzaMayorModalOpen} onOpenChange={setIsFuerzaMayorModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Forzar Autorización de Viaje
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Está a punto de sobreescribir un bloqueo por fatiga extrema.
              Esta acción excepcional permitirá al chofer iniciar el viaje y quedará registrada en la auditoría bajo su autoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-sm font-semibold text-gray-700">
                Motivo de autorización <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Ej: Chofer presentó certificado médico en mano. Se autoriza la salida..."
                value={motivoFuerzaMayor}
                onChange={(e) => setMotivoFuerzaMayor(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isProcesandoFatiga}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              disabled={isProcesandoFatiga}
              onClick={() => {
                setIsFuerzaMayorModalOpen(false);
                setMotivoFuerzaMayor('');
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!motivoFuerzaMayor.trim() || isProcesandoFatiga}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleAutorizarFatiga}
            >
              {isProcesandoFatiga ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                'Confirmar y Autorizar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================================= */}
      {/* MODAL DE CONFIRMACIÓN DE RECHAZO                                        */}
      {/* ======================================================================= */}
      <Dialog open={isRechazarModalOpen} onOpenChange={setIsRechazarModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Rechazo Definitivo
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Está a punto de ratificar el bloqueo del viaje. El chofer no podrá iniciar el recorrido.
              Debe ingresar un motivo para la auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivoRechazo" className="text-sm font-semibold text-gray-700">
                Motivo de rechazo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivoRechazo"
                placeholder="Ej: Me comuniqué con el chofer y confirma sentirse indispuesto..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isProcesandoFatiga}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              disabled={isProcesandoFatiga}
              onClick={() => {
                setIsRechazarModalOpen(false);
                setMotivoRechazo('');
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!motivoRechazo.trim() || isProcesandoFatiga}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRechazarFatiga}
            >
              {isProcesandoFatiga ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
              ) : (
                'Confirmar Rechazo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div >
  );
}