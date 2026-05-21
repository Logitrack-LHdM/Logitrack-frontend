'use client';

import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Spinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, usuario } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && usuario?.rol !== 'ROLE_ADMINISTRADOR') {
      router.replace('/menu');
    }
  }, [isLoading, isAuthenticated, usuario, router]);

  if (isLoading || !isAuthenticated || usuario?.rol !== 'ROLE_ADMINISTRADOR') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-[#2d6a4f]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* Aquí a futuro podríamos integrar un Sidebar exclusivo de configuración */}
      <main className="flex-1 bg-slate-50">{children}</main>
      <Footer />
    </div>
  );
}