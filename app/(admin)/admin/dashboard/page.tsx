'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Users, Truck, Building2, ShieldCheck } from 'lucide-react';
import { Route } from 'next';
import Link from 'next/link';

interface MenuCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function MenuCard({ href, icon, title, description }: MenuCardProps) {
  return (
    <Link href={href as string as Route} className="block group">
      <Card
        className={cn(
          'h-full transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-lg hover:border-primary/50',
          'active:scale-[0.98] active:shadow-md',
          'cursor-pointer'
        )}
      >
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-md group-hover:shadow-lg transition-shadow">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { usuario, permisos } = useAuth();

  // El layout padre ya verifica autenticacion, esto es solo por seguridad
  if (!usuario || !permisos) {
    return null;
  }

  const menuItems = [
    {
      href: '/admin/usuarios',
      // color: 'text-blue-600',
      icon: <Users className="h-8 w-8" />,
      title: 'Gestión de Usuarios',
      description: 'ABM de usuarios, asignación de roles y desactivación.',
    },
    {
      href: '/admin/vehiculos',
      // color: 'text-orange-600',
      icon: <Truck className="h-8 w-8" />,
      title: 'Catálogo de Vehículos',
      description: 'Administración de flota, patentes y capacidades de carga.',
    },
    {
      href: '/admin/entidades',
      // color: 'text-[#2d6a4f]', // Verde Agro
      icon: <Building2 className="h-8 w-8" />,
      title: 'Entidades Maestras',
      description: 'Alta y baja de clientes y establecimientos físicos.',
    },
    {
      href: '/admin/auditoria',
      // color: 'text-purple-600',
      icon: <ShieldCheck className="h-8 w-8" />,
      title: 'Centro de Auditoría',
      description: 'Logs del sistema, trazabilidad de estados y permisos.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Titulo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Panel de configuración del sistema
          </h1>
          <p className="text-muted-foreground">
            Bienvenido, {usuario.username}. Selecciona una opcion para continuar.          </p>
        </div>

        {/* Grid de opciones */}
        <div
          className={cn(
            'grid gap-6',
            menuItems.length === 1 && 'md:grid-cols-1 max-w-md mx-auto',
            menuItems.length === 2 && 'md:grid-cols-2',
            menuItems.length >= 3 && 'md:grid-cols-3'
          )}
        >
          {menuItems.map((item) => (
            <MenuCard
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}