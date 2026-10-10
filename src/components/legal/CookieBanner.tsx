import { useEffect, useRef, useState } from 'react'
import { closePreferences, saveConsent, useConsentState, type Category } from '../../lib/consent'

// Aceptar y rechazar tienen exactamente el mismo estilo, tamaño y nivel (primera capa).
const btn =
  'inline-flex h-12 flex-1 items-center justify-center rounded-full px-5 text-[0.95rem] font-medium tracking-[-0.01em] transition-[background-color,scale] duration-200 active:scale-[0.97] sm:flex-none sm:min-w-[9.5rem]'
const same = `${btn} bg-ink text-paper hover:bg-[#1c1e26]`
const outline = `${btn} bg-white text-ink ring-1 ring-line hover:bg-ink/[0.04]`

const categories: { key: Category; title: string; body: string }[] = [
  {
    key: 'analytics',
    title: 'Analítica',
    body: 'Google Analytics: nos ayuda a entender cómo se usa la web (páginas visitadas, tiempos) para mejorarla. Solo se carga si la aceptas.',
  },
  {
    key: 'marketing',
    title: 'Marketing',
    body: 'Sirven para mostrar publicidad relacionada con tus intereses y medir campañas. Hoy no hay ninguna activa.',
  },
]

const LEGAL_LINK = 'font-medium text-ink underline underline-offset-2 hover:text-cobalt'

export function CookieBanner() {
  const { consent, panelOpen, undecided } = useConsentState()
  const [panel, setPanel] = useState(false)
  const showPanel = panel || panelOpen
  const show = undecided || showPanel

  const close = () => {
    setPanel(false)
    closePreferences()
  }

  if (!show) return null
  return showPanel ? (
    <Preferences initial={consent} onClose={close} />
  ) : (
    <section
      role="region"
      aria-label="Aviso de cookies"
      className="on-light fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-[56rem] rounded-[24px] bg-paper p-5 shadow-float ring-1 ring-line sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">Tu privacidad, tu decisión</h2>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
        Esta web solo usa el almacenamiento técnico imprescindible para funcionar. Las cookies opcionales (analítica y marketing) están{' '}
        <strong className="font-semibold">desactivadas</strong> y no se cargará nada de eso salvo que lo aceptes. Puedes cambiarlo cuando quieras desde «Configurar cookies» en el pie. Más información en la{' '}
        <a href="/politica-de-cookies/" className={LEGAL_LINK}>
          política de cookies
        </a>
        .
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className={same} onClick={() => saveConsent({ analytics: false, marketing: false })}>
          Rechazar todo
        </button>
        <button type="button" className={outline} onClick={() => setPanel(true)}>
          Configurar
        </button>
        <button type="button" className={same} onClick={() => saveConsent({ analytics: true, marketing: true })}>
          Aceptar todo
        </button>
      </div>
    </section>
  )
}

function Preferences({ initial, onClose }: { initial: ReturnType<typeof useConsentState>['consent']; onClose: () => void }) {
  const [choice, setChoice] = useState<Record<Category, boolean>>({ analytics: initial?.analytics ?? false, marketing: initial?.marketing ?? false })
  const ref = useRef<HTMLDivElement>(null)

  // Foco dentro del cuadro de diálogo, Escape lo cierra y Tab no se sale de él.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab' || !ref.current) return
      const f = ref.current.querySelectorAll<HTMLElement>('button, input:not(:disabled), a[href]')
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/50 p-3 sm:items-center sm:p-6" data-lenis-prevent>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        className="on-light max-h-[92dvh] w-full max-w-[40rem] overflow-y-auto rounded-[24px] bg-paper p-6 shadow-float sm:p-8"
      >
        <h2 id="cookie-title" className="font-display text-[1.5rem] font-semibold tracking-[-0.03em]">
          Configurar cookies
        </h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">
          Elige qué categorías permites. Todo lo opcional está desactivado por defecto. Consulta el detalle en la{' '}
          <a href="/politica-de-cookies/" className={LEGAL_LINK} onClick={onClose}>
            política de cookies
          </a>
          .
        </p>

        <ul className="mt-6 space-y-3">
          <li className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">Técnicas (necesarias)</span>
              <span className="text-[13px] font-medium text-mute">Siempre activas</span>
            </div>
            <p className="mt-1.5 text-[0.9rem] leading-relaxed text-mute">
              Imprescindibles para que la web funcione y para recordar tu elección. No requieren consentimiento.
            </p>
          </li>
          {categories.map((c) => (
            <li key={c.key} className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <label htmlFor={`ck-${c.key}`} className="flex cursor-pointer items-center justify-between gap-4">
                <span className="font-medium">{c.title}</span>
                <input
                  id={`ck-${c.key}`}
                  type="checkbox"
                  role="switch"
                  checked={choice[c.key]}
                  onChange={(e) => setChoice({ ...choice, [c.key]: e.target.checked })}
                  className="size-6 shrink-0 cursor-pointer"
                />
              </label>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-mute">{c.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className={same} onClick={() => saveConsent({ analytics: false, marketing: false })}>
            Rechazar todo
          </button>
          <button type="button" className={outline} onClick={() => saveConsent(choice)}>
            Guardar selección
          </button>
          <button type="button" className={same} onClick={() => saveConsent({ analytics: true, marketing: true })}>
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  )
}
