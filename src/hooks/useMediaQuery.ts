import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Ratón real con hover: solo aquí activamos tilt, magnetismo y parallax de puntero. */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')
export const useReducedMotionPref = () => useMediaQuery('(prefers-reduced-motion: reduce)')
