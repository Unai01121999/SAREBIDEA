import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografías alojadas en el propio sitio (sin pedir nada a Google antes de que la persona elija sobre cookies)
import '@fontsource/funnel-display/latin-400.css'
import '@fontsource/funnel-display/latin-500.css'
import '@fontsource/funnel-display/latin-600.css'
import '@fontsource/geist/latin-400.css'
import '@fontsource/geist/latin-500.css'
import '@fontsource/geist/latin-600.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/montserrat/latin-800.css'
import './index.css'
import { initAnalytics } from './lib/analytics'
import App from './App.tsx'

initAnalytics() // Google Analytics: solo se carga si se acepta la analítica

// El panel vivía antes en sarebidea.com/panel y guardaba aquí su sesión. Ahora está en panel.sarebidea.com:
// se borra cualquier sesión antigua que quede en este navegador para que ningún script de la web pueda leerla.
try {
  for (const k of Object.keys(localStorage)) if (/^sb-.*-auth-token/.test(k)) localStorage.removeItem(k)
} catch {
  /* almacenamiento bloqueado: no hay nada que borrar */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
