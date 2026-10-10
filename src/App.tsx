import { AnimatePresence, domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { useLegalRoute } from './hooks/useLegalRoute'
// El texto legal es largo y solo se necesita al abrir una de sus páginas: se descarga entonces.
const LegalPage = lazy(() => import('./components/legal/LegalPage').then((m) => ({ default: m.LegalPage })))
import { CookieBanner } from './components/legal/CookieBanner'
import { useLenis } from './hooks/useLenis'
import { useReducedMotionPref } from './hooks/useMediaQuery'
import { Navbar } from './sections/Navbar'
import { Hero } from './sections/Hero'
import { Problem } from './sections/Problem'
import { Services } from './sections/Services'
import { Process } from './sections/Process'
import { Packs } from './sections/Packs'
import { Showcase } from './sections/Showcase'
import { About } from './sections/About'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'

/** El botón «Área privada» lleva al panel de administración (publicado en /panel junto a la web). */
const goToPanel = () => {
  window.location.assign('/panel/')
}

// Enlaces antiguos a #area-privada también llevan al panel (al cargar y si cambia solo el hash).
const redirectLegacy = () => {
  if (window.location.hash === '#area-privada') window.location.replace('/panel/')
}
if (typeof window !== 'undefined') redirectLegacy()

export default function App() {
  const reduced = useReducedMotionPref()
  useLenis(!reduced)
  useEffect(() => {
    window.addEventListener('hashchange', redirectLegacy)
    return () => window.removeEventListener('hashchange', redirectLegacy)
  }, [])
  const legalRoute = useLegalRoute()

  return (
    <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only rounded-full bg-ink px-4 py-2 text-sm text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Saltar al contenido
      </a>
      <Navbar onPrivate={goToPanel} />
      <main id="main">
        <Hero />
        <Problem />
        <Services />
        <Process />
        <Packs />
        <Showcase />
        <About />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <AnimatePresence>{legalRoute.page && <LegalPage key={legalRoute.page} page={legalRoute.page} onClose={legalRoute.hide} />}</AnimatePresence>
      </Suspense>
      <CookieBanner />
    </MotionConfig>
    </LazyMotion>
  )
}
