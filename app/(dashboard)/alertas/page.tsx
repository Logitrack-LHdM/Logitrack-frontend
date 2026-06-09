'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AlertTriangle, ArrowLeftCircle, ClipboardX } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { AlertasList } from '@/components/alertas/alertas-list';
import { useAlertas } from '@/hooks/use-alertas';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AlertasPage() {
    const { permisos, isLoading: isLoadingAuth } = useAuth();
    const router = useRouter();

    // 1. Extraemos el estado y las funciones de nuestro custom hook
    const { alertas, isLoading: isLoadingAlertas, error, resolverAlerta } = useAlertas();

    // Validación de seguridad y redirección
    useEffect(() => {
        if (!isLoadingAuth && permisos && !permisos.gestionarAlertas) {
            router.replace('/menu'); // Si no tiene permiso, lo devolvemos al menú
        }
    }, [isLoadingAuth, permisos, router]);

    // 2. Función para manejar el clic en "Marcar como resuelto" en la UI
    const handleResolver = async (idAlerta: number) => {
        const resultado = await resolverAlerta(idAlerta);

        if (resultado.success) {
            toast.success('Incidencia resuelta', {
                description: 'La alerta ha sido actualizada y movida al historial.',
            });
        } else {
            toast.error('Error de actualización', {
                description: resultado.error || 'Ocurrió un problema al intentar resolver la alerta.',
            });
        }
    };

    // 3. Renderizado condicional de seguridad Y de carga de datos
    if (isLoadingAuth || !permisos?.gestionarAlertas || isLoadingAlertas) {
        return (
            <div className="flex min-h-[50vh] flex-col gap-4 items-center justify-center">
                <Spinner className="h-8 w-8 text-[#198754]" />
                {isLoadingAlertas && (
                    <p className="text-muted-foreground text-sm font-medium">
                        Obteniendo incidencias en ruta...
                    </p>
                )}
            </div>
        );
    }

    // 4. Manejo de errores en caso de que falle la petición a la API
    if (error) {
        return (
            <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
                <div className="bg-red-50 rounded-2xl shadow-sm border-0 p-12 text-center">
                    <p className="text-red-600 font-bold mb-0 flex items-center justify-center gap-2">
                        <ClipboardX className="h-5 w-5" /> {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
            {/* Botón Volver */}
            <Link
                href="/menu"
                className="text-[#198754] font-semibold mb-3 md:mb-4 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
            </Link>

            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-6 mt-2 px-2 md:px-0">
                {/* <div className="bg-red-500/10 text-red-600 p-3 rounded-xl border border-red-500/25 shadow-sm shrink-0">
                    <AlertTriangle className="h-7 w-7" />
                </div> */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
                    <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-xl md:text-2xl">
                        Panel de Alertas
                    </h4>
                    <p className="text-muted-foreground text-sm m-0">
                        Gestión y resolución de incidencias urgentes reportadas en ruta.
                    </p>
                </div>
            </div>

            {/* Componente principal de Listado conectado al hook */}
            <AlertasList
                alertas={alertas}
                onResolver={handleResolver}
            />
        </div>
    );
}