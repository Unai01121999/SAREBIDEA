import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografías alojadas en el propio sitio (sin pedir nada a Google antes de que la persona elija sobre cookies)
import '@fontsource/funnel-display/latin-400.css'
import '@fontsource/funnel-display/latin-500.css'
import '@fontsource/funnel-display/latin-600.css'
import '@fontsource/funnel-display/latin-700.css'
import '@fontsource/geist/latin-400.css'
import '@fontsource/geist/latin-500.css'
import '@fontsource/geist/latin-600.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-800.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
