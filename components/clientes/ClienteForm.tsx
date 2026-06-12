'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2, FileText, CalendarDays,
  Hash, UserPlus, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { clienteSchema, type ClienteFormData } from '@/lib/validators';
import { api } from '@/lib/api';

const TIPOS_EMPRESA = [
  { value: 'ACOPIO', label: 'Acopio' },
  { value: 'PUERTO', label: 'Puerto' },
  { value: 'PRODUCTOR', label: 'Productor' },
  { value: 'EXPORTADORA', label: 'Exportadora' },
  { value: 'MOLINO', label: 'Molino' },
  { value: 'COOPERATIVA', label: 'Cooperativa' },
  { value: 'PRODUCTORA', label: 'Productora' },
  { value: 'OTRA', label: 'Otra' },
];

export function ClienteForm() {
  const router = useRouter();
  const [cuitDuplicado, setCuitDuplicado] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      cuit: '',
      razonSocial: '',
      tipoEmpresa: '',
      rucaNro: '',
      vtoRuca: '',
      sede: {
        nombreLugar: '',
        direccion: '',
        latitud: '',
        longitud: '',
      },
      aceptaTerminos: false,
    },
  });

  const aceptaTerminos = watch('aceptaTerminos');

  const onSubmit = async (data: ClienteFormData) => {
    setCuitDuplicado(false);

    // Construir la sede solo si al menos un campo fue completado
    const sedeCompletada =
      data.sede?.nombreLugar || data.sede?.direccion ||
      data.sede?.latitud || data.sede?.longitud;

    const sede = sedeCompletada
      ? {
        nombreLugar: data.sede!.nombreLugar || '',
        direccion: data.sede!.direccion || '',
        latitud: data.sede?.latitud ? parseFloat(data.sede.latitud) : undefined,
        longitud: data.sede?.longitud ? parseFloat(data.sede.longitud) : undefined,
      }
      : undefined;

    try {
      await api.crearCliente({
        cuit: data.cuit,
        razonSocial: data.razonSocial,
        tipoEmpresa: data.tipoEmpresa,
        email: data.email,
        rucaNro: data.rucaNro || undefined,
        vtoRuca: data.vtoRuca || undefined,
        sede,
      });

      toast.success('Cliente creado correctamente');
      reset();
      router.push('/menu');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';

      if (message.includes('Ya existe un cliente registrado con este CUIT')) {
        setCuitDuplicado(true);
        setError('cuit', { message });
        toast.error(message);
      } else {
        toast.error('No se pudo registrar el cliente', { description: message });
      }
    }
  };

  const inputClass = (hasError: boolean) =>
    `bg-muted/30 border-0 shadow-sm h-11 ${hasError ? 'ring-2 ring-destructive' : ''}`;

  return (
    <>
      <div className="flex md:flex-row items-start md:items-center w-full md:w-auto gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
          <UserPlus className="h-7 w-7" />
        </div>
        <div>
          <h4 className="font-bold mb-1 text-xl md:text-2xl flex items-center gap-2 text-gray-900">
            Registrar Nuevo Cliente
          </h4>
          <p className="text-muted-foreground text-sm m-0"> Completá los datos del cliente para poder asignarle viajes y envíos.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden mb-10">

        {/* Header */}
        {/* <div className="bg-[#198754]/10 px-6 py-5 md:px-10 md:py-6 border-b border-[#198754]/25">
        <h4 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <UserPlus className="h-6 w-6 text-[#198754]" />
          Registrar Nuevo Cliente
        </h4>
        <p className="text-muted-foreground text-sm m-0">
          Completá los datos del cliente para poder asignarle viajes y envíos.
        </p>
      </div> */}

        {/* <div className="bg-[#198754]/10 p-6 md:p-8 border-b border-[#198754]/25">
        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
              Registrar Nuevo Cliente
            </h4>
            <p className="text-muted-foreground text-sm m-0">
              Completá los datos del cliente para poder asignarle viajes y envíos.
            </p>
          </div>
        </div>
      </div> */}





        {/* Cuerpo */}
        <div className="p-6 md:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

            {/* ── Sección: Datos Fiscales ── */}
            <div className="space-y-5">
              <h6 className="font-bold text-[#198754] mb-3 border-b border-[#198754]/20 pb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Datos Fiscales
              </h6>

              <div className="grid md:grid-cols-2 gap-6">

                {/* CUIT */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    CUIT <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Ej. 30-111"
                    {...register('cuit')}
                    className={inputClass(!!errors.cuit)}
                    onChange={(e) => {
                      if (cuitDuplicado) setCuitDuplicado(false);
                      register('cuit').onChange(e);
                    }}
                  />
                  {errors.cuit && (
                    <p className="text-xs text-destructive">{errors.cuit.message}</p>
                  )}
                </div>

                {/* Tipo de Empresa */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Tipo de Empresa <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="tipoEmpresa"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={`w-full bg-muted/30 border-0 shadow-sm h-11 ${errors.tipoEmpresa ? 'ring-2 ring-destructive' : ''}`}
                        >
                          <SelectValue placeholder="Seleccioná un tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_EMPRESA.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tipoEmpresa && (
                    <p className="text-xs text-destructive">{errors.tipoEmpresa.message}</p>
                  )}
                </div>
              </div>

              {/* Razón Social */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Razón Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ej. Agropecuaria del Sur S.A."
                  {...register('razonSocial')}
                  className={inputClass(!!errors.razonSocial)}
                />
                {errors.razonSocial && (
                  <p className="text-xs text-destructive">{errors.razonSocial.message}</p>
                )}
              </div>

              {/* Email del Cliente */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="Ej. contacto@empresa.com"
                  {...register('email')}
                  className={inputClass(!!errors.email)}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            {/* ── Sección: Datos RUCA ── */}
            <div className="space-y-5">
              <h6 className="font-bold text-[#198754] mb-3 border-b border-[#198754]/20 pb-2 flex items-center gap-2">
                <Hash className="h-5 w-5" /> Registro RUCA
                <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
              </h6>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Nro. RUCA
                  </Label>
                  <Input
                    placeholder="Ej. R-111"
                    {...register('rucaNro')}
                    className="bg-muted/30 border-0 shadow-sm h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> Vencimiento RUCA
                  </Label>
                  <Input
                    type="date"
                    {...register('vtoRuca')}
                    className="bg-muted/30 border-0 shadow-sm h-11"
                  />
                </div>
              </div>
            </div>

            {/* ── Sección: Sede Principal ── */}
            <div className="space-y-5">
              <h6 className="font-bold text-[#198754] mb-3 border-b border-[#198754]/20 pb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Sede Principal
                <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
              </h6>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Nombre del lugar */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Nombre del Lugar
                  </Label>
                  <Input
                    placeholder="Ej. Planta Norte"
                    {...register('sede.nombreLugar')}
                    className={inputClass(!!errors.sede?.nombreLugar)}
                  />
                  {errors.sede?.nombreLugar && (
                    <p className="text-xs text-destructive">{errors.sede.nombreLugar.message}</p>
                  )}
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Dirección
                  </Label>
                  <Input
                    placeholder="Ej. Av. Constitución 1450, San Miguel"
                    {...register('sede.direccion')}
                    className={inputClass(!!errors.sede?.direccion)}
                  />
                  {errors.sede?.direccion && (
                    <p className="text-xs text-destructive">{errors.sede.direccion.message}</p>
                  )}
                </div>
              </div>

              {/* Coordenadas */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Latitud
                  </Label>
                  <Input
                    placeholder="Ej. -34.5547"
                    {...register('sede.latitud')}
                    className={inputClass(!!errors.sede?.latitud)}
                  />
                  {errors.sede?.latitud ? (
                    <p className="text-xs text-destructive">{errors.sede.latitud.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Valores negativos para el hemisferio sur
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Longitud
                  </Label>
                  <Input
                    placeholder="Ej. -58.7080"
                    {...register('sede.longitud')}
                    className={inputClass(!!errors.sede?.longitud)}
                  />
                  {errors.sede?.longitud ? (
                    <p className="text-xs text-destructive">{errors.sede.longitud.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Valores negativos para el oeste del meridiano
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Checkbox Legal ── */}
            <div className="bg-[#198754]/10 p-4 rounded-lg border border-[#198754]/25">
              <Controller
                name="aceptaTerminos"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="aceptaTerminos"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-[#198754] data-[state=checked]:border-[#198754]"
                    />
                    <label
                      htmlFor="aceptaTerminos"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Acepta el tratamiento de los datos según la Ley 25.326.
                    </label>
                  </div>
                )}
              />
              {errors.aceptaTerminos && (
                <p className="text-xs text-destructive mt-2">{errors.aceptaTerminos.message}</p>
              )}
            </div>

            {/* ── Botones ── */}
            <div className="flex flex-col md:flex-row justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="px-8 h-11 text-muted-foreground font-semibold border-0 shadow-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !aceptaTerminos}
                className="px-10 h-11 font-bold text-white bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#2d6a4f] hover:to-[#40916c] border-none shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</>
                ) : (
                  'Guardar Cliente'
                )}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}