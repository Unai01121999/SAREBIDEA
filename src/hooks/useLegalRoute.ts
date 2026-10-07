import { useCallback, useSyncExternalStore } from 'react'

export const legalPages = {
  'aviso-legal': 'Aviso legal',
  'politica-de-privacidad': 'Política de privacidad',
  'politica-de-cookies': 'Política de cookies',
} as const
export type LegalPageId = keyof typeof legalPages

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const current = (): LegalPageId | null => {
  const id = window.location.hash.slice(1)
  return id in legalPages ? (id as LegalPageId) : null
}

/** Las páginas legales viven en #aviso-legal, #politica-de-privacidad y #politica-de-cookies (enlazables). */
export function useLegalRoute() {
  const page = useSyncExternalStore(subscribe, current, () => null)
  const hide = useCallback(() => {
    if (!current()) return
    // Quita el hash sin saltar al inicio de la página
    history.replaceState(null, '', window.location.pathname + window.location.search)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [])
  return { page, hide }
}
