'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner'; // Reutilizamos el spinner de tu layout

export default function AlertasPage() {
    const { permisos, isLoading } = useAuth();
    const router = useRouter();

    // Validación de seguridad y redirección
    useEffect(() => {
        if (!isLoading && permisos && !permisos.gestionarAlertas) {
            router.replace('/menu'); // Si no tiene permiso, lo devolvemos al menú
        }
    }, [isLoading, permisos, router]);

    // Renderizado condicional mientras carga o si no tiene acceso
    if (isLoading || !permisos?.gestionarAlertas) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl mx-auto">
                {/* Encabezado temporal */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                        <AlertTriangle className="h-8 w-8 text-[var(--priority-high)]" />
                        Panel de Alertas para el Supervisor
                    </h1>
                    <p className="text-muted-foreground">
                        Espacio de trabajo para la gestión y resolución de incidencias en ruta.
                    </p>
                </div>

                {/* Marcador de posición (Placeholder) */}
                <Card className="border-dashed border-2">
                    <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-2">
                        <div className="text-lg font-medium text-foreground">
                            Ruta base configurada y protegida con éxito
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Solo los usuarios con el permiso <strong>gestionarAlertas</strong> pueden ver esta pantalla.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}