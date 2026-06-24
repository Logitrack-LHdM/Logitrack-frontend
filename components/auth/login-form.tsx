'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Lock, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { UnlockAccountDialog } from '@/components/auth/unlock-account-dialog';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Agregá esta función arriba del componente LoginForm
function obtenerMensajeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (!(error instanceof Error)) return 'Error de autenticación';

  // Sin conexión al servidor
  if (error.message === 'Failed to fetch') {
    return 'No se pudo conectar con el servidor. Verifique su conexión o intente más tarde.';
  }

  // Credenciales incorrectas (viene de api.ts)
  if (error.message === 'Credenciales incorrectas o usuario inactivo') {
    return 'El usuario o la contraseña son incorrectos.';
  }

  // Cualquier otro error técnico
  return 'Ocurrió un error inesperado. Intente nuevamente.';
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false);
  const [usernameBloqueado, setUsernameBloqueado] = useState('');
  const [modalDesbloqueoAbierto, setModalDesbloqueoAbierto] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const camposCompletos = watch('username') && watch('password');

  // --- LÓGICA DE PRE-WARMING DEL SERVIDOR ---
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const wakeUpRender = async () => {
      // Configuramos un umbral: si el servidor no responde en 1.5s, asumimos que está dormido
      timeoutId = setTimeout(() => {
        if (isMounted) {
          toast.loading(
            'Iniciando servidor (puede demorar ~1 minuto). Por favor, espere...',
            {
              id: 'server-wakeup',
              duration: Infinity, // Evita que el toast desaparezca solo
              style: {
                backgroundColor: '#fef3c7', // Un fondo amber-100 suave
                color: '#78350f',           // Texto amber-900 para alto contraste
                border: '1px solid #fde68a', // Borde amber-200 sutil
              }
            }
          );
        }
      }, 1500);

      const startTime = Date.now();

      // Disparamos el estímulo hacia el backend
      await api.pingServer();

      const duration = Date.now() - startTime;

      // Si respondió rápido, cancelamos el temporizador para que no aparezca el toast
      clearTimeout(timeoutId);

      if (isMounted) {
        if (duration > 1500) {
          // 1. Eliminamos por completo el toast de carga y sus estilos ámbar/oscuros
          toast.dismiss('server-wakeup');

          // 2. Creamos un nuevo toast independiente que será verde nativo
          toast.success('¡Servidor operativo y listo!', {
            duration: 10000
          });
        } else {
          // Si el servidor ya estaba despierto, simplemente limpiamos por las dudas
          toast.dismiss('server-wakeup');
        }
      }
    };

    wakeUpRender();

    // Cleanup function para evitar fugas de memoria si el usuario navega rápido a otra página
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);
  // --- FIN LÓGICA DE PRE-WARMING ---

  const onSubmit = async (data: LoginFormData) => {
    setCuentaBloqueada(false);

    try {
      await login(data);
      toast.success('Bienvenido al sistema');
    } catch (error) {
      const esSinConexion = error instanceof Error && error.message === 'Failed to fetch';
      const esCuentaBloqueada = error instanceof ApiError && error.status === 403;

      if (esCuentaBloqueada) {
        // el AuthController ya generó el código y disparó el correo vía Resend
        setCuentaBloqueada(true);
        setUsernameBloqueado(data.username);
        toast.error('Cuenta bloqueada por seguridad', {
          description: 'Revisá tu correo electrónico para obtener el código de desbloqueo.',
        });

        // Limpiamos solo la contraseña; el username se mantiene para reintentar tras desbloquear.
        reset({ username: data.username, password: '' });
        return;
      }

      toast.error(esSinConexion ? 'Sin conexión con el servidor' : 'Credenciales inválidas', {
        description: obtenerMensajeError(error),
      });

      if (!esSinConexion) {
        // Marcar campos con error para que se pongan rojos
        setError('username', { type: 'manual' });
        setError('password', { type: 'manual' });

        // Limpiar los campos (puedes elegir limpiar ambos o solo la contraseña)
        reset({ username: '', password: '' }, { keepErrors: true });
      }
      // Devolver el foco al campo de usuario (como en tu versión original)
      // setTimeout(() => setFocus('username'), 100);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Formulario de inicio de sesión" noValidate>
      {cuentaBloqueada && (
        <Alert variant="destructive" role="alert">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Cuenta bloqueada por seguridad</AlertTitle>
          <AlertDescription>
            <p>
              Se alcanzó el límite de intentos fallidos. Revisá tu bandeja de
              entrada: te enviamos un código de seguridad para restaurar el acceso.
            </p>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-destructive font-semibold underline"
              onClick={() => setModalDesbloqueoAbierto(true)}
            >
              Ingresar código de desbloqueo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="username" className="text-foreground/80">
          Usuario
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            id="username"
            type="text"
            placeholder="Ingrese su usuario"
            autoComplete="username"
            aria-required="true"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? "username-error" : undefined}
            className={cn(
              "pl-10 h-12 bg-muted/50 border-0 focus-visible:ring-2",
              errors.username ? "ring-2 ring-destructive" : "focus-visible:ring-primary"
            )}
            {...register('username')}
            disabled={isSubmitting}
          />
        </div>
        {errors.username && (
          <p id="username-error" role="alert" className="text-sm text-destructive font-medium">
            {errors.username.message || 'El usuario es requerido'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground/80">
          Contraseña
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ingrese su contraseña"
            autoComplete="current-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn(
              "pl-10 pr-10 h-12 bg-muted/50 border-0 focus-visible:ring-2",
              errors.password ? "ring-2 ring-destructive" : "focus-visible:ring-primary"
            )}
            {...register('password')}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:rounded"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
          >
            {showPassword
              ? <EyeOff className="h-5 w-5" aria-hidden="true" />
              : <Eye className="h-5 w-5" aria-hidden="true" />
            }
          </button>
        </div>
        {errors.password && (
          <p id="password-error" role="alert" className="text-sm text-destructive font-medium">
            {errors.password.message || 'La contraseña es requerida'}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-[#1b4332] to-[#2d6a4f] hover:from-[#2d6a4f] hover:to-[#40916c] transition-all duration-300"
        disabled={isSubmitting || !camposCompletos}
        aria-disabled={isSubmitting || !camposCompletos}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Autenticando...</span>
          </>
        ) : (
          'INGRESAR AL SISTEMA'
        )}
      </Button>
      </form>

      <UnlockAccountDialog
        open={modalDesbloqueoAbierto}
        onOpenChange={setModalDesbloqueoAbierto}
        username={usernameBloqueado}
        onDesbloqueada={() => {
          setCuentaBloqueada(false);
          setFocus('password');
        }}
      />
    </>
  );
}