import type { Transition } from 'motion/react'

/** Ease-out fuerte (Emil Kowalski) para entradas. */
export const easeOut = [0.23, 1, 0.32, 1] as const
/** Ease-in-out fuerte para movimiento en pantalla. */
export const easeInOut = [0.77, 0, 0.175, 1] as const

export const spring: Transition = { type: 'spring', duration: 0.6, bounce: 0.15 }
export const springSoft = { stiffness: 120, damping: 20, mass: 0.6 }
