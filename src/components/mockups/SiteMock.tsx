import type { CSSProperties, ReactNode } from 'react'
import type { Project } from '../../data/site'

const fontFor = (f: Project['theme']['font']) =>
  f === 'serif'
    ? { fontFamily: 'var(--font-serif)', fontWeight: 400, letterSpacing: '-0.01em' }
    : f === 'display'
      ? { fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.04em', textTransform: 'uppercase' as const }
      : { fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.035em' }

/**
 * Placeholder visual de la "foto" de cada web: composición abstracta con la paleta del negocio.
 * Si el proyecto tiene `image`, se muestra la captura real en su lugar.
 */
export function Art({ p, className = '', style }: { p: Project; className?: string; style?: CSSProperties }) {
  const { accent, soft, bg, fg } = p.theme
  if (p.image) return <img src={p.image} alt="" className={`object-cover ${className}`} style={style} loading="lazy" />
  const motif: Record<string, ReactNode> = {
    restaurante: (
      <>
        <circle cx="60" cy="58" r="30" fill={bg} opacity=".85" />
        <circle cx="60" cy="58" r="21" fill="none" stroke={accent} strokeWidth="1.2" opacity=".8" />
        <path d="M24 30c8 6 14 6 22 0M74 92c8-6 16-6 24 0" stroke={fg} strokeOpacity=".35" fill="none" />
      </>
    ),
    peluqueria: (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M-5 ${30 + i * 13}c20-12 40 12 60 0s40-12 70 0`} stroke={i % 2 ? accent : fg} strokeOpacity={i % 2 ? 0.9 : 0.25} strokeWidth="2.4" fill="none" />
        ))}
      </>
    ),
    clinica: (
      <>
        <rect x="35" y="20" width="50" height="76" rx="25" fill="#fff" opacity=".8" />
        <path d="M60 44v28M46 58h28" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      </>
    ),
    gimnasio: (
      <>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={10 + i * 26} y={92 - (i + 1) * 17} width="18" height={(i + 1) * 17} rx="2" fill={i === 3 ? accent : fg} opacity={i === 3 ? 1 : 0.18 + i * 0.1} />
        ))}
      </>
    ),
    taller: (
      <>
        <circle cx="60" cy="58" r="30" fill="none" stroke={accent} strokeWidth="9" strokeDasharray="8 6" />
        <circle cx="60" cy="58" r="13" fill={fg} opacity=".2" />
      </>
    ),
    tienda: (
      <>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${16 + i * 31} 100V52a14 14 0 0 1 28 0v48`} fill={i === 1 ? accent : '#fff'} opacity={i === 1 ? 0.9 : 0.6} />
        ))}
      </>
    ),
    profesional: (
      <>
        <rect x="30" y="30" width="54" height="66" rx="4" fill="#fff" opacity=".6" transform="rotate(-8 57 63)" />
        <rect x="38" y="24" width="54" height="66" rx="4" fill="#fff" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x="46" y={36 + i * 10} width={i === 3 ? 20 : 36} height="3" rx="1.5" fill={accent} opacity={i === 0 ? 0.9 : 0.3} />
        ))}
      </>
    ),
  }
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, ${soft} 0%, ${soft} 40%, ${mix(accent, soft)} 140%)`, ...style }}
      role="img"
      aria-label={`Imagen de ejemplo para ${p.business}`}
    >
      <svg viewBox="0 0 120 116" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        {motif[p.id]}
      </svg>
    </div>
  )
}

const mix = (a: string, b: string) => `color-mix(in oklab, ${a} 45%, ${b})`

function Stars({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-[0.25cqw]" style={{ color }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" style={{ width: '1.6cqw', height: '1.6cqw' }} fill="currentColor" aria-hidden="true">
          <path d="m12 3 2.7 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.5 19.5l1.2-6L3.2 9.3l6.1-.7Z" />
        </svg>
      ))}
    </span>
  )
}

type T = Project['theme']
const pill = (t: T, solid = true): CSSProperties =>
  solid ? { background: t.accent, color: t.accentFg, borderRadius: 999 } : { boxShadow: `inset 0 0 0 1px ${t.fg}40`, borderRadius: 999 }
const ring = (t: T, a = '22'): CSSProperties => ({ boxShadow: `inset 0 0 0 1px ${t.fg}${a}` })

function Nav({ p, center = false, solidCta = true }: { p: Project; center?: boolean; solidCta?: boolean }) {
  const t = p.theme
  const links = (
    <div className="flex items-center" style={{ gap: '2.6cqw', fontSize: '1.3cqw', opacity: 0.75 }}>
      {p.nav.map((n) => (
        <span key={n}>{n}</span>
      ))}
    </div>
  )
  if (center)
    return (
      <div className="grid grid-cols-[1fr_auto_1fr] items-center" style={{ padding: '2.4cqw 4cqw' }}>
        {links}
        <span style={{ ...fontFor(t.font), fontSize: '2.6cqw' }}>{p.business}</span>
        <span className="justify-self-end" style={{ ...pill(t, solidCta), padding: '0.8cqw 1.8cqw', fontSize: '1.3cqw' }}>
          {p.cta}
        </span>
      </div>
    )
  return (
    <div className="flex items-center justify-between" style={{ padding: '2.4cqw 4cqw' }}>
      <span style={{ ...fontFor(t.font), fontSize: '2.2cqw' }}>{p.business}</span>
      <div className="flex items-center" style={{ gap: '2.6cqw' }}>
        {links}
        <span style={{ ...pill(t, solidCta), padding: '0.8cqw 1.8cqw', fontSize: '1.3cqw' }}>{p.cta}</span>
      </div>
    </div>
  )
}

const H = ({ p, size, className = '', style }: { p: Project; size: number; className?: string; style?: CSSProperties }) => (
  <div className={className} style={{ ...fontFor(p.theme.font), fontSize: `${size}cqw`, lineHeight: 0.98, ...style }}>
    {p.headline}
  </div>
)

/** Restaurante: texto a la izquierda, imagen a la derecha. */
function SplitDesktop({ p }: { p: Project }) {
  const t = p.theme
  return (
    <>
      <Nav p={p} />
      <div className="grid grid-cols-[1.05fr_1fr] items-center" style={{ gap: '3.5cqw', padding: '2cqw 4cqw 0' }}>
        <div>
          <div className="flex items-center" style={{ gap: '1cqw', fontSize: '1.25cqw', opacity: 0.8, marginBottom: '2cqw' }}>
            <Stars color={t.accent} /> 4,9 · reseñas en Google
          </div>
          <H p={p} size={6.2} />
          <div style={{ fontSize: '1.45cqw', lineHeight: 1.5, opacity: 0.7, marginTop: '2cqw', maxWidth: '32cqw' }}>
            Cocina de brasa en el centro. Reserva en segundos y descubre por qué nuestros clientes repiten.
          </div>
          <div className="flex" style={{ gap: '1.2cqw', marginTop: '3cqw', fontSize: '1.4cqw' }}>
            <span style={{ ...pill(t), padding: '1.2cqw 2.4cqw' }}>{p.cta}</span>
            <span style={{ ...pill(t, false), padding: '1.2cqw 2.4cqw' }}>Ver la carta</span>
          </div>
        </div>
        <Art p={p} className="aspect-[5/4.4] w-full" style={{ borderRadius: '1.6cqw' }} />
      </div>
      <div className="grid grid-cols-3" style={{ margin: '3cqw 4cqw 0', borderTop: `1px solid ${t.fg}22`, paddingTop: '1.8cqw', fontSize: '1.2cqw' }}>
        {[
          ['Horario', 'Mar–Dom · 13:00–23:30'],
          ['Dónde', 'Calle Mayor 12'],
          ['Reservas', '944 000 000'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ opacity: 0.5 }}>{k}</div>
            <div style={{ marginTop: '0.4cqw' }}>{v}</div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Peluquería: logo centrado, titular centrado y tira de tres imágenes. */
function CenteredDesktop({ p }: { p: Project }) {
  const t = p.theme
  return (
    <>
      <Nav p={p} center solidCta={false} />
      <div className="text-center" style={{ padding: '2.5cqw 10cqw 0' }}>
        <div style={{ fontSize: '1.2cqw', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>Estudio de color y corte</div>
        <H p={p} size={6.4} style={{ marginTop: '1.4cqw', fontStyle: 'italic' }} />
        <span className="inline-block" style={{ ...pill(t), padding: '1.1cqw 2.6cqw', fontSize: '1.4cqw', marginTop: '2.4cqw' }}>
          {p.cta}
        </span>
      </div>
      <div className="grid grid-cols-3" style={{ gap: '1.6cqw', padding: '3cqw 4cqw 0' }}>
        {[0, 1, 2].map((i) => (
          <Art key={i} p={p} className="aspect-[4/3]" style={{ borderRadius: i === 1 ? '20cqw 20cqw 1.4cqw 1.4cqw' : '1.4cqw', filter: i === 1 ? 'none' : 'saturate(0.7)' }} />
        ))}
      </div>
    </>
  )
}

/** Clínica: titular y ventajas a la izquierda, widget de reserva a la derecha. */
function BookingDesktop({ p }: { p: Project }) {
  const t = p.theme
  const days = ['Lun 6', 'Mar 7', 'Mié 8', 'Jue 9']
  return (
    <>
      <Nav p={p} />
      <div className="grid grid-cols-[1.15fr_1fr] items-start" style={{ gap: '4cqw', padding: '3cqw 4cqw 0' }}>
        <div>
          <H p={p} size={5.4} />
          <div style={{ fontSize: '1.45cqw', lineHeight: 1.5, opacity: 0.7, marginTop: '2cqw', maxWidth: '34cqw' }}>
            Fisioterapia, odontología y nutrición en un mismo lugar. Primera visita sin listas de espera.
          </div>
          <div className="flex flex-col" style={{ gap: '1.1cqw', marginTop: '3cqw', fontSize: '1.35cqw' }}>
            {['Especialistas colegiados', 'Cita en menos de 48 h', 'Parking gratuito'].map((x) => (
              <span key={x} className="flex items-center" style={{ gap: '1cqw' }}>
                <span className="flex items-center justify-center rounded-full" style={{ width: '2cqw', height: '2cqw', background: t.soft, color: t.accent, fontSize: '1.2cqw' }}>
                  <svg viewBox="0 0 24 24" style={{ width: '1.2cqw', height: '1.2cqw' }} fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path d="m5 12.5 4.2 4L19 7" />
                  </svg>
                </span>
                {x}
              </span>
            ))}
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '2cqw', padding: '2.4cqw', boxShadow: `0 2cqw 4cqw -2cqw ${t.fg}33` }}>
          <div style={{ fontSize: '1.6cqw', fontWeight: 600 }}>Reserva tu consulta</div>
          <div style={{ fontSize: '1.15cqw', opacity: 0.6, marginTop: '1.4cqw' }}>Tratamiento</div>
          <div style={{ ...ring(t), borderRadius: '1cqw', padding: '1cqw 1.4cqw', fontSize: '1.3cqw', marginTop: '0.6cqw' }}>Fisioterapia deportiva</div>
          <div style={{ fontSize: '1.15cqw', opacity: 0.6, marginTop: '1.4cqw' }}>Día</div>
          <div className="grid grid-cols-4" style={{ gap: '0.8cqw', marginTop: '0.6cqw' }}>
            {days.map((d, i) => (
              <span
                key={d}
                className="text-center"
                style={{ borderRadius: '1cqw', padding: '1cqw 0', fontSize: '1.2cqw', ...(i === 1 ? { background: t.accent, color: t.accentFg } : ring(t)) }}
              >
                {d}
              </span>
            ))}
          </div>
          <div className="text-center" style={{ ...pill(t), padding: '1.2cqw', fontSize: '1.35cqw', marginTop: '2cqw' }}>
            {p.cta}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4" style={{ gap: '1.2cqw', padding: '3cqw 4cqw 0' }}>
        {['Fisioterapia', 'Odontología', 'Nutrición', 'Pilates clínico'].map((x) => (
          <div key={x} style={{ background: t.soft, borderRadius: '1.2cqw', padding: '1.4cqw 1.6cqw', fontSize: '1.3cqw', fontWeight: 600 }}>
            {x}
            <div style={{ fontWeight: 400, opacity: 0.6, fontSize: '1.1cqw', marginTop: '0.4cqw' }}>Ver tratamiento →</div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Gimnasio: imagen a sangre, titular gigante abajo y horario. */
function PosterDesktop({ p }: { p: Project }) {
  const t = p.theme
  return (
    <div className="relative h-full">
      <Art p={p} className="absolute inset-0" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${t.bg}55 0%, ${t.bg}10 35%, ${t.bg}ee 100%)` }} />
      <div className="relative flex h-full flex-col">
        <Nav p={p} />
        <div className="mt-auto flex items-end justify-between" style={{ padding: '0 4cqw 4cqw', gap: '4cqw' }}>
          <div>
            <H p={p} size={8.4} style={{ maxWidth: '58cqw' }} />
            <span className="inline-block" style={{ ...pill(t), padding: '1.2cqw 2.6cqw', fontSize: '1.4cqw', marginTop: '2.4cqw', fontWeight: 600 }}>
              {p.cta}
            </span>
          </div>
          <div style={{ background: `${t.bg}cc`, ...ring(t, '25'), borderRadius: '1.4cqw', padding: '1.6cqw 2cqw', fontSize: '1.25cqw', minWidth: '24cqw' }}>
            <div style={{ opacity: 0.6, marginBottom: '0.8cqw' }}>Hoy</div>
            {[
              ['07:00', 'Fuerza'],
              ['18:30', 'HIIT'],
              ['20:00', 'Movilidad'],
            ].map(([h, c]) => (
              <div key={h} className="flex justify-between" style={{ padding: '0.5cqw 0', borderTop: `1px solid ${t.fg}1a` }}>
                <span>{c}</span>
                <span style={{ color: t.accent }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Taller: banda superior con teléfono, titular y servicios en fila. */
function ServiceDesktop({ p }: { p: Project }) {
  const t = p.theme
  return (
    <>
      <div className="flex justify-between" style={{ background: t.accent, color: t.accentFg, padding: '0.8cqw 4cqw', fontSize: '1.15cqw', fontWeight: 600 }}>
        <span>L–V 8:00–19:00 · Sábados con cita</span>
        <span>Tel. 944 000 000</span>
      </div>
      <Nav p={p} />
      <div className="grid grid-cols-[1fr_0.9fr] items-center" style={{ gap: '4cqw', padding: '1cqw 4cqw 0' }}>
        <div>
          <H p={p} size={4.6} />
          <div className="flex" style={{ gap: '1.2cqw', marginTop: '2.6cqw', fontSize: '1.35cqw' }}>
            <span style={{ ...pill(t), padding: '1.2cqw 2.4cqw', fontWeight: 600 }}>{p.cta}</span>
            <span style={{ ...pill(t, false), padding: '1.2cqw 2.4cqw' }}>Escríbenos por WhatsApp</span>
          </div>
        </div>
        <Art p={p} className="aspect-[16/10] w-full" style={{ borderRadius: '0.8cqw' }} />
      </div>
      <div className="grid grid-cols-4" style={{ gap: '1.2cqw', padding: '3.4cqw 4cqw 0' }}>
        {['Mecánica', 'Neumáticos', 'Pre-ITV', 'Aire acondicionado'].map((x, i) => (
          <div key={x} style={{ background: t.soft, borderRadius: '0.8cqw', padding: '1.4cqw', fontSize: '1.3cqw' }}>
            <div style={{ color: t.accent, fontSize: '1.1cqw', fontWeight: 700 }}>0{i + 1}</div>
            <div style={{ marginTop: '0.6cqw', fontWeight: 600 }}>{x}</div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Tienda local: aviso, titular corto y rejilla de productos con precio. */
function ShopDesktop({ p }: { p: Project }) {
  const t = p.theme
  const items = [
    ['Queso de Idiazabal', '14,90 €'],
    ['Miel de brezo', '8,50 €'],
    ['Pan de masa madre', '4,20 €'],
    ['Txakoli de la zona', '11,00 €'],
  ]
  return (
    <>
      <div className="text-center" style={{ background: t.fg, color: t.bg, padding: '0.8cqw', fontSize: '1.15cqw' }}>
        Encarga hoy y recógelo mañana en la tienda
      </div>
      <Nav p={p} />
      <div className="flex items-end justify-between" style={{ padding: '1cqw 4cqw 0' }}>
        <H p={p} size={4.4} style={{ maxWidth: '50cqw' }} />
        <span style={{ ...pill(t), padding: '1.1cqw 2.4cqw', fontSize: '1.35cqw' }}>{p.cta}</span>
      </div>
      <div className="grid grid-cols-4" style={{ gap: '1.6cqw', padding: '3cqw 4cqw 0' }}>
        {items.map(([n, pr], i) => (
          <div key={n}>
            <Art p={p} className="aspect-square" style={{ borderRadius: '1.2cqw', filter: `hue-rotate(${i * 18}deg)` }} />
            <div className="flex justify-between" style={{ marginTop: '1cqw', fontSize: '1.25cqw' }}>
              <span>{n}</span>
              <span style={{ fontWeight: 600 }}>{pr}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/** Profesional independiente: retrato a la izquierda, texto editorial a la derecha. */
function EditorialDesktop({ p }: { p: Project }) {
  const t = p.theme
  return (
    <div className="grid h-full grid-cols-[0.8fr_1fr]">
      <Art p={p} className="h-full" />
      <div className="flex flex-col" style={{ padding: '2.4cqw 4cqw 3.4cqw' }}>
        <div className="flex justify-between" style={{ fontSize: '1.3cqw' }}>
          <span style={{ ...fontFor(t.font), fontSize: '2cqw' }}>{p.business}</span>
          <span className="flex" style={{ gap: '2.4cqw', opacity: 0.7 }}>
            {p.nav.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </div>
        <div className="mt-auto">
          <div style={{ fontSize: '1.2cqw', opacity: 0.6 }}>{p.sector} · Bilbao</div>
          <H p={p} size={5.6} style={{ marginTop: '1.4cqw' }} />
          <div style={{ fontSize: '1.4cqw', lineHeight: 1.55, opacity: 0.72, marginTop: '2cqw', maxWidth: '40cqw' }}>
            Llevo la fiscalidad de autónomos y pequeñas empresas desde hace 12 años. Hablas siempre conmigo, no con una centralita.
          </div>
          <div className="flex items-center" style={{ gap: '2cqw', marginTop: '2.6cqw', fontSize: '1.35cqw' }}>
            <span style={{ ...pill(t), padding: '1.2cqw 2.4cqw' }}>{p.cta}</span>
            <span style={{ borderBottom: `1px solid ${t.fg}`, paddingBottom: '0.3cqw' }}>Ver servicios</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const desktopLayouts: Record<Project['layout'], (props: { p: Project }) => ReactNode> = {
  split: SplitDesktop,
  centered: CenteredDesktop,
  booking: BookingDesktop,
  poster: PosterDesktop,
  service: ServiceDesktop,
  shop: ShopDesktop,
  editorial: EditorialDesktop,
}

/** Mini-web de escritorio. Todo en cqw para escalar con el marco. */
export function SiteDesktop({ p }: { p: Project }) {
  const Layout = desktopLayouts[p.layout] ?? SplitDesktop
  return (
    <div className="aspect-[16/10] w-full overflow-hidden" style={{ background: p.theme.bg, color: p.theme.fg }}>
      <Layout p={p} />
    </div>
  )
}

function MobileBar({ p, onDark = false }: { p: Project; onDark?: boolean }) {
  const t = p.theme
  const c = onDark ? '#fff' : t.fg
  return (
    <div className="relative flex items-center justify-between" style={{ padding: '15cqw 7cqw 5cqw', color: c }}>
      <span style={{ ...fontFor(t.font), fontSize: '6.5cqw' }}>{p.business}</span>
      <span className="flex flex-col" style={{ gap: '1.6cqw' }}>
        <span style={{ width: '7cqw', height: '0.9cqw', background: c, borderRadius: 9 }} />
        <span style={{ width: '7cqw', height: '0.9cqw', background: c, borderRadius: 9 }} />
      </span>
    </div>
  )
}

const MCta = ({ t, label, solid = true }: { t: T; label: string; solid?: boolean }) => (
  <div className="text-center" style={{ ...pill(t, solid), padding: '4cqw', fontSize: '4.2cqw', fontWeight: 500 }}>
    {label}
  </div>
)

/** Mini-web móvil: cada estructura tiene su versión pensada para el móvil. */
export function SiteMobile({ p }: { p: Project }) {
  const t = p.theme
  const hSize = t.font === 'serif' ? 12.5 : t.font === 'display' ? 12 : 11
  let body: ReactNode
  switch (p.layout) {
    case 'poster':
      return (
        <div className="relative aspect-[9/19.5] w-full overflow-hidden" style={{ background: t.bg, color: t.fg }}>
          <Art p={p} className="absolute inset-0" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${t.bg}66, ${t.bg}00 30%, ${t.bg}f2 70%)` }} />
          <MobileBar p={p} />
          <div className="absolute inset-x-0 bottom-0" style={{ padding: '0 7cqw 12cqw' }}>
            <H p={p} size={14} />
            <div style={{ marginTop: '6cqw' }}>
              <MCta t={t} label={p.cta} />
            </div>
          </div>
        </div>
      )
    case 'centered':
      body = (
        <div className="text-center" style={{ padding: '4cqw 7cqw 0' }}>
          <H p={p} size={13} style={{ fontStyle: 'italic' }} />
          <Art p={p} className="mx-auto" style={{ width: '70cqw', aspectRatio: '3/3.4', borderRadius: '35cqw 35cqw 4cqw 4cqw', marginTop: '7cqw' }} />
          <div style={{ marginTop: '7cqw' }}>
            <MCta t={t} label={p.cta} />
          </div>
        </div>
      )
      break
    case 'booking':
      body = (
        <div style={{ padding: '4cqw 7cqw 0' }}>
          <H p={p} size={hSize} />
          <div style={{ background: '#fff', borderRadius: '6cqw', padding: '6cqw', marginTop: '8cqw', boxShadow: `0 6cqw 12cqw -6cqw ${t.fg}40` }}>
            <div style={{ fontSize: '4.6cqw', fontWeight: 600 }}>Reserva tu consulta</div>
            <div className="grid grid-cols-3" style={{ gap: '2cqw', marginTop: '4cqw' }}>
              {['Mar 7', 'Mié 8', 'Jue 9'].map((d, i) => (
                <span key={d} className="text-center" style={{ borderRadius: '3cqw', padding: '3cqw 0', fontSize: '3.4cqw', ...(i === 0 ? { background: t.accent, color: t.accentFg } : ring(t)) }}>
                  {d}
                </span>
              ))}
            </div>
            <div style={{ marginTop: '5cqw' }}>
              <MCta t={t} label={p.cta} />
            </div>
          </div>
          <div className="flex flex-col" style={{ marginTop: '8cqw', fontSize: '4cqw' }}>
            {['Fisioterapia', 'Odontología', 'Nutrición'].map((x) => (
              <div key={x} className="flex justify-between" style={{ padding: '3.4cqw 0', borderTop: `1px solid ${t.fg}1f`, fontWeight: 600 }}>
                {x}
                <span style={{ color: t.accent }}>→</span>
              </div>
            ))}
          </div>
        </div>
      )
      break
    case 'shop':
      body = (
        <div style={{ padding: '2cqw 7cqw 0' }}>
          <H p={p} size={10} />
          <div className="grid grid-cols-2" style={{ gap: '4cqw', marginTop: '6cqw' }}>
            {['14,90 €', '8,50 €', '4,20 €', '11,00 €'].map((pr, i) => (
              <div key={pr}>
                <Art p={p} className="aspect-square" style={{ borderRadius: '4cqw', filter: `hue-rotate(${i * 18}deg)` }} />
                <div style={{ fontSize: '3.6cqw', fontWeight: 600, marginTop: '2cqw' }}>{pr}</div>
              </div>
            ))}
          </div>
        </div>
      )
      break
    case 'service':
      body = (
        <div style={{ padding: '2cqw 7cqw 0' }}>
          <H p={p} size={hSize} />
          <div className="flex flex-col" style={{ gap: '3cqw', marginTop: '7cqw' }}>
            <MCta t={t} label={p.cta} />
            <MCta t={t} label="WhatsApp" solid={false} />
          </div>
          <div className="grid grid-cols-2" style={{ gap: '3cqw', marginTop: '7cqw' }}>
            {['Mecánica', 'Neumáticos', 'Pre-ITV', 'Aire acond.'].map((x) => (
              <div key={x} style={{ background: t.soft, borderRadius: '3cqw', padding: '4cqw', fontSize: '3.6cqw', fontWeight: 600 }}>
                {x}
              </div>
            ))}
          </div>
        </div>
      )
      break
    case 'editorial':
      return (
        <div className="aspect-[9/19.5] w-full overflow-hidden" style={{ background: t.bg, color: t.fg }}>
          <Art p={p} className="w-full" style={{ height: '52%' }} />
          <div style={{ padding: '7cqw' }}>
            <div style={{ fontSize: '3.4cqw', opacity: 0.6 }}>{p.sector} · Bilbao</div>
            <H p={p} size={hSize} style={{ marginTop: '3cqw' }} />
            <div style={{ marginTop: '7cqw' }}>
              <MCta t={t} label={p.cta} />
            </div>
          </div>
        </div>
      )
    default:
      body = (
        <>
          <Art p={p} className="mx-auto aspect-[4/3.3]" style={{ width: '86cqw', borderRadius: '6cqw' }} />
          <div style={{ padding: '6cqw 7cqw 0' }}>
            <H p={p} size={hSize} />
            <div style={{ fontSize: '3.8cqw', lineHeight: 1.5, opacity: 0.7, marginTop: '4cqw' }}>Reserva en segundos desde tu móvil.</div>
            <div style={{ marginTop: '6cqw' }}>
              <MCta t={t} label={p.cta} />
            </div>
          </div>
        </>
      )
  }
  return (
    <div className="aspect-[9/19.5] w-full overflow-hidden" style={{ background: t.bg, color: t.fg }}>
      <MobileBar p={p} />
      {body}
    </div>
  )
}
