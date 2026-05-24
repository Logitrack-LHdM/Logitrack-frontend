'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AlertasPage() {
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
                            Ruta base configurada con éxito
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md">
                            La vista se encuentra accesible en la estructura del proyecto. En los siguientes pasos incorporaremos la lógica de control de acceso y el listado interactivo.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}