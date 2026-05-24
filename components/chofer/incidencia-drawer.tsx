'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
      setDescripcion('');
      setTipo(''); // Limpiamos el tipo también
      setOpen(false);
    } finally {
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

        <div className="py-1 space-y-1 px-1">

          <div className="space-y-2 px-1">
            <Label htmlFor="tipo-incidencia">Tipo de incidencia *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tipo-incidencia">
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

          <div className="space-y-2 px-1">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Describa detalladamente la incidencia..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="min-h-[120px] resize-none"
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
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Reporte'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
