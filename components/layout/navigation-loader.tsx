'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function LoaderContent() {
    const [isNavigating, setIsNavigating] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 1. Apagar la animación cuando la ruta cambia exitosamente
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setIsNavigating(false), 200);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname, searchParams]);

    // 2. FAILSAFE (Apagado de seguridad)
    // Soluciona el error del chofer: Si Next.js cancela la navegación o 
    // nos redirige a la misma página, destrabamos la pantalla automáticamente.
    useEffect(() => {
        let failsafeTimer: ReturnType<typeof setTimeout>;

        if (isNavigating) {
            // Si después de 4 segundos la ruta no ha cambiado, asumimos que 
            // la navegación fue abortada (ej. por AuthContext) y apagamos el loader.
            failsafeTimer = setTimeout(() => {
                setIsNavigating(false);
            }, 4000);
        }

        return () => {
            if (failsafeTimer) clearTimeout(failsafeTimer);
        };
    }, [isNavigating]);

    // 3. Interceptor Estricto de Clics
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');

            // Ignorar si no es un enlace válido
            if (!target || !target.href) return;

            // Reglas de seguridad para no congelar la UI
            const isInternal = target.href.startsWith(window.location.origin);
            const isNewTab = target.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey;
            const isSamePage = target.href.split('#')[0] === window.location.href.split('#')[0];
            const isDownloadOrProtocol = target.hasAttribute('download') ||
                target.href.startsWith('blob:') ||
                target.href.startsWith('mailto:') ||
                target.href.startsWith('tel:');

            // Solo interceptamos enlaces internos, a otras páginas y que no sean archivos
            if (isInternal && !isNewTab && !isSamePage && !isDownloadOrProtocol) {
                setIsNavigating(true);
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, []);

    if (!isNavigating) return null;

    return (
        <>
            {/* Capa de bloqueo invisible */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    cursor: 'wait',
                }}
            />

            {/* Barra de progreso visual */}
            <div
                role="progressbar"
                aria-label="Navegando..."
                aria-busy="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    zIndex: 9999,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ height: '100%', animation: 'logitrack-progress 1.8s cubic-bezier(0.4,0,0.2,1) infinite' }} />
                <style>{`
                    @keyframes logitrack-progress {
                        0%   { width: 0%;   transform: translateX(-5%); opacity: 1;
                               background: var(--agro-light, #40916c); border-radius: 0 2px 2px 0; }
                        60%  { width: 85%;  transform: translateX(0%);  opacity: 1;
                               background: var(--agro-light, #40916c); border-radius: 0 2px 2px 0; }
                        85%  { width: 95%;  transform: translateX(0%);  opacity: 1;
                               background: var(--agro-light, #40916c); border-radius: 0 2px 2px 0; }
                        100% { width: 100%; transform: translateX(0%);  opacity: 0;
                               background: var(--agro-light, #40916c); border-radius: 0 2px 2px 0; }
                    }
                `}</style>
            </div>
        </>
    );
}

export function NavigationLoader() {
    return (
        <Suspense fallback={null}>
            <LoaderContent />
        </Suspense>
    );
}