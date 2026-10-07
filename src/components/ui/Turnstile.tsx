import { useEffect, useRef } from 'react'

// Anti-bot de Cloudflare Turnstile. Solo usa la clave PÚBLICA (site key); la secreta vive en la Edge Function.
type TurnstileApi = {
  render(el: HTMLElement, opts: Record<string, unknown>): string
  reset(id?: string): void
  remove(id?: string): void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let loader: Promise<void> | null = null
const loadScript = () =>
  (loader ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loader = null
      reject(new Error('turnstile'))
    }
    document.head.appendChild(s)
  }))

export function Turnstile({ siteKey, onToken, resetKey }: { siteKey: string; onToken: (token: string) => void; resetKey?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const id = useRef<string>(undefined)
  const cb = useRef(onToken)
  useEffect(() => {
    cb.current = onToken
  })

  useEffect(() => {
    let alive = true
    loadScript()
      .then(() => {
        if (!alive || !box.current || !window.turnstile) return
        id.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          theme: 'dark',
          language: 'es',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(''),
          'error-callback': () => cb.current(''),
        })
      })
      .catch(() => cb.current(''))
    return () => {
      alive = false
      if (id.current) window.turnstile?.remove(id.current)
    }
  }, [siteKey])

  useEffect(() => {
    if (resetKey && id.current) window.turnstile?.reset(id.current)
  }, [resetKey])

  return <div ref={box} className="min-h-[65px]" />
}
