import { m, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { problems } from '../data/site'
import { Icon, type IconName } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

/** Web "antigua" anotada como en una revisión de diseño: el comerciante se reconoce. */
function OldSite() {
  return (
    <div className="relative overflow-hidden rounded-[14px] bg-[#e9e6df] shadow-[var(--shadow-float)] ring-1 ring-black/[0.08] [container-type:inline-size]" aria-hidden="true">
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

/** Qué señala cada chincheta sobre la web antigua (coordenadas en % del recuadro). */
const pins = [
  { x: 41, y: 26 }, // 1 · aspecto: el logotipo anticuado
  { x: 86, y: 18 }, // 2 · móvil: menú diminuto
  { x: 22, y: 55 }, // 3 · confianza: sin fotos reales
  { x: 30, y: 91 }, // 4 · cambiar algo: «Última actualización 2015»
  { x: 62, y: 74 }, // 5 · contacto: «Pinche aquí…»
  { x: 90, y: 7 }, //  6 · competencia: sin https ni posicionamiento
]

/** La misma web vista en un móvil: textos minúsculos y todo apretado. */
function OldPhone() {
  return (
    <div className="absolute right-[2%] -bottom-[40%] w-[23%] rotate-[3deg] overflow-hidden rounded-[18px] border-[4px] border-[#26231f] bg-[#e9e6df] shadow-[0_18px_40px_-14px_rgb(11_12_17/0.55)]" aria-hidden="true">
      <div className="mx-auto mt-1 h-[3px] w-[28%] rounded-full bg-[#26231f]" />
      <div className="aspect-[9/17] p-[7%] font-[Times,serif] text-[#333] grayscale-[30%]">
        <p className="border-b border-[#8a2b2b] pb-[3px] text-[7px] font-bold text-[#8a2b2b] italic">Mi Negocio S.L.</p>
        <p className="mt-1 text-[3.5px] text-[#1a0dab] underline">Inicio | Quienes somos | Contacto</p>
        <div className="mt-1.5 h-[22%] bg-[repeating-linear-gradient(45deg,#cfcac0,#cfcac0_3px,#d9d5cc_3px,#d9d5cc_6px)]" />
        <p className="mt-1.5 text-[4px] leading-[1.3] font-bold">¡¡BIENVENIDOS A NUESTRA PAGINA WEB!!</p>
        <p className="mt-1 text-[3.5px] leading-[1.35]">Somos una empresa con mas de 20 años de experiencia en el sector ofreciendo los mejores servicios a nuestros clientes con la maxima calidad y profesionalidad...</p>
        <p className="mt-1 text-[3.5px] text-[#1a0dab] underline">Pinche aquí para mas información</p>
      </div>
    </div>
  )
}

const icons: IconName[] = ['calendar', 'phone', 'shield', 'alert', 'mail', 'search']

export function Problem() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)
  return (
    <section className="relative bg-tone-problem section-y" aria-labelledby="problem-title">
      <div className="container-x">
        <div className="max-w-[860px]">
          <TextReveal
            id="problem-title"
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

        <div className="section-gap grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* La web antigua, señalada: cada número de la imagen es el de su tarjeta */}
          <Reveal className="relative lg:sticky lg:top-28 lg:col-span-5">
            <div className="relative mb-28 sm:mb-32">
              <OldSite />
              <OldPhone />
              {pins.map((p, i) => (
                <m.span
                  key={i}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  className={`absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#e5484d] text-[13px] font-semibold text-white shadow-[0_6px_16px_-4px_rgb(229_72_77/0.6)] ring-4 transition-[box-shadow,transform] duration-200 tabular ${active === i ? 'scale-125 ring-[#e5484d]/35' : 'ring-paper'}`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: '0px 0px -20% 0px' }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: 0.3 + i * 0.12 }}
                  aria-hidden="true"
                >
                  {i + 1}
                </m.span>
              ))}
            </div>
            <p className="text-center font-head text-[1.5rem] text-ink-2">Te suena, ¿verdad?</p>
          </Reveal>

          <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {problems.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                delay={(i % 2) * 0.06}
                className={`group relative grid grid-cols-[48px_1fr] gap-x-4 rounded-[14px] bg-white p-5 ring-1 transition-[box-shadow,transform] duration-300 ease-[var(--ease-out-strong)] sm:flex sm:flex-col sm:p-7 ${active === i ? '-translate-y-0.5 shadow-[var(--shadow-soft)] ring-[#e5484d]/45' : 'ring-line'}`}
              >
                <div onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} className="absolute inset-0 rounded-[14px]" aria-hidden="true" />
                <div className="contents sm:flex sm:items-center sm:justify-between">
                  <span className="row-span-2 flex size-12 items-center justify-center self-start rounded-[10px] bg-[#e5484d]/10 text-[#c23237]">
                    <Icon name={icons[i]} size={22} strokeWidth={1.8} />
                  </span>
                  <span className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-[#e5484d] text-[13px] font-semibold text-white tabular sm:static">{i + 1}</span>
                </div>
                <div className="sm:mt-6">
                  <h3 className="font-head pr-10 text-[clamp(1.6rem,1.4rem+0.6vw,2rem)] leading-[1.05] text-ink sm:pr-0">{p.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-mute sm:mt-3">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
