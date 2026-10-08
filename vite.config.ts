import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `SINGLE=1 npm run build` genera un único index.html autocontenido (vista previa).
export default defineConfig({
  // Solo la vista previa de diseño (VITE_DEMO=1) incluye datos de ejemplo; en producción esa rama se elimina.
  define: { __DEMO__: JSON.stringify(!!process.env.VITE_DEMO) },
  plugins: [react(), tailwindcss(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
})
