// Enlaces a las cuentas de Instagram y Facebook del pie de la web. Se escriben en el panel (Configuración → Datos de la empresa)
// y la web los lee con la función pública `redes_sociales` de Supabase (el visitante anónimo no puede leer la tabla de ajustes).
// Si Supabase no está configurado o aún no hay enlace, se usa la página principal de cada red para que el botón nunca quede roto.
import { supabaseRest } from './supabase'

export type Socials = { instagram: string; facebook: string }

export const SOCIAL_FALLBACK: Socials = { instagram: 'https://www.instagram.com/', facebook: 'https://www.facebook.com/' }

/** Solo se aceptan enlaces http(s): nunca `javascript:` ni otros esquemas. */
const safe = (v: unknown, fallback: string) => (typeof v === 'string' && /^https?:\/\//i.test(v.trim()) ? v.trim() : fallback)

export async function loadSocials(): Promise<Socials> {
  if (!supabaseRest) return SOCIAL_FALLBACK
  try {
    const res = await fetch(`${supabaseRest.url}/rest/v1/rpc/redes_sociales`, {
      method: 'POST',
      headers: { apikey: supabaseRest.anonKey, Authorization: `Bearer ${supabaseRest.anonKey}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!res.ok) return SOCIAL_FALLBACK
    const d = (await res.json()) as Partial<Socials>
    return { instagram: safe(d.instagram, SOCIAL_FALLBACK.instagram), facebook: safe(d.facebook, SOCIAL_FALLBACK.facebook) }
  } catch {
    return SOCIAL_FALLBACK
  }
}
