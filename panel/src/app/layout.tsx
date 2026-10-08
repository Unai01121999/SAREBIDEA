import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'SAREBIDEA · Panel', template: '%s · SAREBIDEA Panel' },
  description: 'Panel de administración privado: clientes, webs, dominios, hosting, facturación y tareas.',
  robots: { index: false, follow: false },
}
export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#fafafa' }, { media: '(prefers-color-scheme: dark)', color: '#09090b' }] }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={GeistSans.variable}>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
