import { m, useMotionValue, useSpring, useTransform } from 'motion/react'
import { lazy, Suspense, useState, type PointerEvent } from 'react'
import { projects, type Project } from '../data/site'
import { BrowserFrame, PhoneFrame } from '../components/mockups/Frames'
import { SiteDesktop, SiteMobile } from '../components/mockups/SiteMock'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'
import { useFinePointer, useMediaQuery, useReducedMotionPref } from '../hooks/useMediaQuery'

const PreviewModal = lazy(() => import('../components/ui/PreviewModal'))

const slug = (p: Project) => p.business.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '.es'

/** Enlace del ejemplo: con vista previa abre la web de ejemplo en una ventana; sin ella lleva al formulario. */
function ProjectLink({ p, onPreview, className, children }: { p: Project; onPreview?: (p: Project) => void; className: string; children: React.ReactNode }) {
  if (p.preview && onPreview)
    return (
      <button type="button" onClick={() => onPreview(p)} aria-haspopup="dialog" className={`cursor-pointer ${className}`} aria-label={`${p.business}, ${p.sector}. Ver la web de ejemplo`}>
        {children}
      </button>
    )
  return (
    <a href="#contacto" className={className} aria-label={`${p.business}, ${p.sector}. Quiero una web así`}>
      {children}
    </a>
  )
}

