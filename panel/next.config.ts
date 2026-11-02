import type { NextConfig } from 'next'

// El panel se compila como sitio ESTÁTICO y se sirve en su propio subdominio (https://panel.sarebidea.com, Hostinger).
// Un origen propio aísla su sesión de la web pública y de las demos. No necesita servidor Node: los datos vienen de Supabase.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
}

export default config
