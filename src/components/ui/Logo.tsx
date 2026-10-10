type Tone = 'ink' | 'paper'
type Props = { className?: string; tone?: Tone; size?: number; tagline?: boolean }

export const BRAND_BLUE = '#0A93F5'

/** La "A" de la marca: un tejado sin travesaño, en azul. */
function Peak({ h }: { h: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ height: h, width: 'auto' }} aria-hidden="true" className="shrink-0">
      <path d="M0 100 37 0h26l37 100H74L50 33 26 100Z" fill={BRAND_BLUE} />
    </svg>
  )
}

/** Logotipo SAREBIDEA (S·Λ·REBIDE·Λ), vectorial para que sea nítido a cualquier tamaño. */
export function Logo({ className = '', tone = 'ink', size = 21, tagline = false }: Props) {
  const color = tone === 'ink' ? 'var(--color-ink)' : 'var(--color-paper)'
  // Altura de mayúscula de Montserrat ≈ 0.7em
  const cap = `${size * 0.7}px`
  return (
    <span className={`inline-flex flex-col ${className}`} role="img" aria-label="SAREBIDEA">
      <span
        aria-hidden="true"
        className="inline-flex items-baseline font-brand leading-none font-extrabold"
        style={{ fontSize: size, color, letterSpacing: '0.005em' }}
      >
        S
        <span className="mx-[0.035em] inline-flex self-baseline">
          <Peak h={cap} />
        </span>
        REBIDE
        <span className="ml-[0.035em] inline-flex self-baseline">
          <Peak h={cap} />
        </span>
      </span>
      {tagline && (
        <span aria-hidden="true" className="mt-[0.55em] font-display font-medium whitespace-nowrap uppercase" style={{ fontSize: size * 0.3, letterSpacing: '0.22em', color }}>
          Páginas web que impulsan tu negocio
        </span>
      )}
    </span>
  )
}
