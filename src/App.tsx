import { AnimatePresence, MotionConfig } from 'motion/react'
import { usePrivateRoute } from './hooks/usePrivateRoute'
import { PrivateArea } from './private/PrivateArea'
import { useLegalRoute } from './hooks/useLegalRoute'
import { LegalPage } from './components/legal/LegalPage'
import { CookieBanner } from './components/legal/CookieBanner'
import { useLenis } from './hooks/useLenis'
import { useReducedMotionPref } from './hooks/useMediaQuery'
import { Navbar } from './sections/Navbar'
import { Hero } from './sections/Hero'
import { Problem } from './sections/Problem'
import { Services } from './sections/Services'
import { Process } from './sections/Process'
import { Showcase } from './sections/Showcase'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'

/** El botón «Área privada» lleva al panel de administración (publicado en /panel junto a la web). */
const goToPanel = () => {
  window.location.assign('/panel/')
}

// Enlaces antiguos a #area-privada también llevan al panel.
if (typeof window !== 'undefined' && window.location.hash === '#area-privada') window.location.replace('/panel/')

export default function App() {
  const reduced = useReducedMotionPref()
  useLenis(!reduced)
  const privateRoute = usePrivateRoute()
  const legalRoute = useLegalRoute()

  return (
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
        <Showcase />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <AnimatePresence>{privateRoute.open && <PrivateArea onClose={privateRoute.hide} />}</AnimatePresence>
      <AnimatePresence>{legalRoute.page && <LegalPage key={legalRoute.page} page={legalRoute.page} onClose={legalRoute.hide} />}</AnimatePresence>
      <CookieBanner />
    </MotionConfig>
  )
}
