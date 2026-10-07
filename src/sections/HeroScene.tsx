import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { projects } from '../data/site'
import { easeOut } from '../lib/motion'
import { BrowserFrame, PhoneFrame } from '../components/mockups/Frames'
import { SiteDesktop, SiteMobile } from '../components/mockups/SiteMock'
import { Icon } from '../components/ui/Icon'
import { useFinePointer, useMediaQuery, useReducedMotionPref } from '../hooks/useMediaQuery'

const main = projects[0]
const back = projects[2]

/**
 * Escena 3D en CSS: una web real (desktop + móvil) flotando en profundidad.
 * DOM real en vez de WebGL: nítida a cualquier resolución, accesible y sin coste de carga.
 * Ratón → rotación con muelle; cada capa tiene su translateZ, así que el parallax sale solo.
 */
export function HeroScene() {
  const fine = useFinePointer()
  const reduced = useReducedMotionPref()
  const interactive = fine && !reduced
  const small = useMediaQuery('(max-width: 639px)')
  const ref = useRef<HTMLDivElement>(null)

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 60, damping: 18, mass: 0.8 })
  const sy = useSpring(py, { stiffness: 60, damping: 18, mass: 0.8 })

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scrollTilt = useSpring(scrollYProgress, { stiffness: 80, damping: 24 })

  const rootTransform = useTransform(() => {
    const s = reduced ? 0 : scrollTilt.get()
    const ry = (small ? -7 : -16) + sx.get() * 9 + s * 10
    const rx = 8 - sy.get() * 7 + s * 6
    return `translate3d(0, ${s * -60}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`
  })
  const sheenX = useTransform(() => `${50 + sx.get() * 40}%`)
  const sheenY = useTransform(() => `${30 + sy.get() * 30}%`)
  const glow = useTransform(() => `translate3d(${sx.get() * -30}px, ${sy.get() * -20}px, 0)`)

  useEffect(() => {
    if (!interactive) return
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [interactive, px, py])

  return (
    <div ref={ref} className="relative aspect-[1/0.92] w-full [perspective:2600px] sm:[perspective:1800px] sm:aspect-[1/0.8] lg:aspect-[1/0.95]">
      {/* Luz ambiental detrás de la escena */}
      <motion.div aria-hidden="true" className="absolute inset-[-10%] -z-10" style={{ transform: glow }}>
        <div className="absolute top-[18%] left-[20%] h-[60%] w-[70%] rounded-full bg-[radial-gradient(closest-side,rgb(58_63_242/0.28),transparent)]" />
        <div className="absolute top-[42%] left-[48%] h-[48%] w-[50%] rounded-full bg-[radial-gradient(closest-side,rgb(255_201_168/0.55),transparent)]" />
      </motion.div>

      <motion.div
        className="preserve-3d absolute inset-0"
        initial={reduced ? { opacity: 0 } : { opacity: 0, transform: 'translate3d(0, 60px, 0) rotateX(24deg) rotateY(-24deg)' }}
        animate={{ opacity: 1, transform: 'translate3d(0, 0px, 0) rotateX(0deg) rotateY(0deg)' }}
        transition={{ duration: 1.6, ease: easeOut, delay: 0.35 }}
      >
        <motion.div className="preserve-3d absolute inset-0" style={{ transform: rootTransform }}>
          {/* Capa trasera: otra web, más lejos */}
          <div
            className="absolute top-[0%] left-[30%] w-[66%] opacity-60"
            style={{ transform: 'translateZ(-180px)' }}
            aria-hidden="true"
          >
            <BrowserFrame url="clinicalur.es" className="shadow-[var(--shadow-float)]">
              <SiteDesktop p={back} />
            </BrowserFrame>
          </div>

          {/* Capa principal: web de escritorio */}
          <div className="absolute top-[16%] left-[2%] w-[84%]" style={{ transform: 'translateZ(0px)' }}>
            <div className="relative">
              <BrowserFrame url="brasaysal.com" className="shadow-[0_2px_4px_rgb(13_14_18/0.08),0_30px_60px_-20px_rgb(13_14_18/0.35),0_80px_120px_-40px_rgb(42_46_196/0.3)]">
                <SiteDesktop p={main} />
              </BrowserFrame>
              {/* Reflejo especular que se desplaza con la luz */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[14px] mix-blend-soft-light"
                style={{
                  backgroundImage:
                    'radial-gradient(60% 50% at var(--x) var(--y), rgb(255 255 255 / 0.55), transparent 70%), linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.18) 48%, transparent 56%)',
                  ['--x' as string]: sheenX,
                  ['--y' as string]: sheenY,
                }}
              />
            </div>
          </div>

          {/* Capa frontal: móvil con la misma web */}
          <div className="absolute right-[2%] bottom-[2%] w-[27%] min-w-[96px]" style={{ transform: 'translateZ(120px)' }}>
            <div className="anim-float-b">
              <PhoneFrame className="shadow-[0_2px_4px_rgb(13_14_18/0.2),0_40px_70px_-20px_rgb(13_14_18/0.55)]">
                <SiteMobile p={main} />
              </PhoneFrame>
            </div>
          </div>

          {/* Notificación: una visita que se convierte en reserva */}
          <div className="absolute top-[4%] left-[7%] w-[min(58%,300px)] sm:left-[-6%] sm:w-[min(54%,300px)]" style={{ transform: 'translateZ(170px)' }}>
            <div className="anim-float-a flex items-center gap-3 rounded-2xl bg-white/70 p-2.5 pr-4 shadow-[0_1px_0_rgb(255_255_255/0.8)_inset,0_18px_40px_-14px_rgb(13_14_18/0.35)] ring-1 ring-black/[0.06] backdrop-blur-xl">
              <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-cobalt text-white">
                <span className="anim-ping absolute inset-0 rounded-xl bg-cobalt" />
                <Icon name="check" size={18} strokeWidth={2.2} className="relative" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[clamp(11px,1.6vw,13.5px)] font-semibold text-ink">Nueva reserva</span>
                <span className="block truncate text-[clamp(10px,1.4vw,12px)] text-mute">Mesa para 4 · hoy 21:30</span>
              </span>
            </div>
          </div>

          {/* Chip de Google */}
          <div className="absolute bottom-[12%] left-[6%] hidden sm:block" style={{ transform: 'translateZ(90px)' }}>
            <div className="anim-float-b flex items-center gap-2.5 rounded-full bg-white/75 py-2 pr-4 pl-2 shadow-[0_14px_34px_-14px_rgb(13_14_18/0.35)] ring-1 ring-black/[0.06] backdrop-blur-xl">
              <span className="flex size-7 items-center justify-center rounded-full bg-ink text-paper">
                <Icon name="search" size={14} />
              </span>
              <span className="text-[13px] leading-tight text-ink">
                <span className="font-semibold">1.º en Google</span>
                <span className="text-mute"> · "asador cerca de mí"</span>
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
