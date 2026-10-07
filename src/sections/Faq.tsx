import { useId, useState } from 'react'
import { brand, faqs } from '../data/site'
import { Icon } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  const id = useId()
  return (
    <li className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span className="font-display text-[clamp(1.1rem,1rem+0.4vw,1.35rem)] font-medium tracking-[-0.015em] text-ink">{q}</span>
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-full ring-1 transition-[background-color,color,transform] duration-300 ease-[var(--ease-out-strong)] ${
              open ? 'rotate-45 bg-ink text-paper ring-ink' : 'text-ink ring-line group-hover:bg-ink/[0.05]'
            }`}
          >
            <Icon name="plus" size={16} />
          </span>
        </button>
      </h3>
      {/* grid-rows 0fr → 1fr: altura animada sin medir en JS */}
      <div
        id={id}
        role="region"
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out-strong)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <p className="max-w-[40rem] pr-12 pb-7 text-[1rem] leading-relaxed text-mute">{a}</p>
        </div>
      </div>
    </li>
  )
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="relative bg-tone-faq py-24 sm:py-32 lg:py-40" aria-labelledby="faq-title">
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <TextReveal id="faq-title" as="h2" text="Preguntas frecuentes" className="h-section" accent={[1]} />
          <Reveal delay={0.15}>
            <p className="lede mt-6 max-w-[24rem]">¿Te queda alguna duda? Escríbenos y te respondemos personalmente.</p>
            <a href={`mailto:${brand.email}`} className="mt-6 inline-flex items-center gap-2 font-medium text-ink underline decoration-ink/25 underline-offset-[6px] transition-colors hover:decoration-cobalt">
              <Icon name="mail" size={18} /> {brand.email}
            </a>
          </Reveal>
        </div>
        <Reveal>
          <ul className="border-t border-line">
            {faqs.map((f, i) => (
              <Item key={f.q} q={f.q} a={f.a} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
