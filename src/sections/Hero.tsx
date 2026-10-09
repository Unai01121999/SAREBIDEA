import { motion, useReducedMotion } from 'motion/react'
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
    <section id="top" className="grain relative isolate overflow-hidden bg-tone-hero pt-28 pb-10 sm:pt-32 lg:pt-36">
      {/* Fondo: luz suave + retícula que se desvanece */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_75%_10%,#efe6d8_0%,transparent_60%),radial-gradient(60%_50%_at_0%_100%,#fbe4d6_0%,transparent_60%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgb(13_14_18/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(13_14_18/0.05)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(70%_60%_at_60%_30%,#000_10%,transparent_75%)]" />
      </div>

      <div className="container-x grid items-center gap-y-10 lg:grid-cols-[1.02fr_1fr] lg:gap-x-8">
        <div className="relative z-10 max-w-[640px]">
          <TextReveal
            as="h1"
            immediate
            delay={0.1}
            accent={[5]}
            text="La web que tu negocio necesita."
            className="display text-[clamp(2.9rem,1.2rem+6.6vw,6rem)]"
          />
          <motion.p {...fade(0.55)} className="lede mt-6 max-w-[34rem] sm:mt-8">
            Creamos páginas web modernas para comercios de Bizkaia y Euskadi que quieren atraer más clientes, generar confianza y destacar frente a su competencia.
          </motion.p>
          <motion.div {...fade(0.7)} className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
            <Button href="#contacto" size="lg">
              Quiero mi web
            </Button>
            <Button href="#ejemplos" size="lg" variant="ghost" icon={false}>
              Ver ejemplos
            </Button>
          </motion.div>
          <motion.ul {...fade(0.85)} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[0.92rem] text-ink-2" aria-label="Qué incluye">
            {['Web profesional', 'Optimizada para móvil', 'Lista para vender'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <span className="flex size-[18px] items-center justify-center rounded-full bg-cobalt/10 text-cobalt">
                  <Icon name="check" size={12} strokeWidth={2.4} />
                </span>
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none lg:translate-x-[4%]">
          <HeroScene />
        </div>
      </div>

      {/* Sectores: ¿me sirve a mí? → sí. */}
      <motion.div {...fade(1.1)} className="mt-14 border-y border-line py-5 lg:mt-20">
        <div className="container-x flex items-center gap-8">
          <p className="hidden shrink-0 text-sm text-mute md:block">Webs para</p>
          <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="anim-marquee flex w-max gap-10">
              {[...sectors, ...sectors].map((s, i) => (
                <span key={i} aria-hidden={i >= sectors.length} className="font-display text-[1.35rem] font-medium tracking-[-0.02em] whitespace-nowrap text-ink/70">
                  {s}
                  <span className="ml-10 text-ink/20">/</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
