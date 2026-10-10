import { m, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { ReactNode, PointerEvent } from 'react'
import { useFinePointer, useReducedMotionPref } from '../../hooks/useMediaQuery'
import { Icon } from './Icon'

type Variant = 'primary' | 'ghost' | 'light' | 'outline-light'

const styles: Record<Variant, string> = {
  primary:
    'bg-ink text-paper shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_10px_24px_-10px_rgb(13_14_18/0.55)] hover:bg-[#1c1e26]',
  ghost: 'bg-white/60 text-ink ring-1 ring-line backdrop-blur-sm hover:bg-white',
  light: 'bg-paper text-ink shadow-[0_10px_30px_-10px_rgb(0_0_0/0.5)] hover:bg-white',
  'outline-light': 'text-paper ring-1 ring-white/20 hover:bg-white/8',
}

type Props = {
  href: string
  children: ReactNode
  variant?: Variant
  size?: 'md' | 'lg'
  icon?: boolean
  className?: string
  onClick?: () => void
}

/** Botón magnético: sigue levemente al cursor con un muelle (solo puntero fino, sin reduced motion). */
export function Button({ href, children, variant = 'primary', size = 'md', icon = true, className = '', onClick }: Props) {
  const fine = useFinePointer()
  const reduced = useReducedMotionPref()
  const magnetic = fine && !reduced
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 })
  const transform = useTransform(() => `translate3d(${x.get()}px, ${y.get()}px, 0)`)
  const innerTransform = useTransform(() => `translate3d(${x.get() * 0.35}px, ${y.get() * 0.35}px, 0)`)

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (!magnetic) return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22)
    my.set((e.clientY - (r.top + r.height / 2)) * 0.32)
  }
  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  const pad = size === 'lg' ? 'h-14 px-7 text-[1.0625rem]' : 'h-11 px-5 text-[0.95rem]'

  return (
    <m.a
      href={href}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={magnetic ? { transform } : undefined}
      className={`group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-[background-color,box-shadow,scale] duration-200 ease-[var(--ease-out-strong)] active:scale-[0.97] ${pad} ${styles[variant]} ${className}`}
    >
      <m.span className="inline-flex items-center gap-2" style={magnetic ? { transform: innerTransform } : undefined}>
        {children}
        {icon && (
          <span className="relative -mr-1 inline-flex size-6 items-center justify-center overflow-hidden rounded-full">
            <Icon
              name="arrow"
              size={18}
              className="transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:translate-x-[140%]"
            />
            <Icon
              name="arrow"
              size={18}
              className="absolute -translate-x-[140%] transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:translate-x-0"
            />
          </span>
        )}
      </m.span>
    </m.a>
  )
}
