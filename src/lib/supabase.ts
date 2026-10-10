// Conexión mínima con Supabase para el formulario de contacto: un solo POST a la API REST (PostgREST).
// No se carga la librería oficial (supabase-js pesa ~90 KB comprimidos y aquí solo hace falta insertar una fila).
// Si no hay variables de entorno (desarrollo local), el formulario guarda en localStorage.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseRest = url && anonKey ? { url: url.replace(/\/$/, ''), anonKey } : null
