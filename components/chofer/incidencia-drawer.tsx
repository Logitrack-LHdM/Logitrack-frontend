'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { IncidenciaDTO, TipoIncidencia } from '@/types';
import { toast } from 'sonner';

interface IncidenciaDrawerProps {
  onSubmit: (data: IncidenciaDTO) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean; // NUEVA PROPIEDAD
}

export function IncidenciaDrawer({ onSubmit, isLoading, disabled }: IncidenciaDrawerProps) {
  const [tipo, setTipo] = useState<string>(''); // Nuevo estado
  const [descripcion, setDescripcion] = useState('');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Función para manejar el evento de abrir/cerrar
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    // Si el panel se está cerrando, limpiamos el formulario
    if (!newOpen) {
      setTipo('');
      setDescripcion('');
    }
  };
  const handleSubmit = async () => {
    if (!tipo) return; // Ahora la validación principal es el tipo

    setSubmitting(true);
    try {
      await onSubmit({
        tipoIncidencia: tipo as TipoIncidencia,
        descripcion: descripcion.trim() ? descripcion : undefined
      });

      // Estas líneas SOLO se ejecutan si la petición al backend fue exitosa
      setDescripcion('');
      setTipo(''); // Limpiamos el tipo también
      setOpen(false);
    } catch (error) {
      // Capturamos el error propagado desde page.tsx
      // El modal queda abierto y con los datos intactos para que el chofer reintente
      // console.error('El envío de la incidencia falló:', error);
      // toast.error('El envío de la incidencia falló');

      // 1. Extraemos el mensaje real proveniente del backend (api.ts)
      const mensajeBackend = error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al contactar al servidor.';

      // 2. Lo mostramos en la descripción del toast
      toast.error('El envío de la incidencia falló', {
        description: mensajeBackend,
      });

    } finally {
      // Siempre quitamos el estado de carga, haya éxito o error
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {/* Sumamos la validación disabled a la que ya existía con isLoading */}
        <Button variant="outline" size="lg" className="w-full" disabled={isLoading || disabled}>
          <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
          Reportar Incidencia
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="min-h-[50vh] max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reportar Incidencia
          </SheetTitle>
          <SheetDescription>
            Describe el problema o incidencia que encontraste durante el viaje.
          </SheetDescription>
        </SheetHeader>

        <div className="py-2 space-y-5 px-1" role="form" aria-label="Formulario de reporte de incidencia">
          {/* Campo Tipo de Incidencia */}
          <div className="space-y-2 px-1">
            <Label htmlFor="tipo-incidencia" className="flex items-center gap-1 text-sm font-medium">
              Tipo de incidencia{' '}
              <span className="text-destructive font-bold" aria-hidden="true">*</span>
              <span className="sr-only">(requerido)</span>
            </Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo-incidencia" className="w-full bg-background transition-colors" aria-required="true" aria-label="Tipo de incidencia (requerido)">
                <SelectValue placeholder="Seleccione un motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MECANICA">Falla Mecánica</SelectItem>
                <SelectItem value="CLIMA">Problemas de Clima</SelectItem>
                <SelectItem value="TRAFICO">Tráfico / Corte de ruta</SelectItem>
                <SelectItem value="CONTROLES">Controles / Retenes</SelectItem>
                <SelectItem value="OTRO">Otro motivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campo Descripción */}
          <div className="space-y-2 px-1">
            <Label htmlFor="descripcion" className="text-sm font-medium text-muted-foreground">
              Descripción (Opcional)
            </Label>
            <Textarea
              id="descripcion"
              placeholder="Ej: Demora por un corte en la ruta o pinchadura de rueda..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-[120px] resize-none w-full bg-background transition-colors"
            />
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2 px-1 pb-2">
          <SheetClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Cancelar
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={!tipo || submitting} // Validamos por 'tipo' en lugar de 'descripcion'
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Reporte
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
