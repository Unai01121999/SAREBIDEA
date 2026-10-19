import { useEffect, useState } from 'react'
import { lenisInstance } from '../../hooks/useLenis'
import { Icon } from './Icon'

/** Botón fijo abajo a la derecha que lleva al inicio de la página; aparece al bajar un poco. */
export function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTop = () => {
    if (lenisInstance) lenisInstance.scrollTo(0, { duration: 1.2 })
    else window.scrollTo({ top: 0, behavior: 'auto' })
    // El foco vuelve al inicio del documento para quien navega con teclado o lector de pantalla.
    ;(document.getElementById('top') as HTMLElement | null)?.focus({ preventScroll: true })
  }

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Volver arriba"
      title="Volver arriba"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] flex size-12 items-center justify-center rounded-[10px] bg-ink text-paper shadow-[0_10px_30px_-10px_rgb(11_12_17/0.55)] ring-1 ring-white/10 transition-[opacity,transform,background-color] duration-300 ease-[var(--ease-out-strong)] hover:bg-cobalt hover:text-ink active:scale-95 sm:right-6 sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))] ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <Icon name="arrowUp" size={22} strokeWidth={2} />
    </button>
  )
}
