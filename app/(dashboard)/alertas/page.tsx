'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { AlertasList } from '@/components/alertas/alertas-list';
import { mockAlertas } from '@/mocks/alertasMock';
import type { AlertaListadoDTO } from '@/types';

export default function AlertasPage() {
    const { permisos, isLoading: isLoadingAuth } = useAuth();
    const router = useRouter();

    // Estado local para manejar los datos simulados visualmente por ahora
    const [alertas, setAlertas] = useState<AlertaListadoDTO[]>(mockAlertas);

    // Validación de seguridad y redirección
    useEffect(() => {
        if (!isLoadingAuth && permisos && !permisos.gestionarAlertas) {
            router.replace('/menu'); // Si no tiene permiso, lo devolvemos al menú
        }
    }, [isLoadingAuth, permisos, router]);

    // Función para manejar el clic en "Marcar como resuelto" en la UI
    const handleResolver = (idAlerta: number) => {
        setAlertas((prevAlertas) =>
            prevAlertas.map((alerta) =>
                alerta.id === idAlerta
                    ? {
                        ...alerta,
                        estado: 'RESUELTA',
                        fechaResolucion: new Date().toISOString() // Marcamos la hora actual
                    }
                    : alerta
            )
        );
    };

    // Renderizado condicional mientras carga o si no tiene acceso
    // Renderizado condicional de seguridad
    if (isLoadingAuth || !permisos?.gestionarAlertas) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8 text-[#198754]" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6 lg:py-8">
            {/* Encabezado adaptado al estilo Logitrack Agro */}
            <div className="flex items-center gap-3 mb-6 mt-2 px-2 md:px-0">
                <div className="bg-red-500/10 text-red-600 p-3 rounded-xl border border-red-500/25 shadow-sm shrink-0">
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

            {/* Componente principal de Listado */}
            <AlertasList
                alertas={alertas}
                onResolver={handleResolver}
            />
        </div>
    );
}