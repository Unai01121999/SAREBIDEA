import type { ReactNode } from 'react'
import { Icon, type IconName } from '../components/ui/Icon'

// Piezas visuales del panel privado: tarjetas, avatares, indicadores y controles de filtro.

export const CARD = 'rounded-2xl bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] ring-1 ring-slate-900/[0.07]'

const tones = [
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${tones[hash(name) % tones.length]}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  )
}

export function Code({ code }: { code?: string }) {
  return <span className="inline-block shrink-0 whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600 tabular">{code ?? '…'}</span>
}

export type Tone = 'blue' | 'amber' | 'red' | 'green' | 'slate'
export const toneChip: Record<Tone, string> = {
  blue: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  green: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-600',
}

export function IconChip({ icon, tone, size = 36 }: { icon: IconName; tone: Tone; size?: number }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${toneChip[tone]}`} style={{ width: size, height: size }}>
      <Icon name={icon} size={size * 0.5} />
    </span>
  )
}

/** Indicador grande con título, cifra y una línea de ayuda. Si recibe onClick, se puede pulsar. */
export function Kpi({ icon, tone, label, value, hint, onClick }: { icon: IconName; tone: Tone; label: string; value: string; hint?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
        <IconChip icon={icon} tone={tone} size={32} />
      </span>
      <span className="mt-3 block truncate font-display text-[1.9rem] leading-none font-semibold tracking-[-0.03em] text-slate-900 tabular">{value}</span>
      {hint && <span className="mt-2 block text-[12.5px] text-slate-500">{hint}</span>}
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={`${CARD} block w-full p-4 text-left transition-[box-shadow,translate] duration-150 hover:-translate-y-px hover:shadow-md sm:p-5`}>
      {body}
    </button>
  ) : (
    <div className={`${CARD} p-4 sm:p-5`}>{body}</div>
  )
}

export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`${CARD} min-w-0 ${className}`}>
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.01em] text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="p-5 pt-4">{children}</div>
    </section>
  )
}

/** Filtros en forma de segmentos con contador. */
export function Segmented<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { key: K; label: string; count: number }[]
  value: K
  onChange: (k: K) => void
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0" role="group" aria-label={label}>
      <div className="inline-flex gap-1 rounded-xl bg-slate-200/60 p-1">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={value === o.key}
            onClick={() => onChange(o.key)}
            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-150 ${
              value === o.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {o.label}
            <span className={`rounded-md px-1.5 text-[11.5px] tabular ${value === o.key ? 'bg-slate-100 text-slate-600' : 'text-slate-500'}`}>{o.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Barra apilada (cobrado / pendiente / atrasado). */
export function StackBar({ parts }: { parts: { label: string; value: number; color: string; text: string }[] }) {
  const total = parts.reduce((a, p) => a + p.value, 0)
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={parts.map((p) => `${p.label}: ${p.value} euros`).join(', ')}>
        {total > 0 &&
          parts
            .filter((p) => p.value > 0)
            .map((p) => <span key={p.label} className={p.color} style={{ width: `${(p.value / total) * 100}%` }} />)}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.label} className="min-w-0">
            <span className="flex items-center gap-2 text-[13px] text-slate-500">
              <span className={`size-2.5 rounded-full ${p.color}`} />
              {p.label}
            </span>
            <span className={`mt-1 block truncate font-display text-[1.25rem] font-semibold tracking-[-0.02em] tabular ${p.text}`}>{formatEuro(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const formatEuro = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 })
