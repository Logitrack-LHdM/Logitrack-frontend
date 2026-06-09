'use client';

import Link from 'next/link';
import { ArrowLeftCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ClienteForm } from '@/components/clientes/ClienteForm';

export default function NuevoClientePage() {
  const { permisos, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !permisos?.crearCliente) {
      router.replace('/menu');
    }
  }, [permisos, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1b4332]" />
      </div>
    );
  }

  if (!permisos?.crearCliente) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:py-8">
      <Link
        href="/menu"
        className="text-[#198754] font-semibold mb-4 md:mb-6 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <ArrowLeftCircle className="h-5 w-5" /> Volver al Panel
      </Link>

      <ClienteForm />
    </div>
  );
}