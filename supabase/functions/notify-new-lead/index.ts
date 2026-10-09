// Supabase Edge Function: envía "Nuevo Cliente" a sarebidea@sarebidea.com con los datos del formulario.
// Se llama desde el trigger de 002_aviso_por_correo.sql. Desplegada con verify_jwt desactivado (se protege con x-webhook-secret). El correo sale por Resend (resend.com).
// Secretos: RESEND_API_KEY, WEBHOOK_SECRET y opcionalmente NOTIFY_TO / NOTIFY_FROM.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')
const TO = Deno.env.get('NOTIFY_TO') ?? 'sarebidea@sarebidea.com'
const FROM = Deno.env.get('NOTIFY_FROM') ?? 'Web SAREBIDEA <web@sarebidea.com>'

type Solicitud = { codigo: string; creado_el: string; nombre: string; empresa: string | null; telefono: string; correo: string; tipo_negocio: string; descripcion: string }

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

Deno.serve(async (req) => {
  if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) return new Response('No autorizado', { status: 401 })
  const payload = await req.json().catch(() => null)
  const r = payload?.record as Solicitud | undefined
  if (payload?.type !== 'INSERT' || payload?.table !== 'solicitudes' || !r) return new Response('Ignorado', { status: 200 })

  const date = new Date(r.creado_el).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'long', timeStyle: 'short' })
  const rows: [string, string][] = [
    ['ID', r.codigo],
    ['Nombre de la empresa', r.empresa ?? ''],
    ['Persona de contacto', r.nombre],
    ['Teléfono', r.telefono],
    ['Correo electrónico', r.correo],
    ['Tipo de negocio', r.tipo_negocio],
    ['Descripción', r.descripcion],
    ['Fecha', date],
  ]
  const html = `<div style="font-family:Arial,sans-serif;color:#0d0e12">
  <h2 style="margin:0 0 16px">Nuevo cliente desde la web</h2>
  <table cellpadding="8" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="color:#6b6b6b;vertical-align:top">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v) || '—'}</td></tr>`)
    .join('')}</table>
</div>`
  const text = rows.map(([k, v]) => `${k}: ${v || '—'}`).join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    // reply_to: al pulsar "Responder" le escribes directamente al cliente
    body: JSON.stringify({ from: FROM, to: [TO], subject: 'Nuevo Cliente', html, text, reply_to: r.correo || undefined }),
  })
  if (!res.ok) {
    console.error('Resend', res.status, await res.text())
    return new Response('Error al enviar el correo', { status: 502 })
  }
  return new Response('Enviado', { status: 200 })
})
