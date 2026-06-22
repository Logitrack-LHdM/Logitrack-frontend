'use client';

import { useState } from 'react';
import { ShieldAlert, UserX, Pencil } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { UsuarioResponseDTO } from '@/types';
import { Badge } from '@/components/ui/badge'; // Asumo que tienes el componente Badge de shadcn

interface UsuarioTableProps {
    usuarios: UsuarioResponseDTO[];
    onDesactivar: (id: number) => Promise<void>;
    onEditar: (usuario: UsuarioResponseDTO) => void; // Para abrir el Sheet/Modal de edición en el futuro
}

// Helper para colores de roles
const getRolColor = (rol: string) => {
    switch (rol) {
        // case 'ROLE_ADMIN':
        case 'ROLE_ADMINISTRADOR':
            return 'bg-purple-100 text-purple-700 hover:bg-purple-100';
        case 'ROLE_SUPERVISOR':
            return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
        case 'ROLE_OPERADOR':
            return 'bg-teal-100 text-teal-700 hover:bg-teal-100';
        case 'ROLE_CHOFER':
            return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
        default:
            return 'bg-background text-gray-700 hover:bg-background';
    }
};

// Helper para normalizar el nombre del rol (quitar "ROLE_")
const formatRol = (rol: string) => rol.replace('ROLE_', '').toLowerCase();

export function UsuarioTable({ usuarios, onDesactivar, onEditar }: UsuarioTableProps) {
    const [desactivando, setDesactivando] = useState(false);
    const [usuarioADesactivar, setUsuarioADesactivar] = useState<UsuarioResponseDTO | null>(null);

    const handleConfirmarDesactivacion = async () => {
        if (!usuarioADesactivar) return;
        setDesactivando(true);
        try {
            await onDesactivar(usuarioADesactivar.idUsuario);
            toast.success(`Usuario ${usuarioADesactivar.username} desactivado correctamente`);
        } catch {
            toast.error('Error al desactivar el usuario', {
                description: 'Intentá nuevamente o verificá los permisos.',
            });
        } finally {
            setDesactivando(false);
            setUsuarioADesactivar(null);
        }
    };

    return (
        <>
            {/* Vista Desktop */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="py-4 pl-6 font-semibold">Usuario</TableHead>
                            <TableHead className="py-4 font-semibold">Datos Personales</TableHead>
                            <TableHead className="py-4 font-semibold">Rol</TableHead>
                            <TableHead className="py-4 font-semibold">Estado</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-semibold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuarios.map((usuario) => (
                            <TableRow key={usuario.idUsuario} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="pl-6">
                                    <span className="font-bold text-[#2d6a4f] block">{usuario.username}</span>
                                    <span className="text-xs text-muted-foreground">{usuario.telefono}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-foreground block">{usuario.nombre} {usuario.apellido}</span>
                                    <span className="text-xs text-muted-foreground">CUIL: {usuario.cuil}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={`capitalize ${getRolColor(usuario.rol)}`}>
                                        {formatRol(usuario.rol)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={usuario.activo ? 'default' : 'destructive'} className={usuario.activo ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <TooltipProvider>
                                        <div className="flex items-center justify-end gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-amber-600 border-amber-400/40 hover:bg-amber-50 shadow-sm"
                                                        onClick={() => onEditar(usuario)}
                                                        aria-label={`Editar usuario ${usuario.username}`}
                                                    >
                                                        <Pencil className="h-4 w-4" aria-hidden="true" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Editar usuario</TooltipContent>
                                            </Tooltip>

                                            {usuario.activo && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-500 border-red-300/40 hover:bg-red-50 shadow-sm"
                                                            onClick={() => setUsuarioADesactivar(usuario)}
                                                            aria-label={`Desactivar acceso de ${usuario.username}`}
                                                        >
                                                            <UserX className="h-4 w-4" aria-hidden="true" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Desactivar acceso</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TooltipProvider>
                                </TableCell>
                            </TableRow>
                        ))}
                        {usuarios.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Vista Mobile (Tarjetas) */}
            <div className="md:hidden p-4 space-y-4">
                {usuarios.map((usuario) => (
                    <div key={usuario.idUsuario} className="bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b pb-2">
                            <div>
                                <span className="font-bold text-[#2d6a4f] block">{usuario.username}</span>
                                <span className="text-xs text-muted-foreground">{usuario.nombre} {usuario.apellido}</span>
                            </div>
                            <Badge variant={usuario.activo ? 'default' : 'destructive'} className={usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {usuario.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>

                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Rol</span>
                            <Badge variant="secondary" className={`capitalize ${getRolColor(usuario.rol)}`}>
                                {formatRol(usuario.rol)}
                            </Badge>
                        </div>

                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Contacto</span>
                            <div className="text-right">
                                <span className="text-sm font-medium block">{usuario.telefono}</span>
                                <span className="text-xs text-muted-foreground">CUIL: {usuario.cuil}</span>
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full text-amber-600 border-amber-400/40 hover:bg-amber-50"
                                onClick={() => onEditar(usuario)}
                            >
                                <Pencil className="h-4 w-4 mr-2" /> Editar Usuario
                            </Button>

                            {usuario.activo && (
                                <Button
                                    variant="outline"
                                    className="w-full text-red-500 border-red-300/40 hover:bg-red-50"
                                    onClick={() => setUsuarioADesactivar(usuario)}
                                >
                                    <UserX className="h-4 w-4 mr-2" /> Desactivar Acceso
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
                {usuarios.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground border rounded-xl">
                        No se encontraron usuarios.
                    </div>
                )}
            </div>

            {/* Modal de Confirmación de Desactivación */}
            <AlertDialog open={!!usuarioADesactivar} onOpenChange={(open) => !open && setUsuarioADesactivar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Desactivar usuario: {usuarioADesactivar?.username}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción revocará el acceso al sistema para este usuario de forma inmediata.
                            El registro se mantendrá en la base de datos (borrado lógico), pero no podrá iniciar sesión.
                            ¿Estás seguro de continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={desactivando}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmarDesactivacion}
                            disabled={desactivando}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {desactivando ? 'Desactivando...' : 'Sí, desactivar acceso'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}