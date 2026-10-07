import { AnimatePresence, MotionConfig } from 'motion/react'
import { usePrivateRoute } from './hooks/usePrivateRoute'
import { PrivateArea } from './private/PrivateArea'
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

export default function App() {
  const reduced = useReducedMotionPref()
  useLenis(!reduced)
  const privateRoute = usePrivateRoute()

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#main"
        className="sr-only rounded-full bg-ink px-4 py-2 text-sm text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Saltar al contenido
      </a>
      <Navbar onPrivate={privateRoute.show} />
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
    </MotionConfig>
  )
}
