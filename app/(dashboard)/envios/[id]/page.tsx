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
  ClipboardList
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

export default function DetalleEnvioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // Pasamos el "id" directamente como string sin usar parseInt. Hook existente con los datos generales
  const { envio, historial, isLoading, isUpdating, error, actualizarEnvio } = useEnvioDetail(id);

  // Consumimos la ruta desde el nuevo hook independiente
  const { ruta } = useRastreoTiempoReal(id);

  const { permisos } = useAuth();

  const [nuevoEstado, setNuevoEstado] = useState<EstadoEnvio | ''>('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<Prioridad | ''>('');

  // Sincronizar el estado local cuando se carga el envío
  useEffect(() => {
    if (envio) {
      setNuevoEstado(envio.estadoActual);
      setNuevaPrioridad(envio.prioridadIa);
    }
  }, [envio]);

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
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:py-8 flex justify-center items-center min-h-[60vh]">
        <Spinner className="h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (error || !envio) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:py-8 text-center pt-20">
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
    }).format(fecha).replace(',', ' -') + ' hs';
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:py-8">
      {/* Botón Volver */}
      <Link
        href="/busqueda"
        className="text-[#198754] font-semibold mb-3 md:mb-4 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ArrowLeftCircle className="h-5 w-5" /> Volver a Rastreo
      </Link>

      <div className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden mt-2 md:mt-3 mb-10">

        {/* Header Azul - Ficha Operativa */}
        <div className="bg-blue-600/10 px-6 py-5 md:px-8 md:py-6 border-b border-blue-600/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold mb-1 text-xl md:text-2xl flex items-center gap-2 text-gray-900">
                <FileText className="text-blue-600 h-6 w-6" /> Ficha Operativa
              </h4>
              <p className="text-muted-foreground text-sm m-0">Detalles del transporte de carga.</p>
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
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
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
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={envio.origen?.nombreLugar || "No especificado"}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Establecimiento Destino
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={envio.destino?.nombreLugar || "No especificado"}
              />
            </div>
          </div>

          {/* Geolocalización con tolerancia a fallos*/}
          <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Geolocalización del Recorrido
          </h6>
          <div className="mb-10">
            <div className="w-full h-[320px] md:h-[480px] bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-sm relative">

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
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={pesoTn}
              />
            </div>
            <div className="col-span-12 md:col-span-8">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Tipo de Grano
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={normalizarEnum(envio.tipoGrano) || "General"}
              />
            </div>
          </div>



          {/* Documentación y Transporte */}
          <h6 className="font-bold text-[#198754] mb-4 border-b border-[#198754]/20 pb-2">
            Documentación y Transporte
          </h6>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                CPE (Carta de Porte)
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={envio.cpe || 'No especificado'}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Chofer Asignado
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
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
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={formatearHora(envio.fechaSalida)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Fecha Estimada de Llegada
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
                value={formatearHora(envio.fechaEstimadaLlegada)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Distancia Estimada
              </label>
              <input
                disabled
                className="w-full bg-transparent border-b border-dashed border-gray-300 pb-2 text-gray-700 font-medium outline-none"
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
                <h6 className="font-bold mb-5 text-lg flex items-center gap-2 text-gray-900">
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

          {/* Auditoría de Ruta */}
          <h6 className="font-bold text-gray-900 mb-4">Auditoría de Ruta</h6>
          <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <HistorialTable historial={historial} />
          </div>

        </div >
      </div >
    </div >
  );
}