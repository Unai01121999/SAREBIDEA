import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { projects, serviceExtras, services, type ServiceKey } from '../data/site'
import { easeOut } from '../lib/motion'
import { PhoneFrame } from '../components/mockups/Frames'
import { SiteMobile } from '../components/mockups/SiteMock'
import { Icon, type IconName } from '../components/ui/Icon'
import { Reveal } from '../components/ui/Reveal'
import { TextReveal } from '../components/ui/TextReveal'

function DesignVisual() {
  const swatches = ['#1b1512', '#d9733c', '#f3e7d9', '#3a2c24']
  return (
    <div className="flex h-full items-center justify-between gap-4" aria-hidden="true">
      <div>
        <div className="font-serif text-[6.5rem] leading-[0.8] tracking-[-0.03em] text-ink transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:-translate-y-1">
          Aa
        </div>
        <div className="mt-3 text-xs text-mute">Tu tipografía</div>
      </div>
      <div>
        <div className="grid grid-cols-2 gap-2">
          {swatches.map((c) => (
            <span key={c} className="size-11 rounded-xl ring-1 ring-black/5" style={{ background: c }} />
          ))}
        </div>
        <div className="mt-3 text-xs text-mute">Tus colores</div>
      </div>
    </div>
  )
}

function MobileVisual() {
  return (
    <div className="absolute inset-x-0 top-6 flex justify-center" aria-hidden="true">
      <div className="w-[150px] transition-transform duration-700 ease-[var(--ease-out-strong)] group-hover:-translate-y-2">
        <PhoneFrame className="shadow-[0_30px_60px_-20px_rgb(13_14_18/0.45)]">
          <SiteMobile p={projects[1]} />
        </PhoneFrame>
      </div>
    </div>
  )
}

