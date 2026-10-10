import { m, useReducedMotion } from 'motion/react'
import { easeOut } from '../../lib/motion'

type Props = {
  text: string
  className?: string
  as?: 'h1' | 'h2' | 'h3'
  delay?: number
  /** Animar al montar en lugar de al entrar en viewport (hero). */
  immediate?: boolean
  /** Palabras (índices) a destacar en itálica serif. */
  accent?: number[]
  id?: string
  /** Texto pequeño sobre el titular, dentro del propio <h1>/<h2> (útil para incluir la palabra clave). */
  eyebrow?: string
}

/** Titular que se revela palabra a palabra, cada una saliendo de una máscara. */
export function TextReveal({ text, className = '', as = 'h2', delay = 0, immediate = false, accent = [], id, eyebrow }: Props) {
  const reduced = useReducedMotion()
  const Tag = m[as]
  const words = text.split(' ')
  const trigger = immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px -10% 0px' } }

  return (
    <Tag id={id} className={className} initial="hidden" {...trigger} aria-label={eyebrow ? `${eyebrow}: ${text}` : text}>
      {eyebrow && (
        <span className="mb-5 flex items-center gap-2.5 font-sans text-[0.95rem] leading-none font-medium tracking-normal text-cobalt">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-cobalt" />
          {eyebrow}
        </span>
      )}
      {eyebrow && ' '}
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          <m.span
            className={`inline-block ${accent.includes(i) ? 'font-serif font-normal italic tracking-[-0.01em]' : ''}`}
            variants={{
              hidden: reduced ? { opacity: 0 } : { transform: 'translate3d(0, 105%, 0) rotate(4deg)' },
              show: reduced ? { opacity: 1 } : { transform: 'translate3d(0, 0%, 0) rotate(0deg)' },
            }}
            transition={{ duration: reduced ? 0.3 : 1, ease: easeOut, delay: delay + i * 0.055 }}
          >
            {w}
          </m.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}
