export const legalPages = {
  'aviso-legal': 'Aviso legal',
  'politica-de-privacidad': 'Política de privacidad',
  'politica-de-cookies': 'Política de cookies',
} as const
export type LegalPageId = keyof typeof legalPages

/** Dirección real de cada página legal (con barra final, como las sirve el servidor). */
export const legalPath = (id: LegalPageId) => `/${id}/`

/**
 * Las páginas legales tienen su propia URL (/aviso-legal/, /politica-de-privacidad/, /politica-de-cookies/) y se
 * publican como HTML estático (ver scripts/prerender.mjs). Esta función dice cuál es la página actual, si lo es.
 */
export function currentLegalPage(): LegalPageId | null {
  if (typeof window === 'undefined') return null
  const id = window.location.pathname.replace(/^\/|\/$/g, '')
  return id in legalPages ? (id as LegalPageId) : null
}
