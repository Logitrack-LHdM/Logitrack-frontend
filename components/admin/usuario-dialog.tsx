'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usuarioFormSchema, type UsuarioFormValues } from '@/lib/validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UsuarioResponseDTO } from '@/types';
import { Loader2 } from 'lucide-react';

interface UsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioAEditar: UsuarioResponseDTO | null;
  onGuardar: (data: any) => Promise<void>;
}

export function UsuarioDialog({
  open,
  onOpenChange,
  usuarioAEditar,
  onGuardar,
}: UsuarioDialogProps) {
  const [enviando, setEnviando] = useState(false);
  const esEdicion = !!usuarioAEditar;

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      cuil: '',
      telefono: '',
      username: '',
      password: '',
      rol: 'ROLE_OPERADOR',
    },
  });

  // Re-inicializa el formulario según corresponda al abrir el modal
  useEffect(() => {
    if (open) {
      if (usuarioAEditar) {
        form.reset({
          nombre: usuarioAEditar.nombre || '',
          apellido: usuarioAEditar.apellido || '',
          cuil: usuarioAEditar.cuil || '',
          telefono: usuarioAEditar.telefono || '',
          username: usuarioAEditar.username || '',
          password: undefined,
          rol: usuarioAEditar.rol,
        });
      } else {
        form.reset({
          nombre: '',
          apellido: '',
          cuil: '',
          telefono: '',
          username: '',
          password: '',
          rol: 'ROLE_OPERADOR',
        });
      }
    }
  }, [open, usuarioAEditar, form]);

  const onSubmit = async (values: UsuarioFormValues) => {
    setEnviando(true);
    try {
      const payload = { ...values };
      // Al editar se elimina la contraseña del DTO para evitar sobrescrituras indeseadas
      if (esEdicion) {
        delete payload.password;
      }
      await onGuardar(payload);
      onOpenChange(false);
    } catch (error) {
      console.error('Error al procesar el formulario:', error);
    } finally {
      setEnviando(false);
    }
  };


  // console.log();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-t-4 border-t-[#2d6a4f]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {esEdicion ? 'Editar Cuenta de Usuario' : 'Registrar Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? 'Modifique las propiedades del usuario seleccionado.'
              : 'Ingrese la información personal y asigne las credenciales correspondientes para dar de alta al usuario.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">

            {/* Sección: Datos de Identidad */}
            <div>
              <h5 className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider mb-3 border-b pb-1">
                Información personal
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Carlos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Rodríguez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cuil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">CUIL</FormLabel>
                      <FormControl>
                        <Input placeholder="20XXXXXXXX9 (11 dígitos)" maxLength={11} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Teléfono de Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. 1123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección: Configuración del Sistema */}
            <div>
              <h5 className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider mb-3 border-b pb-1">
                Credenciales y rol
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">ID de Ingreso (mail)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ejemplo@logitrack.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Rol Asignado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Seleccionar Rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ROLE_OPERADOR">Operador</SelectItem>
                          <SelectItem value="ROLE_SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="ROLE_CHOFER">Chofer</SelectItem>
                          <SelectItem value="ROLE_ADMINISTRADOR">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!esEdicion && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-semibold">Contraseña Inicial</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Contraseña segura (mín. 6 caracteres)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Acciones del Dialog */}
            <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow" disabled={enviando}>
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {esEdicion ? 'Guardar Cambios' : 'Dar de Alta'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}