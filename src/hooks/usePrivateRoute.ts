import { useCallback, useSyncExternalStore } from 'react'

const HASH = '#area-privada'
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

// ?acceso=privada: se mantiene por compatibilidad con enlaces antiguos
const isOpen = () => window.location.hash === HASH || new URLSearchParams(window.location.search).has('acceso')

/** El Área Privada vive en #area-privada: enlazable y el botón "atrás" la cierra. */
export function usePrivateRoute() {
  const open = useSyncExternalStore(subscribe, isOpen, () => false)
  const show = useCallback(() => {
    window.location.hash = HASH
  }, [])
  const hide = useCallback(() => {
    if (!isOpen()) return
    // Quita el hash sin saltar al inicio de la página
    const params = new URLSearchParams(window.location.search)
    params.delete('acceso')
    params.delete('code')
    const q = params.toString()
    history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''))
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [])
  return { open, show, hide }
}
