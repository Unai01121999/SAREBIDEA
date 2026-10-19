import { m, useReducedMotion } from 'motion/react'
import { easeOut } from '../lib/motion'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { TextReveal } from '../components/ui/TextReveal'
import { HeroScene } from './HeroScene'

const sectors = ['Restaurantes', 'Peluquerías', 'Clínicas', 'Gimnasios', 'Talleres', 'Tiendas', 'Asesorías', 'Fisioterapia', 'Estética', 'Panaderías']

export function Hero() {
  const reduced = useReducedMotion()
  const fade = (delay: number) => ({
    initial: { opacity: 0, transform: reduced ? 'none' : 'translate3d(0,16px,0)' },
    animate: { opacity: 1, transform: 'translate3d(0,0,0)' },
    transition: { duration: 0.9, ease: easeOut, delay },
  })

  return (
    <section id="top" tabIndex={-1} className="focus:outline-none grain relative isolate overflow-hidden bg-tone-hero pt-28 pb-10 sm:pt-32 lg:pt-36">
      {/* Fondo: luz suave + retícula que se desvanece */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_20%,#dff0ff_0%,transparent_65%),radial-gradient(50%_40%_at_0%_100%,#eef0f6_0%,transparent_70%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgb(11_12_17/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(11_12_17/0.045)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(70%_60%_at_60%_30%,#000_10%,transparent_75%)]" />
      </div>

      <div className="container-x grid items-center gap-y-10 lg:grid-cols-[1.1fr_1fr] lg:gap-x-12">
        <div className="relative z-10 max-w-[640px]">
          <TextReveal
            as="h1"
            eyebrow="Diseño web para negocios locales"
            immediate
            delay={0.1}
            accent={[5]}
            text="La web que tu negocio necesita."
            className="display text-[clamp(3.25rem,1.2rem+6.2vw,6.5rem)]"
          />
          <m.p {...fade(0.55)} className="lede mt-6 max-w-[34rem] sm:mt-8">
            Creamos páginas web modernas para comercios que quieren atraer más clientes, generar confianza y destacar frente a su competencia.
          </m.p>
          <m.div {...fade(0.7)} className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <Button href="#contacto" size="lg">
              Quiero mi web
            </Button>
            <Button href="#ejemplos" size="lg" variant="ghost" icon={false}>
              Ver ejemplos
            </Button>
          </m.div>
          <m.ul {...fade(0.85)} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[0.92rem] text-ink-2" aria-label="Qué incluye">
            {['Web profesional', 'Optimizada para móvil', 'Lista para vender'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className="flex size-[18px] items-center justify-center rounded-[5px] bg-cobalt text-ink">
                  <Icon name="check" size={12} strokeWidth={2.4} />
                </span>
                {t}
              </li>
            ))}
          </m.ul>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none xl:translate-x-[3%]">
          <HeroScene />
        </div>
      </div>

      {/* Sectores: ¿me sirve a mí? → sí. */}
      <m.div {...fade(1.1)} className="mt-14 border-y border-line py-5 lg:mt-20">
        <div className="container-x flex items-center gap-8">
          <p className="eyebrow hidden shrink-0 md:block">Webs para</p>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="anim-marquee flex w-max gap-10">
              {[...sectors, ...sectors].map((s, i) => (
                <span key={i} aria-hidden={i >= sectors.length} className="font-head text-[1.75rem] whitespace-nowrap text-ink/70">
                  {s}
                  <span className="ml-10 text-ink/20">/</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </m.div>
    </section>
  )
}
