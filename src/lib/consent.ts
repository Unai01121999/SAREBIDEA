// Consentimiento de cookies (RGPD + art. 22.2 LSSI). Reglas de este módulo:
// - Hasta que la persona elige, solo está permitido lo técnico imprescindible. Las categorías opcionales
//   (analítica, marketing) empiezan siempre en "no".
// - Cualquier script de terceros que se añada en el futuro debe cargarse con `onConsent('analytics' | 'marketing', ...)`,
//   nunca directamente en index.html ni en un componente.
// - La elección se guarda en localStorage (almacenamiento técnico de preferencias, exento de consentimiento)
//   y se vuelve a preguntar pasados 12 meses o si cambia CONSENT_VERSION.
import { useSyncExternalStore } from 'react'

export type Category = 'analytics' | 'marketing'
export type Consent = { v: number; ts: number } & Record<Category, boolean>

const KEY = 'sarebidea-consent'
/** Súbela cuando cambien las categorías o su finalidad: obliga a volver a preguntar. */
const CONSENT_VERSION = 1
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

function read(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Consent | null
    if (!c || c.v !== CONSENT_VERSION || typeof c.ts !== 'number' || Date.now() - c.ts > MAX_AGE_MS) return null
    return { v: c.v, ts: c.ts, analytics: c.analytics === true, marketing: c.marketing === true }
  } catch {
    return null
  }
}

let consent: Consent | null = read()
let panelOpen = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export const getConsent = () => consent

/** Guarda la elección. Si el navegador bloquea el almacenamiento, vale solo para esta visita. */
export function saveConsent(choice: Record<Category, boolean>) {
  consent = { v: CONSENT_VERSION, ts: Date.now(), analytics: choice.analytics, marketing: choice.marketing }
  try {
    localStorage.setItem(KEY, JSON.stringify(consent))
  } catch {
    /* sin almacenamiento: la elección se mantiene en memoria */
  }
  panelOpen = false
  emit()
}

/** Reabre el panel de preferencias (enlace "Configurar cookies" del pie). */
export function openPreferences() {
  panelOpen = true
  emit()
}
export function closePreferences() {
  panelOpen = false
  emit()
}

/** Estado para la interfaz: ¿hay que mostrar el banner? ¿está abierto el panel de ajustes? */
export function useConsentState() {
  const c = useSyncExternalStore(subscribe, getConsent, () => null)
  const panel = useSyncExternalStore(subscribe, () => panelOpen, () => false)
  return { consent: c, panelOpen: panel, undecided: c === null }
}

/**
 * Ejecuta `load` solo cuando la categoría está aceptada (ahora o más adelante).
 * Si luego se retira el permiso, se llama a `unload` (úsalo para borrar cookies o parar el script).
 * Devuelve la función para cancelar la suscripción.
 */
export function onConsent(category: Category, load: () => void, unload?: () => void) {
  let active = false
  const sync = () => {
    const allowed = consent?.[category] === true
    if (allowed && !active) {
      active = true
      load()
    } else if (!allowed && active) {
      active = false
      unload?.()
    }
  }
  sync()
  return subscribe(sync)
}
