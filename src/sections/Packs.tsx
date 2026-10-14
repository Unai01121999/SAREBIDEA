import { packs } from '../data/site'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

type Pack = (typeof packs)[number]

function List({ title, items, inherits }: { title: string; items: string[]; inherits?: boolean }) {
  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <h4 className="eyebrow !text-ink">{title}</h4>
      <ul className="mt-3.5 space-y-2.5 text-[0.9375rem] leading-snug text-ink-2">
        {inherits && <li className="font-semibold text-ink">Todo lo anterior</li>}
        {items.map((t) => (
          <li key={t} className="flex gap-2.5">
            <Icon name="check" size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-cobalt-deep" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Las tres tarjetas comparten estructura, tamaño y estilo: así se comparan de un vistazo (precio, mantenimiento, botón y listas en las mismas posiciones). */
function Card({ p }: { p: Pack }) {
  return (
    <article className="group flex h-full flex-col bg-white p-6 transition-colors duration-300 hover:bg-[#fcfcfe] sm:p-9" aria-labelledby={`pack-${p.key}`}>
      <h3 id={`pack-${p.key}`} className="font-head text-[2rem] leading-none text-ink">
        Pack {p.name}
      </h3>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="font-head text-[clamp(3.5rem,2.8rem+2.4vw,4.75rem)] leading-none text-ink tabular">{p.price}</span>
        <span className="text-[0.9375rem] text-mute">+ IVA</span>
      </p>
      <p className="mt-5 border-y border-line py-3 text-[0.9375rem] text-mute">
        Mantenimiento: <strong className="font-semibold text-ink">{p.maintenance}</strong>
      </p>
      <div className="mt-5">
        <Button href="#contacto" variant="primary" className="w-full justify-center">
          Quiero el Pack {p.name}
        </Button>
      </div>
      <div className="mt-8 border-t border-line pt-7">
        <List title="Diseño web" items={p.web} inherits={p.inherits} />
        <List title="Mantenimiento" items={p.care} />
      </div>
    </article>
  )
}

export function Packs() {
  return (
    <section id="packs" className="relative bg-tone-showcase section-y" aria-labelledby="packs-title">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <TextReveal id="packs-title" as="h2" text="Precios claros, sin sorpresas." className="h-section max-w-[720px]" accent={[1]} />
          <Reveal delay={0.15}>
            <p className="lede max-w-[26rem] lg:ml-auto">Elige el pack que encaja con tu negocio. Cada uno incluye el diseño de la web y un mantenimiento mensual para que siempre funcione.</p>
          </Reveal>
        </div>
        <div className="section-gap grid gap-px overflow-hidden rounded-[14px] bg-line ring-1 ring-line lg:grid-cols-3 lg:items-stretch">
          {packs.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.08} className="h-full bg-white">
              <Card p={p} />
            </Reveal>
          ))}
        </div>
        <p className="mt-8 max-w-[48rem] text-[0.9rem] text-mute">Los precios del diseño web no incluyen IVA. El mantenimiento se cobra cada mes. ¿Dudas sobre qué incluye cada pack? Escríbenos.</p>
      </div>
    </section>
  )
}
