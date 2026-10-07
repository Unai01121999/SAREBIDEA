import { motion, useReducedMotion } from 'motion/react'
import { problems } from '../data/site'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

/** Web "antigua" anotada como en una revisión de diseño: el comerciante se reconoce. */
function OldSite() {
  return (
    <div className="relative overflow-hidden rounded-[14px] bg-[#e9e6df] ring-1 ring-black/[0.08] [container-type:inline-size]" aria-hidden="true">
      <div className="flex h-7 items-center gap-1.5 border-b border-black/[0.08] px-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-[7px] rounded-full bg-black/15" />
        ))}
        <span className="mx-auto rounded bg-black/[0.05] px-3 py-0.5 text-[10px] text-black/40">http://www.minegocio.es/index2.html</span>
      </div>
      <div className="p-[4cqw] font-[Times,serif] text-[#333] grayscale-[30%]">
        <div className="flex items-end justify-between border-b-2 border-[#8a2b2b] pb-[1.5cqw]">
          <span className="text-[5cqw] font-bold text-[#8a2b2b] italic">Mi Negocio S.L.</span>
          <span className="text-[1.8cqw] text-[#1a0dab] underline">Inicio | Quienes somos | Contacto</span>
        </div>
        <div className="mt-[3cqw] grid grid-cols-[1fr_2fr] gap-[3cqw]">
          <div className="aspect-[4/3] bg-[repeating-linear-gradient(45deg,#cfcac0,#cfcac0_6px,#d9d5cc_6px,#d9d5cc_12px)]" />
          <div className="text-[1.9cqw] leading-[1.35]">
            <p className="font-bold">¡¡BIENVENIDOS A NUESTRA PAGINA WEB!!</p>
            <p className="mt-[1cqw]">
              Somos una empresa con mas de 20 años de experiencia en el sector ofreciendo los mejores servicios a nuestros clientes con la maxima calidad y profesionalidad...
            </p>
            <p className="mt-[1cqw] text-[#1a0dab] underline">Pinche aquí para mas información</p>
          </div>
        </div>
        <div className="mt-[3cqw] text-center text-[1.6cqw] text-[#777]">Ultima actualización: 14/03/2015 · Visitas: 004213</div>
      </div>
    </div>
  )
}

const pins = [
  { x: '12%', y: '22%' },
  { x: '86%', y: '26%' },
  { x: '62%', y: '52%' },
  { x: '26%', y: '62%' },
  { x: '78%', y: '72%' },
  { x: '44%', y: '90%' },
]

export function Problem() {
  const reduced = useReducedMotion()
  return (
    <section className="relative bg-tone-problem py-24 sm:py-32 lg:py-40" aria-labelledby="problem-title">
      <div className="container-x">
        <div className="max-w-[860px]">
          <TextReveal
            as="h2"
            text="Tu negocio está creciendo. Tu web no debería quedarse atrás."
            className="h-section"
            accent={[6, 7]}
          />
          <Reveal delay={0.2}>
            <p className="lede mt-6 max-w-[38rem]">
              Hoy, antes de entrar por tu puerta, tus clientes te buscan en el móvil. Si lo que encuentran no está a tu altura, se van con otro. Sin avisar.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <Reveal className="relative lg:sticky lg:top-28">
            <div className="relative">
              <OldSite />
              {pins.map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e5484d] text-[12px] font-semibold text-white shadow-[0_6px_16px_-4px_rgb(229_72_77/0.6)] ring-4 ring-paper tabular"
                  style={{ left: p.x, top: p.y }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '0px 0px -20% 0px' }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: 0.3 + i * 0.12 }}
                  aria-hidden="true"
                >
                  {i + 1}
                </motion.span>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-mute">Te suena, ¿verdad?</p>
          </Reveal>

          <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {problems.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.06} className="flex gap-4 border-t border-line py-6">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e5484d]/10 text-[12px] font-semibold text-[#c23237] tabular">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-[1.3rem] font-semibold tracking-[-0.02em]">{p.title}</h3>
                  <p className="mt-1.5 text-[0.98rem] leading-relaxed text-mute">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
