// Cliente de Supabase (Auth + PostgreSQL). Solo usa la URL y la clave PÚBLICA (publishable/anon):
// la seguridad real la ponen Row Level Security y la verificación en dos pasos en la base de datos.
// NUNCA pongas aquí (ni en variables VITE_) la clave service_role ni claves de Resend o Turnstile secret.
// Sin variables de entorno, la web sigue funcionando en modo local / vista previa de claude.ai.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

/** Correo del administrador. La base de datos lo vuelve a comprobar (tabla admin_emails). */
export const ADMIN_EMAIL = 'sarebidea@sarebidea.com'

/** Clave PÚBLICA de Cloudflare Turnstile (anti-bot del formulario). */
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
