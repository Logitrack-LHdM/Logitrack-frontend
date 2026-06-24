'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { desbloqueoCuentaSchema, type DesbloqueoCuentaFormData } from '@/lib/validators';
import { api, ApiError } from '@/lib/api';

interface UnlockAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Username (mail) de la cuenta bloqueada, precargado desde el formulario de login
  username: string;
  // Se dispara cuando la cuenta fue desbloqueada con éxito
  onDesbloqueada?: () => void;
}

// Mensaje de fallback por si el backend no devuelve "error" en el body
function obtenerMensajeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message === 'Failed to fetch') {
    return 'No se pudo conectar con el servidor. Verifique su conexión o intente más tarde.';
  }
  return 'No se pudo validar el código. Intente nuevamente.';
}

export function UnlockAccountDialog({
  open,
  onOpenChange,
  username,
  onDesbloqueada,
}: UnlockAccountDialogProps) {
  const [enviando, setEnviando] = useState(false);

  const form = useForm<DesbloqueoCuentaFormData>({
    resolver: zodResolver(desbloqueoCuentaSchema),
    defaultValues: { codigo: '' },
  });

  // Cada vez que se abre el modal se limpia el código anterior
  useEffect(() => {
    if (open) {
      form.reset({ codigo: '' });
    }
  }, [open, form]);

  const onSubmit = async (values: DesbloqueoCuentaFormData) => {
    setEnviando(true);
    try {
      const respuesta = await api.desbloquearCuenta({
        username,
        codigo: values.codigo,
      });

      toast.success('Cuenta desbloqueada', {
        description: respuesta.mensaje || 'Ya puede iniciar sesión con su contraseña habitual.',
      });

      onOpenChange(false);
      onDesbloqueada?.();
    } catch (error) {
      toast.error('No se pudo desbloquear la cuenta', {
        description: obtenerMensajeError(error),
      });
      form.setError('codigo', { type: 'manual' });
      form.resetField('codigo');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] border-t-4 border-t-[#2d6a4f]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#2d6a4f]/10">
              <MailCheck className="h-5 w-5 text-[#2d6a4f]" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Desbloquear cuenta
            </DialogTitle>
          </div>
          <DialogDescription>
            Por seguridad, su cuenta fue bloqueada tras varios intentos fallidos.
            Ingrese el código de 6 dígitos que enviamos a{' '}
            <span className="font-medium text-foreground">{username}</span> para
            restaurar el acceso.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel className="font-semibold self-start">
                    Código de seguridad
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={enviando}
                      aria-label="Código de seguridad de 6 dígitos"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground text-center">
              El código expira a los 10 minutos de haber sido generado. Si no lo
              encuentra, revise también la carpeta de spam.
            </p>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow"
                disabled={enviando || form.watch('codigo')?.length !== 6}
              >
                {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Desbloquear cuenta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
