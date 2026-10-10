import { useState } from 'react'
import { packs } from '../data/site'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'
import { useMediaQuery } from '../hooks/useMediaQuery'

type Pack = (typeof packs)[number]

function List({ title, items, inherits, open, onToggle }: { title: string; items: string[]; inherits?: boolean; open: boolean; onToggle: (open: boolean) => void }) {
  return (
    <details open={open} onToggle={(e) => onToggle(e.currentTarget.open)} className="group border-t border-current/10 py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <Icon name="chevron" size={16} className="shrink-0 opacity-60 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-4 space-y-2.5 text-[0.93rem] leading-snug">
        {inherits && <li className="font-semibold">Todo lo anterior</li>}
        {items.map((t) => (
          <li key={t} className="flex gap-2.5">
            <Icon name="check" size={16} strokeWidth={2.2} className="mt-0.5 shrink-0 text-cobalt" />
            <span className="opacity-85">{t}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function Card({ p, dark, wide }: { p: Pack; dark: boolean; wide: boolean }) {
  const [web, setWeb] = useState(wide)
  const [care, setCare] = useState(wide)
  return (
    <article
      className={`flex h-full flex-col rounded-[28px] p-7 sm:p-8 ${dark ? 'on-dark bg-ink text-paper shadow-[0_30px_60px_-24px_rgb(13_14_18/0.6)]' : 'bg-tone-hero text-ink ring-1 ring-line'}`}
      aria-labelledby={`pack-${p.key}`}
    >
      <h3 id={`pack-${p.key}`} className="font-display text-[1.5rem] font-semibold tracking-[-0.03em]">
        Pack {p.name}
      </h3>
      <p className="mt-5 flex items-baseline gap-2">
        <span className="font-display text-[clamp(2.4rem,2rem+1.4vw,3.2rem)] leading-none font-semibold tracking-[-0.04em] tabular">{p.price}</span>
        <span className={`text-[0.95rem] ${dark ? 'text-white/60' : 'text-mute'}`}>+ IVA</span>
      </p>
      <p className={`mt-2 text-[0.95rem] ${dark ? 'text-white/70' : 'text-mute'}`}>
        Mantenimiento: <strong className={dark ? 'text-paper' : 'text-ink'}>{p.maintenance}</strong>
      </p>
      <div className="mt-6">
        <Button href="#contacto" variant={dark ? 'light' : 'primary'} className="w-full justify-center">
          Quiero el Pack {p.name}
        </Button>
      </div>
      <div className="mt-7">
        <List title="Diseño web" items={p.web} inherits={p.inherits} open={web} onToggle={setWeb} />
        <List title="Mantenimiento" items={p.care} inherits={false} open={care} onToggle={setCare} />
      </div>
    </article>
  )
}

export function Packs() {
  const wide = useMediaQuery('(min-width: 1024px)')
  return (
    <section id="packs" className="relative bg-tone-services py-24 sm:py-32 lg:py-40" aria-labelledby="packs-title">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <TextReveal id="packs-title" as="h2" text="Precios claros, sin sorpresas." className="h-section max-w-[720px]" accent={[1]} />
          <Reveal delay={0.15}>
            <p className="lede max-w-[26rem] lg:ml-auto">Elige el pack que encaja con tu negocio. Cada uno incluye el diseño de la web y un mantenimiento mensual para que siempre funcione.</p>
          </Reveal>
        </div>
        {/* key: al cambiar de móvil a escritorio las listas se reabren */}
        <div key={wide ? 'wide' : 'narrow'} className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {packs.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.08} className="h-full">
              <Card p={p} dark={p.key === 'professional'} wide={wide} />
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-[0.9rem] text-mute">Los precios del diseño web no incluyen IVA. El mantenimiento se cobra cada mes.</p>
      </div>
    </section>
  )
}