function SeoVisual() {
  const rows = [
    { t: 'Tu negocio', u: 'tunegocio.com', you: true },
    { t: 'Competidor', u: 'directorio-local.es' },
  ]
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[var(--shadow-soft)] ring-1 ring-black/5" aria-hidden="true">
      <div className="flex items-center gap-2 rounded-full bg-paper px-3.5 py-2 text-[13px] text-ink-2 ring-1 ring-black/5">
        <Icon name="search" size={15} className="text-mute" />
        peluquería cerca de mí
      </div>
      <ul className="mt-2.5 space-y-1">
        {rows.map((r, i) => (
          <li key={r.t} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${r.you ? 'bg-cobalt/[0.07] ring-1 ring-cobalt/20' : 'opacity-55'}`}>
            <span className={`flex size-7 items-center justify-center rounded-full ${r.you ? 'bg-cobalt text-white' : 'bg-black/5 text-mute'}`}>
              <Icon name="pin" size={14} />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className={`block text-[13.5px] ${r.you ? 'font-semibold text-ink' : 'text-ink-2'}`}>{r.t}</span>
              <span className="block truncate text-[11.5px] text-mute">{r.u}</span>
            </span>
            <span className={`text-[12px] tabular ${r.you ? 'font-semibold text-cobalt' : 'text-mute'}`}>{i + 1}.º</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ConversionVisual() {
  const reduced = useReducedMotion()
  const leads = [
    { icon: 'phone' as const, t: 'Llamada desde la web', h: '10:24' },
    { icon: 'mail' as const, t: 'Nueva solicitud', h: '11:02' },
    { icon: 'check' as const, t: 'Cita reservada', h: '12:40' },
  ]
  return (
    <ul className="space-y-2" aria-hidden="true">
      {leads.map((l, i) => (
        <motion.li
          key={l.t}
          className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-3.5 py-2.5 ring-1 ring-white/10"
          initial={{ opacity: 0, transform: reduced ? 'none' : 'translate3d(24px,0,0)' }}
          whileInView={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
          viewport={{ once: true, margin: '0px 0px -15% 0px' }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.25 + i * 0.18 }}
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-cobalt text-white">
            <Icon name={l.icon} size={16} />
          </span>
          <span className="flex-1 text-[14px] text-paper">{l.t}</span>
          <span className="text-[12px] text-white/50 tabular">{l.h}</span>
        </motion.li>
      ))}
    </ul>
  )
}

function SpeedVisual() {
  const reduced = useReducedMotion()
  // La longitud de cada barra es el tiempo de carga: más corta, más rápida.
  const bars = [
    { label: 'Tu web', value: '0,8 s', width: 19, you: true },
    { label: 'Media de webs locales', value: '4,2 s', width: 100 },
  ]
  return (
    <div className="flex h-full flex-col justify-center" aria-hidden="true">
      <div className="flex items-baseline gap-1 font-display font-semibold tracking-[-0.04em] text-ink">
        <span className="text-[3.5rem] leading-none tabular">0,8</span>
        <span className="text-xl text-mute">segundos</span>
      </div>
      <div className="mt-5 space-y-3">
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className={b.you ? 'font-medium text-ink' : 'text-mute'}>{b.label}</span>
              <span className={`tabular ${b.you ? 'font-medium text-cobalt' : 'text-mute'}`}>{b.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
              <motion.div
                className={`h-full origin-left rounded-full ${b.you ? 'bg-cobalt' : 'bg-ink/25'}`}
                style={{ width: `${b.width}%` }}
                initial={{ transform: reduced ? 'scaleX(1)' : 'scaleX(0)' }}
                whileInView={{ transform: 'scaleX(1)' }}
                viewport={{ once: true }}
                transition={{ duration: b.you ? 0.5 : 1.4, ease: easeOut, delay: 0.3 + i * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CareVisual() {
  const items = ['Copia de seguridad hecha', 'Horario de Navidad actualizado', 'Seguridad al día']
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-black/5" aria-hidden="true">
      <div className="flex items-center justify-between text-[13px] font-medium text-ink">
        <span className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="anim-ping absolute inset-0 rounded-full bg-emerald-500" />
            <span className="relative size-2.5 rounded-full bg-emerald-500" />
          </span>
          Todo funcionando
        </span>
        <span className="text-xs font-normal text-mute">Hoy</span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((t) => (
          <li key={t} className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <Icon name="check" size={15} className="text-emerald-600" strokeWidth={2.2} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

const visuals: Record<ServiceKey, ReactNode> = {
  design: <DesignVisual />,
  mobile: <MobileVisual />,
  seo: <SeoVisual />,
  conversion: <ConversionVisual />,
  speed: <SpeedVisual />,
  care: <CareVisual />,
}

const icons: Record<ServiceKey, IconName> = {
  design: 'spark',
  mobile: 'phone',
  seo: 'search',
  conversion: 'mail',
  speed: 'bolt',
  care: 'shield',
}

export function Services() {
  return (
    <section id="servicios" className="relative bg-tone-services py-24 sm:py-32 lg:py-40" aria-labelledby="services-title">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <TextReveal id="services-title" as="h2" text="Todo lo que tu web necesita. Nada de lo que preocuparte." className="h-section max-w-[780px]" accent={[6, 7, 8]} />
          <Reveal delay={0.15}>
            <p className="lede max-w-[28rem] lg:ml-auto">
              Seis cosas que tiene cualquier web que hacemos, sin extras ni letra pequeña. Tú te dedicas a tu negocio.
            </p>
          </Reveal>
        </div>

        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-5">
          {services.map((s, i) => {
            const dark = s.key === 'conversion'
            return (
              <Reveal as="li" key={s.key} delay={(i % 3) * 0.08} className="group flex flex-col rounded-[28px] bg-[#faf7f1] p-2.5 ring-1 ring-line">
                <div
                  className={`relative h-[220px] overflow-hidden rounded-[20px] p-4 sm:p-5 ${dark ? 'on-dark flex flex-col justify-center bg-ink' : 'bg-[#efe7da]'} ${s.key === 'seo' || s.key === 'care' ? 'flex flex-col justify-center' : ''}`}
                >
                  {visuals[s.key]}
                </div>

                <div className="flex flex-1 flex-col px-3.5 pt-5 pb-4 sm:px-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-paper">
                        <Icon name={icons[s.key]} size={17} />
                      </span>
                      <span className="rounded-full bg-cobalt/[0.08] px-2.5 py-1 text-[12px] font-medium text-cobalt">{s.tag}</span>
                    </span>
                    <span className="text-[13px] text-mute tabular" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-[1.5rem] leading-[1.1] font-semibold tracking-[-0.025em] text-ink">{s.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-mute">{s.body}</p>

                  <ul className="mt-5 space-y-2.5 border-t border-line pt-5" aria-label={`Qué incluye: ${s.title}`}>
                    {s.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[0.95rem] leading-snug text-ink-2">
                        <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
                          <Icon name="check" size={13} strokeWidth={2.4} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </ol>

        <Reveal delay={0.1} className="mt-5 rounded-[28px] bg-[#f3ece1] p-6 ring-1 ring-line sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="font-display text-[1.35rem] leading-tight font-semibold tracking-[-0.02em] text-ink">Y además, siempre incluido</p>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:flex lg:gap-8">
              {serviceExtras.map((e) => (
                <li key={e.label} className="flex items-center gap-3 text-[0.95rem] text-ink-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-cobalt ring-1 ring-line">
                    <Icon name={e.icon} size={17} />
                  </span>
                  {e.label}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
