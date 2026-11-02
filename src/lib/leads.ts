// Envío del formulario de contacto. Con Supabase configurado (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) se envía a la
// función `enviar-solicitud`, que comprueba el CAPTCHA (Cloudflare Turnstile), aplica los límites por IP y correo y guarda la
// solicitud en la tabla `solicitudes`; aparece en el panel como cliente con origen «Formulario web». Sin Supabase (desarrollo local) se guarda en localStorage para poder probar.
import { supabaseRest } from './supabase'

export const PACK_CHOICES = ['STARTER', 'PROFESSIONAL', 'PREMIUM', 'INDECISO'] as const
export type PackChoice = (typeof PACK_CHOICES)[number]

export type LeadInput = {
  company: string
  /** Persona de contacto (columna `name`). */
  name: string
  phone: string
  email: string
  businessType: string
  /** Pack que le interesa: STARTER, PROFESSIONAL, PREMIUM o INDECISO («No lo tengo claro»). */
  pack: PackChoice
  description: string
  source?: 'web'
  /** Token del CAPTCHA (Cloudflare Turnstile). */
  captcha?: string
  /** Campo trampa para bots (debe ir vacío). */
  website?: string
}

const LOCAL_KEY = 'sarebidea-leads'

export async function createLead(input: LeadInput): Promise<void> {
  if (supabaseRest) {
    // Columnas de la tabla `solicitudes` (en español); `nombre` es la persona de contacto.
    const res = await fetch(`${supabaseRest.url}/functions/v1/enviar-solicitud`, {
      method: 'POST',
      headers: { apikey: supabaseRest.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa: input.company,
        nombre: input.name,
        telefono: input.phone,
        correo: input.email,
        tipo_negocio: input.businessType,
        pack_interes: input.pack,
        descripcion: input.description,
        website: input.website ?? '',
        token: input.captcha ?? '',
      }),
    })
    if (!res.ok) {
      // Errores con mensaje propio: CAPTCHA no superado y demasiados envíos seguidos (antispam).
      const body = await res.text().catch(() => '')
      const code = res.status === 403 || body.includes('"captcha"') ? 'captcha' : res.status === 429 || body.includes('demasiadas_solicitudes') ? 'rate_limited' : undefined
      throw Object.assign(new Error(`No se pudo guardar la solicitud (${res.status})`), { status: res.status, code })
    }
    return
  }
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as unknown[]
    localStorage.setItem(LOCAL_KEY, JSON.stringify([{ ...input, id: `${Date.now()}`, createdAt: new Date().toISOString() }, ...all]))
  } catch {
    /* almacenamiento bloqueado: no hay dónde guardar en local */
  }
}

export type LeadFormErrors = Partial<Record<'company' | 'name' | 'phone' | 'email' | 'businessType' | 'pack' | 'description', string>>

/** Validación del formulario público. */
export function validateLead(v: { company: string; name: string; phone: string; email: string; businessType: string; pack: string; description: string }) {
  const e: LeadFormErrors = {}
  if (v.company.trim().length < 2) e.company = 'Escribe el nombre de la empresa.'
  if (v.name.trim().length < 3) e.name = 'Escribe la persona de contacto.'
  if (v.phone.replace(/\D/g, '').length < 9) e.phone = 'El teléfono debe tener al menos 9 cifras.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Revisa el correo: falta la @ o el dominio.'
  if (!v.businessType) e.businessType = 'Elige el tipo de negocio.'
  if (!(PACK_CHOICES as readonly string[]).includes(v.pack)) e.pack = 'Elige un pack o «No lo tengo claro».'
  if (v.description.trim().length < 10) e.description = 'Cuéntanos un poco más (mínimo 10 caracteres).'
  return e
}
