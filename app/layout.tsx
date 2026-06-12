import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import 'leaflet/dist/leaflet.css';
import './globals.css'
import { NavigationLoader } from '@/components/layout/navigation-loader'

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
    <html lang="es" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          <NavigationLoader /> {/* <-- Se inyecta aquí, disponible en toda la app */}
          {children}
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}