import { packs } from '../data/site'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

type Pack = (typeof packs)[number]

function List({ title, items, inherits }: { title: string; items: string[]; inherits?: boolean }) {
  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <h4 className="text-[0.8125rem] font-semibold tracking-[0.01em] text-ink">{title}</h4>
      <ul className="mt-3.5 space-y-2.5 text-[0.9375rem] leading-snug text-ink-2">
        {inherits && <li className="font-semibold text-ink">Todo lo anterior</li>}
        {items.map((t) => (
          <li key={t} className="flex gap-2.5">
            <Icon name="check" size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-cobalt" />
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
    <article className="card-lift flex h-full flex-col rounded-[24px] bg-white p-6 ring-1 ring-line sm:p-8" aria-labelledby={`pack-${p.key}`}>
      <h3 id={`pack-${p.key}`} className="font-display text-[1.375rem] font-semibold tracking-[-0.025em] text-ink">
        Pack {p.name}
      </h3>
      <p className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-[clamp(2.5rem,2.1rem+1.4vw,3.375rem)] leading-none font-semibold tracking-[-0.045em] text-ink tabular">{p.price}</span>
        <span className="text-[0.9375rem] text-mute">+ IVA</span>
      </p>
      <p className="mt-4 rounded-xl bg-paper px-4 py-3 text-[0.9375rem] text-mute ring-1 ring-line">
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
        <div className="section-gap grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {packs.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.08} className="h-full">
              <Card p={p} />
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-[0.9rem] text-mute">Los precios del diseño web no incluyen IVA. El mantenimiento se cobra cada mes. ¿Dudas sobre qué incluye cada pack? Escríbenos.</p>
      </div>
    </section>
  )
}
