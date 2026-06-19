'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Route } from 'next';

interface PageContainerProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export function PageContainer({
  title,
  backHref,
  backLabel = 'Volver',
  children,
  className,
  headerActions,
}: PageContainerProps) {
  return (
    <main id="main-content" className="container mx-auto px-4 py-6" tabIndex={-1}>
      {/* Enlace volver */}
      {backHref && (
        <Link
          href={backHref as string as Route}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          aria-label={`${backLabel} — volver a la página anterior`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      {/* Card principal */}
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <h1 className="text-xl font-semibold">{title}</h1>
          {headerActions}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
