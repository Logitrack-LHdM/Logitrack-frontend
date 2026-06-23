'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, User, MapPin, AlertCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { AsignacionesSearch } from './asignaciones-search';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EstadoBadge } from '@/components/envios/estado-badge';
import { api } from '@/lib/api';
import { getNombreChofer, normalizarEnum } from '@/lib/utils';
import type { Envio, Chofer, Camion } from '@/types';

export function AsignacionesTable() {
  // ── Datos ──────────────────────────────────────────────────────────────────
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [envioSeleccionado, setEnvioSeleccionado] = useState<Envio | null>(null);
  const [choferSeleccionado, setChoferSeleccionado] = useState('');
  const [camionSeleccionado, setCamionSeleccionado] = useState('');
  const [motivoReasignacion, setMotivoReasignacion] = useState(''); // US 67 (#590)
  const [guardando, setGuardando] = useState(false);
  const [modoModal, setModoModal] = useState<'asignar' | 'reasignar'>('asignar');

  // US 67 (#592) — fuerza el re-fetch de AsignacionesSearch tras reasignar
  const [refreshBusquedaKey, setRefreshBusquedaKey] = useState(0);

  // ── Carga inicial ─ Temporal ─────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setLoadingDatos(true);
    try {
      // Intentar con los endpoints de disponibles primero.
      // Si cualquiera falla, hacer fallback silencioso a los endpoints generales.
      const [enviosData, choferesData, camionesData] = await Promise.all([
        api.getEnviosSinAsignar(),
        api.getChoferesDisponibles(),
        api.getCamionesDisponibles(),
      ]);

      setEnvios(enviosData);
      setChoferes(choferesData);
      setCamiones(camionesData);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoadingDatos(false);
    }
  }, []);


  // ── Carga inicial ─ A implementar ─────────────────────────────────────────────────────────
  // const cargarDatos = useCallback(async () => {
  //   setLoadingDatos(true);
  //   try {
  //     const [enviosData, choferesData, camionesData] = await Promise.all([
  //       api.getEnviosSinAsignar(),
  //       api.getChoferesDisponibles(),
  //       api.getCamionesDisponibles(),
  //     ]);
  //     setEnvios(enviosData);
  //     setChoferes(choferesData);
  //     setCamiones(camionesData);
  //   } catch (error) {
  //     toast.error('Error al cargar los datos');
  //   } finally {
  //     setLoadingDatos(false);
  //   }
  // }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Abrir / cerrar modal ───────────────────────────────────────────────────
  const abrirModal = (envio: Envio, modo: 'asignar' | 'reasignar' = 'asignar') => {
    setEnvioSeleccionado(envio);
    setModoModal(modo);
    setMotivoReasignacion(''); // US 67 (#590) — siempre arranca vacío
    if (modo === 'reasignar') {
      setChoferSeleccionado(envio.chofer?.idChofer?.toString() ?? '');
      setCamionSeleccionado(envio.camion?.patente ?? '');
    } else {
      setChoferSeleccionado('');
      setCamionSeleccionado('');
    }
  };

  const cerrarModal = () => {
    if (guardando) return; // No cerrar mientras guarda
    setEnvioSeleccionado(null);
    setChoferSeleccionado('');
    setCamionSeleccionado('');
    setMotivoReasignacion(''); // US 67 (#590)
  };

  // ── Confirmar asignación / reasignación ─────────────────────────────────
  const confirmarAsignacion = async () => {
    if (!envioSeleccionado || !choferSeleccionado || !camionSeleccionado) return;

    // US 67 — Criterio 4: el motivo es obligatorio al reasignar (#590/#592)
    if (modoModal === 'reasignar' && !motivoReasignacion.trim()) {
      toast.error('Falta el motivo', {
        description: 'Contá por qué se reasigna este viaje antes de confirmar.',
      });
      return;
    }

    setGuardando(true);
    try {
      if (modoModal === 'reasignar') {
        // US 67 (#592) — PUT /envios/{id}/reasignar: además de actualizar
        // chofer/camión, libera los recursos viejos, desvincula los bloqueos
        // de fatiga del chofer anterior para este viaje y deja la auditoría
        // con el motivo ingresado (#587, #588, #589 en el backend).
        await api.reasignarViaje(String(envioSeleccionado.idEnvio), {
          nuevoChoferId: parseInt(choferSeleccionado, 10),
          nuevoCamionId: camionSeleccionado,
          motivoReasignacion: motivoReasignacion.trim(),
        });
        toast.success(`Viaje ${envioSeleccionado.idEnvio} reasignado correctamente`);
      } else {
        await api.asignarTransporte(String(envioSeleccionado.idEnvio), {
          idChofer: parseInt(choferSeleccionado, 10),
          patenteCamion: camionSeleccionado,
        });
        toast.success(`Transporte asignado al envío ${envioSeleccionado.idEnvio}`);
      }

      // Recarga visual de los catálogos (#592): los recursos viejos vuelven a
      // estar disponibles y los nuevos salen de la lista.
      const [choferesData, camionesData] = await Promise.all([
        api.getChoferesDisponibles(),
        api.getCamionesDisponibles(),
      ]);
      setChoferes(choferesData);
      setCamiones(camionesData);

      if (modoModal === 'asignar') {
        // Quitar el envío de la lista de "sin asignar" (ya quedó asignado)
        setEnvios((prev) => prev.filter((e) => e.idEnvio !== envioSeleccionado.idEnvio));
      } else {
        // US 67 (#592) — recargar visualmente la tabla de búsqueda
        setRefreshBusquedaKey((k) => k + 1);
      }
      cerrarModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar los cambios';
      toast.error(
        modoModal === 'reasignar' ? 'Error al reasignar el viaje' : 'Error al asignar transporte',
        { description: message }
      );
    } finally {
      setGuardando(false);
    }
  };

  const puedeConfirmar =
    !!choferSeleccionado &&
    !!camionSeleccionado &&
    (modoModal !== 'reasignar' || !!motivoReasignacion.trim()) &&
    !guardando;

  // ── Camiones aptos para la carga del envío seleccionado ────────────────────
  const kgCarga = envioSeleccionado?.kgOrigen ?? 0;
  const camionesAptos2 = camiones
  const camionesAptos = camiones.filter(e => e.capacidadCargaKg >= kgCarga);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingDatos) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b4332]" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="py-6 md:py-6">
        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2 mb-1">
              Asignación de Transporte
            </h4>
            <p className="text-muted-foreground text-sm">
              Envíos pendientes de asignación de chofer y camión.
              {envios.length > 0 && (
                <span className="ml-2 font-semibold text-[#198754]">
                  {envios.length} {envios.length === 1 ? 'envío pendiente' : 'envíos pendientes'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Encabezado de sección */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {/* <div className="bg-[#198754]/10 p-6 md:p-8 border-b border-[#198754]/25">
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                Asignación de Transporte
              </h4>
              <p className="text-muted-foreground text-sm">
                Envíos pendientes de asignación de chofer y camión.
                {envios.length > 0 && (
                  <span className="ml-2 font-semibold text-[#198754]">
                    {envios.length} {envios.length === 1 ? 'envío pendiente' : 'envíos pendientes'}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div> */}

        {/* <div className="bg-[#198754]/10 px-6 py-5 md:px-10 md:py-6 border-b border-[#198754]/25">
          <h4 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
            <Truck className="h-6 w-6 text-[#198754]" /> Asignación de Transporte
          </h4>
          <p className="text-muted-foreground text-sm">
            Envíos pendientes de asignación de chofer y camión.
            {envios.length > 0 && (
              <span className="ml-2 font-semibold text-[#198754]">
                {envios.length} {envios.length === 1 ? 'envío pendiente' : 'envíos pendientes'}
              </span>
            )}
          </p>
        </div> */}

        {/* Estado vacío */}
        {envios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <CheckCircle2 className="h-12 w-12 text-[#198754]/40 mb-4" />
            <p className="font-semibold text-gray-700">Todo asignado</p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay envíos pendientes de asignación de transporte.
            </p>
          </div>
        ) : (
          <>
            {/* Tabla Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    {/* <TableHead className="py-4 pl-6 font-semibold">ID / CTG</TableHead> */}
                    <TableHead className="py-4 pl-6 font-semibold">ID</TableHead>
                    <TableHead className="py-4 font-semibold">Cliente</TableHead>
                    <TableHead className="py-4 font-semibold">Ruta</TableHead>
                    <TableHead className="py-4 font-semibold">Carga</TableHead>
                    <TableHead className="py-4 font-semibold">Estado</TableHead>
                    <TableHead className="py-4 pr-6 text-right font-semibold">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envios.map((envio) => {
                    const pesoTn = envio.kgOrigen ? (envio.kgOrigen / 1000).toFixed(1) : '0';
                    return (
                      <TableRow key={envio.idEnvio} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-6">
                          <span className="font-bold text-[#198754] block">{envio.idEnvio}</span>
                          {/* <span className="text-xs text-muted-foreground">CTG: {envio.trackingCtg}</span> */}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground block">
                            {envio.origen?.empresa?.razonSocial || 'Sin cliente'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            CPE: {envio.cpe}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            {envio.origen?.nombreLugar || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground ml-4">
                            → {envio.destino?.nombreLugar || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-foreground block">
                            {normalizarEnum(envio.tipoGrano)}
                          </span>
                          <span className="text-xs text-muted-foreground">{pesoTn} Tn</span>
                        </TableCell>
                        <TableCell>
                          <EstadoBadge estado={envio.estadoActual} />
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button
                            size="sm"
                            onClick={() => abrirModal(envio)}
                            className="bg-[#198754] hover:bg-[#157347] text-white shadow-sm"
                          >
                            <Truck className="h-4 w-4 mr-1.5" /> Asignar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Tarjetas Mobile */}
            <div className="md:hidden p-4 space-y-4">
              {envios.map((envio) => {
                const pesoTn = envio.kgOrigen ? (envio.kgOrigen / 1000).toFixed(1) : '0';
                return (
                  <div
                    key={envio.idEnvio}
                    className="bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center border-b pb-2">
                      <div>
                        <span className="font-bold text-[#198754] block">{envio.idEnvio}</span>
                        {/* <span className="text-xs text-muted-foreground">CTG: {envio.trackingCtg}</span> */}
                      </div>
                      <EstadoBadge estado={envio.estadoActual} showIcon={false} />
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Cliente</span>
                      <span className="font-medium text-foreground text-right">
                        {envio.origen?.empresa?.razonSocial || '-'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Ruta</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-700 block">{envio.origen?.nombreLugar || '-'}</span>
                        <span className="text-xs text-muted-foreground">→ {envio.destino?.nombreLugar || '-'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Carga</span>
                      <div className="text-right">
                        <span className="font-medium text-foreground block">{normalizarEnum(envio.tipoGrano)}</span>
                        <span className="text-xs text-muted-foreground">{pesoTn} Tn</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => abrirModal(envio)}
                      className="w-full bg-[#198754] hover:bg-[#157347] text-white"
                    >
                      <Truck className="h-4 w-4 mr-2" /> Asignar Transporte
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <AsignacionesSearch
        onReasignar={(envio) => abrirModal(envio, 'reasignar')}
        refreshKey={refreshBusquedaKey}
      />
      {/* ── Modal de Asignación ──────────────────────────────────────────────── */}
      <Dialog open={!!envioSeleccionado} onOpenChange={(open) => !open && cerrarModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {modoModal === 'reasignar' ? (
                <RefreshCw className="h-5 w-5 text-blue-600" />
              ) : (
                <Truck className="h-5 w-5 text-[#198754]" />
              )}
              {modoModal === 'reasignar' ? 'Reasignar Transporte' : 'Asignar Transporte'}
            </DialogTitle>
            {envioSeleccionado && (
              <DialogDescription>
                Envío{' '}
                <span className={`font-semibold ${modoModal === 'reasignar' ? 'text-blue-600' : 'text-[#198754]'}`}>
                  {envioSeleccionado.idEnvio}
                </span>
                {' '}— {envioSeleccionado.origen?.empresa?.razonSocial || ''}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Aviso: ambos obligatorios */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                {modoModal === 'reasignar'
                  ? 'Podés cambiar uno o ambos. Confirmá para guardar los cambios.'
                  : <>Debe seleccionar <strong>ambos</strong> (chofer y camión) para confirmar la asignación.</>
                }
              </p>
            </div>

            {modoModal === 'reasignar' && envioSeleccionado && (envioSeleccionado.chofer || envioSeleccionado.camion) && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Asignación actual</p>
                {envioSeleccionado.chofer && (
                  <p className="text-xs text-blue-800 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {getNombreChofer(envioSeleccionado.chofer)}
                  </p>
                )}
                {envioSeleccionado.camion && (
                  <p className="text-xs text-blue-800 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    {envioSeleccionado.camion.patente}
                  </p>
                )}
              </div>
            )}

            {/* Select Chofer */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Chofer <span className="text-destructive">*</span>
              </Label>
              <Select value={choferSeleccionado} onValueChange={setChoferSeleccionado}>
                <SelectTrigger className="bg-muted/30 border-0 shadow-sm h-11 w-full">
                  <SelectValue placeholder="Seleccione un chofer..." />
                </SelectTrigger>
                <SelectContent>
                  {choferes.map((chofer) => (
                    <SelectItem key={chofer.idChofer} value={chofer.idChofer.toString()}>
                      {getNombreChofer(chofer)} — Lic: {chofer.nroLicencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Camión */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Camión <span className="text-destructive">*</span>
              </Label>
              <Select value={camionSeleccionado} onValueChange={setCamionSeleccionado}>
                <SelectTrigger className="bg-muted/30 border-0 shadow-sm h-11 w-full">
                  {camionesAptos.length === 0 && kgCarga > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Sin camiones con cap. suficiente.</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleccione un camión..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {camionesAptos.length === 0 ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      No hay camiones con capacidad suficiente para esta carga
                      ({(kgCarga / 1000).toFixed(1)} Tn).
                    </div>
                  ) : (
                    camionesAptos.map((camion) => (
                      <SelectItem key={camion.patente} value={camion.patente}>
                        {camion.patente} — Cap: {(camion.capacidadCargaKg / 1000).toFixed(1)} Tn
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {kgCarga > 0 && (
                <p className="text-xs text-muted-foreground">
                  Se muestran solo camiones con capacidad ≥{' '}
                  <span className="font-semibold text-gray-700">
                    {(kgCarga / 1000).toFixed(1)} Tn
                  </span>
                  {' '}({camionesAptos.length} de {camiones.length} disponibles).
                </p>
              )}
            </div>

            {/* US 67 (#590) — Motivo de la reasignación: solo aplica en modo reasignar */}
            {modoModal === 'reasignar' && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Motivo de la reasignación <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={motivoReasignacion}
                  onChange={(e) => setMotivoReasignacion(e.target.value)}
                  placeholder="Ej: el chofer presentó fatiga extrema y no puede continuar el viaje."
                  rows={3}
                  disabled={guardando}
                  className="bg-muted/30 border-0 shadow-sm resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Este motivo queda registrado en la auditoría del viaje junto con el chofer anterior y el nuevo.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={cerrarModal}
              disabled={guardando}
              className="border-0 shadow-sm"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarAsignacion}
              disabled={!puedeConfirmar}
              className={
                modoModal === 'reasignar'
                  ? 'bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white border-none shadow-sm'
                  : 'bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#2d6a4f] hover:to-[#40916c] text-white border-none shadow-sm'
              }
            >
              {guardando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : modoModal === 'reasignar' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Confirmar Reasignación
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Asignación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}