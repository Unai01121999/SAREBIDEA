import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { easeOut } from '../../lib/motion'

type Props = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'li' | 'p' | 'span'
}

/** Revelado al entrar en viewport. Con reduced motion: solo fundido. */
export function Reveal({ children, delay = 0, y = 24, className, as = 'div' }: Props) {
  const reduced = useReducedMotion()
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, transform: reduced ? 'none' : `translate3d(0, ${y}px, 0)`, filter: reduced ? 'none' : 'blur(6px)' }}
      whileInView={{ opacity: 1, transform: 'translate3d(0, 0px, 0)', filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: reduced ? 0.3 : 0.9, ease: easeOut, delay }}
    >
      {children}
    </M>
  )
}
