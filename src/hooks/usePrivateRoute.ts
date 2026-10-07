import { useCallback, useSyncExternalStore } from 'react'

const HASH = '#area-privada'
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

const isOpen = () => window.location.hash === HASH

/** El Área Privada vive en #area-privada: enlazable y el botón "atrás" la cierra. */
export function usePrivateRoute() {
  const open = useSyncExternalStore(subscribe, isOpen, () => false)
  const show = useCallback(() => {
    window.location.hash = HASH
  }, [])
  const hide = useCallback(() => {
    if (!isOpen()) return
    // Quita el hash sin saltar al inicio de la página
    history.replaceState(null, '', window.location.pathname + window.location.search)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [])
  return { open, show, hide }
}
