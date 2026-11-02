// Supabase Edge Function: recibe el formulario de contacto de la web. Desplegada con verify_jwt desactivado (es pública).
// 1) Campo trampa: si viene relleno es un bot → se responde «ok» sin guardar nada.
// 2) Valida los campos (mismos límites que la tabla `solicitudes`).
// 3) Comprueba el CAPTCHA de Cloudflare Turnstile en el servidor (secreto TURNSTILE_SECRET_KEY) y el dominio desde el que se resolvió.
// 4) Límites: por IP (guardada solo como huella SHA-256) y por correo, y un tope global alto como red de seguridad.
// 5) Guarda la solicitud con la clave de servicio; los disparadores de la base de datos crean el cliente y envían el aviso por correo.
import { createClient } from 'npm:@supabase/supabase-js@2'

const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')
const HOSTS = ['sarebidea.com', 'www.sarebidea.com']
const ORIGINS = ['https://sarebidea.com', 'https://www.sarebidea.com']
const LIMITS = { ipHour: 5, ipDay: 15, emailHour: 3, globalHour: 120 }
const PACKS = ['STARTER', 'PROFESSIONAL', 'PREMIUM', 'INDECISO']

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
  'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
})

async function sha256(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('')
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : '').slice(0, max + 1)

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) })
  if (req.method !== 'POST') return json(405, { error: 'metodo' })
  if (!TURNSTILE_SECRET) {
    console.error('enviar-solicitud: falta el secreto TURNSTILE_SECRET_KEY')
    return json(500, { error: 'config' })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return json(400, { error: 'datos' })

  // 1) Trampa para bots: se finge que todo ha ido bien.
  if (str(body.website, 200)) return json(200, { ok: true })

  // 2) Validación en el servidor
  const v = {
    empresa: str(body.empresa, 120),
    nombre: str(body.nombre, 120),
    telefono: str(body.telefono, 40),
    correo: str(body.correo, 160).toLowerCase(),
    tipo_negocio: str(body.tipo_negocio, 80),
    pack_interes: str(body.pack_interes, 20),
    descripcion: str(body.descripcion, 2000),
  }
  const invalid =
    v.empresa.length < 2 || v.empresa.length > 120 ||
    v.nombre.length < 3 || v.nombre.length > 120 ||
    v.telefono.replace(/\D/g, '').length < 9 || v.telefono.length > 40 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.correo) || v.correo.length > 160 ||
    !v.tipo_negocio || v.tipo_negocio.length > 80 ||
    !PACKS.includes(v.pack_interes) ||
    v.descripcion.length < 10 || v.descripcion.length > 2000
  if (invalid) return json(400, { error: 'datos' })

  // 3) CAPTCHA (Cloudflare Turnstile), comprobado aquí y no en el navegador
  const ip = (req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? '').trim()
  const token = str(body.token, 4096)
  if (!token) return json(400, { error: 'captcha' })
  const form = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token })
  if (ip) form.set('remoteip', ip)
  const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    .then((r) => r.json())
    .catch(() => null)
  if (!check?.success || !HOSTS.includes(check.hostname)) return json(403, { error: 'captcha' })

  // 4) Límites por IP, por correo y global
  const ipHash = await sha256(`sarebidea-formulario:${ip || 'sin-ip'}`)
  const since = (ms: number) => new Date(Date.now() - ms).toISOString()
  const count = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count, error } = await q
    if (error) throw error
    return count ?? 0
  }
  try {
    const [ipHour, ipDay, emailHour, globalHour] = await Promise.all([
      count(admin.from('envios_formulario').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('creado_el', since(3600e3))),
      count(admin.from('envios_formulario').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('creado_el', since(86400e3))),
      count(admin.from('solicitudes').select('id', { count: 'exact', head: true }).eq('correo', v.correo).gte('creado_el', since(3600e3))),
      count(admin.from('envios_formulario').select('id', { count: 'exact', head: true }).gte('creado_el', since(3600e3))),
    ])
    if (ipHour >= LIMITS.ipHour || ipDay >= LIMITS.ipDay || emailHour >= LIMITS.emailHour || globalHour >= LIMITS.globalHour) return json(429, { error: 'limite' })
  } catch (e) {
    console.error('enviar-solicitud: límites', e)
    return json(500, { error: 'servidor' })
  }

  // 5) Guardar
  await admin.from('envios_formulario').insert({ ip_hash: ipHash })
  const { error } = await admin.from('solicitudes').insert(v)
  if (error) {
    console.error('enviar-solicitud: insert', error.message)
    return json(500, { error: 'servidor' })
  }
  // Limpieza: las huellas de IP solo se guardan 2 días.
  await admin.from('envios_formulario').delete().lt('creado_el', since(2 * 86400e3))
  return json(200, { ok: true })
})
