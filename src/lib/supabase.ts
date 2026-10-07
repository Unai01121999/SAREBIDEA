// Backend de producción (Supabase): login con Google + segundo factor, base de datos y avisos por correo.
// Si no hay variables de entorno (por ejemplo, en la vista previa de claude.ai), la web sigue funcionando
// con el almacén de la vista previa o con localStorage. Ver SETUP-BACKEND.md.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

/** Cuentas con acceso al Área privada. La base de datos lo vuelve a comprobar (tabla admin_emails). */
export const adminEmails = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ?? 'sarebidea@sarebidea.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
