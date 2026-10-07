import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
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
        className={`fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[var(--ease-out-strong)] ${hidden && !open ? '-translate-y-full' : 'translate-y-0'}`}
      >
        <div className="container-x pt-3">
          <nav
            aria-label="Principal"
            className={`flex h-14 items-center justify-between rounded-full pr-2 pl-4 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-[var(--ease-out-strong)] md:h-[60px] ${
              scrolled || open
                ? 'bg-paper/70 shadow-[0_1px_0_rgb(255_255_255/0.6)_inset,0_8px_30px_-12px_rgb(13_14_18/0.18)] ring-1 ring-line backdrop-blur-xl backdrop-saturate-150'
                : 'bg-transparent'
            }`}
          >
            <a href="#top" aria-label="SAREBIDEA, volver al inicio" className="rounded-full">
              <Logo />
            </a>
            <ul className="hidden items-center gap-1 lg:flex">
              {nav.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="relative rounded-full px-3.5 py-2 text-[0.94rem] text-ink-2 transition-colors duration-200 hover:bg-ink/[0.05] hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrivate}
                className="hidden h-11 items-center gap-2 rounded-full px-4 text-[0.94rem] text-ink-2 ring-1 ring-line transition-colors duration-200 hover:bg-ink/[0.05] hover:text-ink sm:inline-flex"
              >
                <Icon name="lock" size={16} />
                Área privada
              </button>
              <span className="hidden sm:block">
                <Button href="#contacto">Crear mi web</Button>
              </span>
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-full bg-ink text-paper transition-transform duration-150 active:scale-[0.94] lg:hidden"
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
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-paper/95 px-6 pt-28 pb-10 backdrop-blur-2xl lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0 round 0 0 32px 32px)' }}
            animate={{ clipPath: 'inset(0 0 0% 0 round 0 0 0px 0px)' }}
            exit={{ clipPath: 'inset(0 0 100% 0 round 0 0 32px 32px)' }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <ul className="flex flex-col">
              {nav.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, transform: 'translate3d(0,24px,0)' }}
                  animate={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
                  transition={{ duration: 0.5, ease: easeOut, delay: 0.12 + i * 0.05 }}
                  className="border-b border-line"
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-4 font-display text-[2.1rem] font-semibold tracking-[-0.03em]"
                  >
                    {l.label}
                    <Icon name="arrowUpRight" size={22} className="text-mute" />
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div
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
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full text-[1.0625rem] text-ink ring-1 ring-line"
              >
                <Icon name="lock" size={18} />
                Área privada
              </button>
              <p className="text-center text-sm text-mute">Respuesta en menos de 24 h laborables</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
