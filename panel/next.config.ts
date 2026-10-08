import type { NextConfig } from 'next'

// El panel se compila como sitio ESTÁTICO y se sirve desde /panel (junto a la web pública, p. ej. en Hostinger).
// No necesita servidor Node: los datos vendrán de Supabase desde el navegador cuando se conecte.
const config: NextConfig = {
  output: 'export',
  basePath: '/panel',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
}

export default config
