import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import 'leaflet/dist/leaflet.css';
import './globals.css'
import { NavigationLoader } from '@/components/layout/navigation-loader'
import { ServiceWorkerRegister } from '@/components/layout/service-worker-register'
import { ThemeProvider } from "@/components/theme-provider";

// 1. Configuramos las fuentes con variables CSS para Tailwind
const geist = Geist({
  subsets: ["latin"], variable: '--font-geist'
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono'
});

// 2. Metadata robusta para SEO y Open Graph
export const metadata: Metadata = {
  title: {
    template: '%s | LogiTrack Agro',
    default: 'LogiTrack Agro',
  },
  description: 'Sistema integral de gestión, envíos y trazabilidad logística para el sector agropecuario.',
  applicationName: 'LogiTrack Agro',
  generator: 'Next.js',
  manifest: '/manifest.json', // Vinculación del manifest
  appleWebApp: { // Configuración nativa para dispositivos iOS
    capable: true,
    title: 'Logitrack',
    statusBarStyle: 'default',
  },
  formatDetection: { // Evita que iOS convierta números y fechas aleatorias en links
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'LogiTrack Agro',
    description: 'Sistema integral de gestión logística.',
    url: 'https://logitrackagro.vercel.app',
    siteName: 'LogiTrack Agro',
    locale: 'es_AR',
    type: 'website',
  },
}

// 3. Viewport separado (Requisito de Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Crucial para PWA. Evita que la pantalla haga zoom cuando el chofer toca un input, dándole sensación de app nativa.
  // Integramos tu color institucional (#1b4332)
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1b4332' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 4. Inyectamos las variables de las fuentes en el <html>
    <html lang="es" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      {/* Añadimos 'overscroll-y-none' para bloquear el pull-to-refresh nativo */}
      <body className="font-sans antialiased min-h-screen overscroll-y-none">
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} >
    <a href="#main-content" className="skip-to-content">
      Saltar al contenido principal
    </a>
    <AuthProvider>
          {/* Este es el motor de arranque de nuestro Service Worker manual */}
          <ServiceWorkerRegister /> {/* Registra la PWA globalmente */}
          <NavigationLoader />
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}