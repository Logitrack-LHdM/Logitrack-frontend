'use client';

import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Spinner } from '@/components/ui/spinner';
import { NetworkStatus } from '@/components/layout/network-status';

export default function ChoferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated, usuario } = useAuth();

  // Mostrar loading mientras carga la sesion
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Si no esta autenticado, el AuthContext redirigira a login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Solo choferes pueden acceder
  if (usuario?.rol !== 'ROLE_CHOFER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    // <div className="min-h-screen flex flex-col bg-background">
    //   <Header />
    //   <main className="flex-1">{children}</main>
    //   <Footer />
    // </div>
    <>
      {/* Inyectamos el detector de red en la parte más alta */}
      <NetworkStatus />
      <div className="flex flex-col min-h-screen relative">
        {/* El resto de tu estructura actual (Header, etc.) */}
        <Header />
        <main id="main-content" className="flex-1 bg-muted/20" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
