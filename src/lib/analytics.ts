// Google Analytics 4 (etiqueta gtag.js). Se carga SOLO si la persona acepta la categoría "analítica"
// (ver consent.ts): hasta entonces no se pide nada a Google ni se crea ninguna cookie.
// La web es una sola página (index.html) y las páginas legales viven en la misma, así que una única
// etiqueta cubre todo el sitio. El guardián `loaded` impide añadirla dos veces.
import { onConsent } from './consent'

const GA_ID = 'G-9VQM7EP390'
const SCRIPT_ID = 'ga-gtag'

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void } & Record<string, unknown>
const w = window as unknown as W

let loaded = false

function load() {
  // Si ya se cargó antes (se retiró y se volvió a dar el permiso), solo se reactiva.
  w[`ga-disable-${GA_ID}`] = false
  if (loaded || document.getElementById(SCRIPT_ID)) return
  loaded = true

  // Código oficial de Google, equivalente al fragmento que se pega tras <head>:
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', GA_ID)

  const s = document.createElement('script')
  s.id = SCRIPT_ID
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

/** Si se retira el permiso: se detiene el envío de datos y se borran las cookies de Analytics. */
function unload() {
  w[`ga-disable-${GA_ID}`] = true
  const names = ['_ga', `_ga_${GA_ID.replace('G-', '')}`, '_gid', '_gat']
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const n of names) {
    for (const d of domains) {
      document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ''}`
    }
  }
}

export function initAnalytics() {
  onConsent('analytics', load, unload)
}