/** Mockup con tilt 3D: se inclina hacia el cursor, se eleva y revela la ficha del proyecto. */
function TiltProject({ p, className = '', big = false, onPreview }: { p: Project; className?: string; big?: boolean; onPreview?: (p: Project) => void }) {
  const fine = useFinePointer()
  const reduced = useReducedMotionPref()
  const on = fine && !reduced
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const lift = useMotionValue(0)
  const sRx = useSpring(rx, { stiffness: 160, damping: 18 })
  const sRy = useSpring(ry, { stiffness: 160, damping: 18 })
  const sLift = useSpring(lift, { stiffness: 160, damping: 20 })
  const transform = useTransform(
    () => `perspective(1400px) rotateX(${sRx.get()}deg) rotateY(${sRy.get()}deg) translate3d(0, ${sLift.get() * -10}px, ${sLift.get() * 30}px)`,
  )
  const shadow = useTransform(
    () => `0 ${10 + sLift.get() * 30}px ${30 + sLift.get() * 40}px -${12 + sLift.get() * 6}px rgb(13 14 18 / ${0.18 + sLift.get() * 0.14})`,
  )

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!on) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    ry.set(x * 10)
    rx.set(-y * 8)
    lift.set(1)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
    lift.set(0)
  }

  return (
    <article className={`group ${className}`} onPointerMove={onMove} onPointerLeave={reset}>
      <ProjectLink p={p} onPreview={onPreview} className="block w-full rounded-[16px] text-left">
        <m.div className="relative" style={on ? { transform, boxShadow: shadow, borderRadius: 14 } : { borderRadius: 14 }}>
          <BrowserFrame url={slug(p)} className="shadow-[var(--shadow-soft)]">
            <SiteDesktop p={p} live />
          </BrowserFrame>
          {/* Ficha que aparece en hover */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-between gap-3 rounded-[10px] bg-white/85 p-2 pl-4 opacity-0 shadow-[0_12px_30px_-10px_rgb(13_14_18/0.35)] ring-1 ring-black/5 backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[var(--ease-out-strong)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <span className="min-w-0 text-[13px] leading-tight">
              <span className="block font-semibold text-ink">{p.result}</span>
              <span className="block truncate text-mute">{p.preview ? 'Web de ejemplo navegable' : 'Incluido en esta propuesta'}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 rounded-[8px] bg-cobalt px-3.5 py-2 text-[13px] font-medium text-paper">
              {p.preview ? 'Ver la web' : 'Quiero una así'} <Icon name="arrowUpRight" size={14} />
            </span>
          </div>
        </m.div>
      </ProjectLink>
      <div className="mt-4 flex items-baseline justify-between gap-4 px-1">
        <h3 className={`font-head ${big ? 'text-[2.1rem]' : 'text-[1.75rem]'} leading-none`}>{p.business}</h3>
        <span className="eyebrow">{p.sector}</span>
      </div>
    </article>
  )
}

export function Showcase() {
  const [a, b, c, d, g] = projects
  // Solo se pinta una de las dos composiciones (no las dos con una oculta): así el HTML no repite cada proyecto.
  const wide = useMediaQuery('(min-width: 768px)')
  const [preview, setPreview] = useState<Project | null>(null)
  return (
    <section id="ejemplos" className="relative overflow-hidden bg-tone-showcase section-y" aria-labelledby="showcase-title">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <TextReveal id="showcase-title" as="h2" text="Así podría verse tu negocio." className="h-section max-w-[720px]" accent={[4]} />
          <Reveal delay={0.15}>
            <p className="lede max-w-[26rem] lg:ml-auto">
              Cada sector tiene su carácter. Diseñamos para el tuyo, no para "un negocio cualquiera".
            </p>
          </Reveal>
        </div>
      </div>

      {/* Móvil: carrusel de teléfonos, pensado para el pulgar */}
      {!wide && (
      <div className="mt-12">
        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1rem,calc((100vw-260px)/2))] pb-6 [scrollbar-width:none]" aria-label="Ejemplos de webs">
          {projects.map((p) => (
            <li key={p.id} className="w-[min(64vw,250px)] shrink-0 snap-center">
              <ProjectLink p={p} onPreview={setPreview} className="block w-full text-left">
                <PhoneFrame className="shadow-[0_24px_50px_-20px_rgb(13_14_18/0.45)]">
                  <SiteMobile p={p} live />
                </PhoneFrame>
                {p.preview && <span className="mt-3 block text-center text-sm font-medium text-ink underline decoration-ink/30 underline-offset-4">Ver la web →</span>}
              </ProjectLink>
              <div className="mt-4 text-center">
                <h3 className="font-head text-[1.6rem] leading-none">{p.business}</h3>
                <p className="text-sm text-mute">
                  {p.sector} · {p.result}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-center text-sm text-mute" aria-hidden="true">
          Desliza para ver más →
        </p>
      </div>
      )}

      {/* Tablet y escritorio: composición editorial de mockups */}
      {wide && (
      <div className="container-x mt-16 lg:mt-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14 lg:gap-x-8 lg:gap-y-20">
          <Reveal className="col-span-12 lg:col-span-7">
            <TiltProject p={a} big onPreview={setPreview} />
          </Reveal>
          <Reveal delay={0.1} className="col-span-12 md:col-span-6 md:col-start-4 lg:col-span-5 lg:col-start-auto lg:self-end">
            <TiltProject p={b} big onPreview={setPreview} />
          </Reveal>
          <Reveal className="col-span-6 lg:col-span-4">
            <TiltProject p={c} onPreview={setPreview} />
          </Reveal>
          <Reveal delay={0.08} className="col-span-6 lg:col-span-4 lg:translate-y-14">
            <TiltProject p={d} onPreview={setPreview} />
          </Reveal>
          <Reveal delay={0.16} className="col-span-12 md:col-span-6 md:col-start-4 lg:col-span-4 lg:col-start-auto">
            <TiltProject p={g} onPreview={setPreview} />
          </Reveal>
        </div>
        <Reveal className="mt-20 flex flex-col items-center gap-4 text-center lg:mt-32">
          <p className="text-mute">¿Tu sector no está aquí? Lo diseñamos igual de bien.</p>
          <Button href="#contacto">Quiero ver cómo quedaría la mía</Button>
        </Reveal>
      </div>
      )}
      {preview && (
        <Suspense fallback={null}>
          <PreviewModal project={preview} onClose={() => setPreview(null)} />
        </Suspense>
      )}
    </section>
  )
}
