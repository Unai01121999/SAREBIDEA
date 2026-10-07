// Edge Function pública: recibe el formulario de la web, comprueba el anti-bot (Cloudflare Turnstile),
// guarda la solicitud y avisa por correo (Resend) a sarebidea@sarebidea.com.
// Secretos (supabase secrets set …): RESEND_API_KEY, TURNSTILE_SECRET_KEY, ALLOWED_ORIGINS (separados por comas)
// y, opcionalmente, NOTIFY_TO / NOTIFY_FROM. SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const TO = Deno.env.get('NOTIFY_TO') ?? 'sarebidea@sarebidea.com'
const FROM = Deno.env.get('NOTIFY_FROM') ?? 'Web SAREBIDEA <sarebidea@sarebidea.com>'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED.includes(origin) ? origin : ALLOWED[0] ?? 'null',
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
})
const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } })

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })
  if (req.method !== 'POST') return json({ error: 'method' }, 405, origin)
  if (!origin || !ALLOWED.includes(origin)) return json({ error: 'origin' }, 403, origin)

  const b = await req.json().catch(() => null)
  if (!b || typeof b !== 'object') return json({ error: 'invalid' }, 400, origin)

  // Honeypot: un campo oculto que las personas no rellenan. Respondemos "ok" para no dar pistas.
  if (str(b.company, 100)) return json({ ok: true }, 200, origin)

  // Cloudflare Turnstile
  const token = str(b.turnstileToken, 2048)
  if (!TURNSTILE_SECRET || !token) return json({ error: 'captcha' }, 400, origin)
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const form = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
  if (ip) form.set('remoteip', ip)
  const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    .then((r) => r.json() as Promise<{ success?: boolean }>)
    .catch(() => null)
  if (!check?.success) return json({ error: 'captcha' }, 400, origin)

  const lead = {
    name: str(b.name, 120),
    phone: str(b.phone, 30),
    email: str(b.email, 160),
    business_type: str(b.businessType, 80),
    description: str(b.description, 2000),
    source: 'web',
    status: 'nuevo',
  }
  if (lead.name.length < 3 || lead.phone.replace(/\D/g, '').length < 9 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !lead.business_type || !lead.description) {
    return json({ error: 'invalid' }, 400, origin)
  }

  const { data: r, error } = await db.from('leads').insert(lead).select('code, created_at').single()
  if (error || !r) {
    console.error('insert', error?.message)
    return json({ error: 'server' }, 500, origin)
  }

  // El aviso por correo no debe hacer fallar el envío: la solicitud ya está guardada.
  try {
    const date = new Date(r.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'long', timeStyle: 'short' })
    const rows: [string, string][] = [
      ['ID', r.code],
      ['Nombre completo', lead.name],
      ['Teléfono', lead.phone],
      ['Correo electrónico', lead.email],
      ['Tipo de negocio', lead.business_type],
      ['Descripción', lead.description],
      ['Fecha', date],
    ]
    const html = `<div style="font-family:Arial,sans-serif;color:#0d0e12"><h2 style="margin:0 0 16px">Nuevo cliente desde la web</h2><table cellpadding="8" style="border-collapse:collapse">${rows
      .map(([k, v]) => `<tr><td style="color:#6b6b6b;vertical-align:top">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v) || '—'}</td></tr>`)
      .join('')}</table></div>`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], subject: 'Nuevo Cliente', html, text: rows.map(([k, v]) => `${k}: ${v || '—'}`).join('\n'), reply_to: lead.email }),
    })
    if (!res.ok) console.error('Resend', res.status, await res.text())
  } catch (e) {
    console.error('Resend', e)
  }
  return json({ ok: true }, 200, origin)
})
