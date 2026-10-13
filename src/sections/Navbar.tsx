import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useState } from 'react'
import { nav } from '../data/site'
import { easeOut } from '../lib/motion'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'

export function Navbar({ onPrivate }: { onPrivate: () => void }) {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  // Dinámica: aparece el cristal al bajar; se esconde al bajar rápido y vuelve al subir.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    setHidden(y > 640 && y > prev + 4)
    if (y < prev - 4) setHidden(false)
  })

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-out-strong)] ${hidden && !open ? '-translate-y-full' : 'translate-y-0'} ${
          scrolled || open ? 'border-b border-line bg-paper/80 backdrop-blur-xl backdrop-saturate-150' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="container-x">
          <nav aria-label="Principal" className="flex h-16 items-center justify-between md:h-[72px]">
            <a href="#top" aria-label="SAREBIDEA, volver al inicio" className="rounded-[6px]">
              <Logo />
            </a>
            <ul className="hidden items-center gap-1 lg:flex">
              {nav.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="group relative px-3.5 py-2 text-[0.94rem] text-ink-2 transition-colors duration-200 hover:text-ink"
                  >
                    {l.label}
                    <span aria-hidden="true" className="absolute inset-x-3.5 bottom-0.5 h-px origin-left scale-x-0 bg-cobalt transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrivate}
                className="hidden h-11 items-center gap-2 rounded-[10px] px-4 text-[0.94rem] text-ink-2 ring-1 ring-ink/15 transition-colors duration-200 hover:bg-ink hover:text-paper hover:ring-ink sm:inline-flex"
              >
                <Icon name="lock" size={16} />
                Área privada
              </button>
              <span className="hidden sm:block">
                <Button href="#contacto">Crear mi web</Button>
              </span>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-[10px] bg-ink text-paper transition-transform duration-150 active:scale-[0.94] lg:hidden"
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setOpen((o) => !o)}
              >
                <Icon name={open ? 'close' : 'menu'} size={20} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-paper px-6 pt-24 pb-10 lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <ul className="flex flex-col">
              {nav.map((l, i) => (
                <m.li
                  key={l.href}
                  initial={{ opacity: 0, transform: 'translate3d(0,24px,0)' }}
                  animate={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                  transition={{ duration: 0.5, ease: easeOut, delay: 0.12 + i * 0.05 }}
                  className="border-b border-line"
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="font-head flex items-center justify-between py-3.5 text-[2.5rem] leading-none"
                  >
                    {l.label}
                    <Icon name="arrowUpRight" size={22} className="text-mute" />
                  </a>
                </m.li>
              ))}
            </ul>
            <m.div
              className="mt-auto flex flex-col gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Button href="#contacto" size="lg" onClick={() => setOpen(false)}>
                Crear mi web
              </Button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onPrivate()
                }}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[10px] text-[1.0625rem] text-ink ring-1 ring-ink/20"
              >
                <Icon name="lock" size={18} />
                Área privada
              </button>
              <p className="text-center text-sm text-mute">Respuesta en menos de 24 h laborables</p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
}
