// Supabase Edge Function: alta, cambio de rol, restablecimiento de contraseña y baja de usuarios del panel.
// Usa la clave de servicio (inyectada por Supabase) para tocar Authentication, y solo acepta al propietario con doble factor.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handle, HttpError, type PanelUserRow, type Store } from './core.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } })

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const b64 = (s: string) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')))
const must = <T,>(r: { data: T | null; error: { message: string } | null }) => {
  if (r.error) throw new HttpError(500, r.error.message)
  return r.data as T
}

const store: Store = {
  async caller(jwt) {
    const { data, error } = await admin.auth.getUser(jwt) // el servidor de Authentication valida el token
    if (error || !data.user?.email) return null
    let aal = ''
    try {
      aal = String(b64(jwt.split('.')[1]).aal ?? '')
    } catch {
      aal = ''
    }
    return { email: data.user.email, aal }
  },
  async panelUserByEmail(email) {
    return must(await admin.from('panel_users').select('*').ilike('email', email).maybeSingle()) as PanelUserRow | null
  },
  async panelUserById(id) {
    return must(await admin.from('panel_users').select('*').eq('id', id).maybeSingle()) as PanelUserRow | null
  },
  async insertPanelUser(row) {
    must(await admin.from('panel_users').insert(row).select('id').single())
  },
  async updatePanelUser(id, patch) {
    return must(await admin.from('panel_users').update(patch).eq('id', id).select('*').single()) as PanelUserRow
  },
  async deletePanelUser(id) {
    must(await admin.from('panel_users').delete().eq('id', id).select('id'))
  },
  async authCreateOrReset(email, password) {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (!created.error && created.data.user) return { id: created.data.user.id }
    // Ya existía en Authentication: se reutiliza y se le pone la nueva contraseña.
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (error) throw new HttpError(500, error.message)
      const found = data.users.find((u) => u.email?.toLowerCase() === email)
      if (found) {
        const upd = await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true })
        if (upd.error) throw new HttpError(500, upd.error.message)
        return { id: found.id }
      }
      if (data.users.length < 200) break
    }
    throw new HttpError(500, created.error?.message ?? 'No se pudo crear la cuenta')
  },
  async authSetPassword(authId, password) {
    const { error } = await admin.auth.admin.updateUserById(authId, { password })
    if (error) throw new HttpError(500, error.message)
  },
  async authDelete(authId) {
    const { error } = await admin.auth.admin.deleteUser(authId)
    if (error && !/not found/i.test(error.message)) throw new HttpError(500, error.message)
  },
  randomId: () => crypto.randomUUID().replace(/-/g, '').slice(0, 10),
  randomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
    const bytes = crypto.getRandomValues(new Uint8Array(14))
    return Array.from(bytes, (b) => chars[b % chars.length]).join('')
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'Método no permitido' })
  try {
    const body = await req.json().catch(() => ({}))
    return json(200, await handle(store, req.headers.get('Authorization'), body))
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message })
    console.error('manage-panel-users', e)
    return json(500, { error: 'Error inesperado' })
  }
})
