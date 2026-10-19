import { useEffect } from 'react'
import Lenis from 'lenis'

/** Instancia activa del scroll suave (null si está desactivado), para que otros componentes puedan desplazar la página con él. */
export let lenisInstance: Lenis | null = null

/** Scroll suave global. Se desactiva con prefers-reduced-motion. */
export function useLenis(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), anchors: { offset: -80 } })
    lenisInstance = lenis
    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
      if (lenisInstance === lenis) lenisInstance = null
    }
  }, [enabled])
}
