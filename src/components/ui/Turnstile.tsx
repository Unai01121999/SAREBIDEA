import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'

// CAPTCHA de Cloudflare Turnstile. El script de Cloudflare solo se descarga cuando el formulario se acerca a la pantalla.
// La comprobación de verdad la hace el servidor (función `enviar-solicitud`): aquí solo se obtiene el token.

/** Clave pública del widget (Cloudflare → Turnstile). Se puede cambiar con VITE_TURNSTILE_SITE_KEY. */
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAFwssqdT_NF9_e_D'
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let loading: Promise<TurnstileApi> | null = null
function loadTurnstile() {
  loading ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
    s.onerror = () => {
      loading = null
      reject(new Error('turnstile'))
    }
    document.head.appendChild(s)
  })
  return loading
}

export type TurnstileHandle = { reset: () => void }

export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string) => void; onError: () => void }>(function Turnstile({ onToken, onError }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const id = useRef<string | null>(null)
  const cb = useRef({ onToken, onError })
  useLayoutEffect(() => {
    cb.current = { onToken, onError }
  })

  useImperativeHandle(ref, () => ({ reset: () => id.current && window.turnstile?.reset(id.current) }), [])

  useEffect(() => {
    const el = box.current
    if (!el) return
    let cancelled = false
    const start = () =>
      loadTurnstile()
        .then((t) => {
          if (cancelled || id.current) return
          id.current = t.render(el, {
            sitekey: TURNSTILE_SITE_KEY,
            action: 'solicitud',
            theme: 'dark',
            language: 'es',
            size: 'flexible',
            callback: (token: string) => cb.current.onToken(token),
            'expired-callback': () => cb.current.onToken(''),
            'error-callback': () => {
              cb.current.onToken('')
              cb.current.onError()
            },
          })
        })
        .catch(() => !cancelled && cb.current.onError())
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        start()
      }
    }, { rootMargin: '800px 0px' })
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      if (id.current) window.turnstile?.remove(id.current)
      id.current = null
    }
  }, [])

  return <div ref={box} className="min-h-[65px] w-full" />
})
