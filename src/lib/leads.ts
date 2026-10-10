// Envío del formulario de contacto. Con Supabase configurado (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) se guarda
// en la tabla `solicitudes` (el visitante anónimo solo puede INSERTAR, lo garantiza la base de datos) y aparece en el panel
// como cliente con origen «Formulario web». Sin Supabase (desarrollo local) se guarda en localStorage para poder probar.
import { supabaseRest } from './supabase'

export type LeadInput = {
  company: string
  /** Persona de contacto (columna `name`). */
  name: string
  phone: string
  email: string
  businessType: string
  description: string
  source?: 'web'
}

const LOCAL_KEY = 'sarebidea-leads'

export async function createLead(input: LeadInput): Promise<void> {
  if (supabaseRest) {
    // Tabla `solicitudes` (columnas en español); `nombre` es la persona de contacto.
    const res = await fetch(`${supabaseRest.url}/rest/v1/solicitudes`, {
      method: 'POST',
      headers: { apikey: supabaseRest.anonKey, Authorization: `Bearer ${supabaseRest.anonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        empresa: input.company,
        nombre: input.name,
        telefono: input.phone,
        correo: input.email,
        tipo_negocio: input.businessType,
        descripcion: input.description,
      }),
    })
    if (!res.ok) throw Object.assign(new Error(`No se pudo guardar la solicitud (${res.status})`), { status: res.status })
    return
  }
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as unknown[]
    localStorage.setItem(LOCAL_KEY, JSON.stringify([{ ...input, id: `${Date.now()}`, createdAt: new Date().toISOString() }, ...all]))
  } catch {
    /* almacenamiento bloqueado: no hay dónde guardar en local */
  }
}

export type LeadFormErrors = Partial<Record<'company' | 'name' | 'phone' | 'email' | 'businessType' | 'description', string>>

/** Validación del formulario público. */
export function validateLead(v: { company: string; name: string; phone: string; email: string; businessType: string; description: string }) {
  const e: LeadFormErrors = {}
  if (v.company.trim().length < 2) e.company = 'Escribe el nombre de la empresa.'
  if (v.name.trim().length < 3) e.name = 'Escribe la persona de contacto.'
  if (v.phone.replace(/\D/g, '').length < 9) e.phone = 'El teléfono debe tener al menos 9 cifras.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Revisa el correo: falta la @ o el dominio.'
  if (!v.businessType) e.businessType = 'Elige el tipo de negocio.'
  if (v.description.trim().length < 10) e.description = 'Cuéntanos un poco más (mínimo 10 caracteres).'
  return e
}
