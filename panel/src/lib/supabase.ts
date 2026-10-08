// Cliente de Supabase para el inicio de sesión del panel. Las dos variables se incrustan al compilar (NEXT_PUBLIC_*)
// y son públicas por diseño: la protección real está en las políticas de la base de datos (RLS).
// Sin variables, el panel arranca en modo demostración (sin inicio de sesión y con datos de ejemplo).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

/** Cuentas con acceso al panel. La base de datos vuelve a comprobarlo (tabla admin_emails). */
export const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? 'sarebidea@sarebidea.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
