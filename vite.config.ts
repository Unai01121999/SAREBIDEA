import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `SINGLE=1 npm run build` genera un único index.html autocontenido (vista previa).
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  // React y las animaciones van en archivos aparte: casi nunca cambian, así que el navegador los reutiliza
  // de su caché tras cada actualización de la web y solo descarga el código propio, que es pequeño.
  build: process.env.SINGLE
    ? {}
    : {
        rolldownOptions: {
          output: {
            advancedChunks: {
              groups: [
                { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
                { name: 'motion', test: /node_modules[\\/](motion|motion-dom|motion-utils|framer-motion|lenis)[\\/]/ },
              ],
            },
          },
        },
      },
})
