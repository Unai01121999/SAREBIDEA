import { m, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef } from 'react'
import { steps } from '../data/site'
import { Button } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

export function Process() {
  const list = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 70%', 'end 60%'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const line = useTransform(progress, (v) => `scaleY(${v})`)

  return (
    <section id="como-funciona" className="on-dark relative bg-tone-process text-paper section-y" aria-labelledby="process-title">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <TextReveal id="process-title" as="h2" text="Tú a lo tuyo. Nosotros, a lo demás." className="h-section max-w-[560px]" accent={[4, 5]} />
          <Reveal delay={0.15}>
            <p className="lede mt-6 max-w-[30rem]">
              Tres pasos y ninguna complicación técnica. Tu única tarea es contarnos qué hace especial a tu negocio.
            </p>
          </Reveal>
          <Reveal delay={0.25} className="mt-10 hidden lg:block">
            <Button href="#contacto">Empezar ahora</Button>
          </Reveal>
        </div>

        <ol ref={list} className="relative">
          {/* Línea de progreso ligada al scroll */}
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[27px] w-px bg-white/15 sm:left-[35px]" />
          <m.span
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[27px] w-px origin-top bg-lilac sm:left-[35px]"
            style={{ transform: line }}
          />
          {steps.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.05} className="relative grid grid-cols-[56px_1fr] gap-5 pb-14 last:pb-0 sm:grid-cols-[72px_1fr] sm:gap-8 sm:pb-20">
              <span className="relative z-10 flex size-14 items-center justify-center rounded-[10px] bg-night-2 font-head text-[1.75rem] text-paper ring-1 ring-white/20 tabular sm:size-[72px] sm:text-[2.125rem]">
                {s.n}
              </span>
              <div className="pt-2 sm:pt-4">
                <h3 className="font-head text-[clamp(2rem,1.5rem+1.8vw,3rem)] leading-[1.02]">{s.title}</h3>
                <p className="mt-3 max-w-[32rem] text-[1.02rem] leading-relaxed text-white/65">{s.body}</p>
                <span className="mt-5 inline-flex items-center gap-2 rounded-[6px] bg-white/[0.07] px-3 py-1.5 text-[0.88rem] font-medium text-paper ring-1 ring-white/15">
                  <span className="size-1.5 rounded-[2px] bg-lilac" />
                  {s.you}
                </span>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal className="lg:hidden">
          <Button href="#contacto" size="lg" className="w-full sm:w-auto">
            Empezar ahora
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
