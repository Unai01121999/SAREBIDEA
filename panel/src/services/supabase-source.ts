// Fuente de datos real: Supabase (PostgreSQL). Cada entidad vive en su tabla; las políticas RLS solo dejan entrar
// a la cuenta administradora con doble factor (is_admin()). Las filas usan snake_case y el panel camelCase.
import { supabase } from '@/lib/supabase'
import { uid } from '@/lib/utils'
import { DEFAULT_SETTINGS } from '@/mocks/generate'
import type { ActivityEntry, AppSettings, EntityMap, EntityName, ServiceType } from '@/types/domain'
import type { DataSource, Repository } from './repository'

const db = () => {
  if (!supabase) throw new Error('Supabase no está configurado')
  return supabase
}

const TABLE: Record<EntityName, string> = { clients: 'clients', websites: 'websites', domains: 'domains', hostings: 'hostings', invoices: 'invoices', tasks: 'tasks', users: 'panel_users' }
const prefixes: Record<EntityName, string> = { clients: 'cli', websites: 'web', domains: 'dom', hostings: 'hos', invoices: 'inv', tasks: 'tsk', users: 'usr' }
const entityOf: Record<EntityName, ActivityEntry['entity']> = { clients: 'client', websites: 'website', domains: 'domain', hostings: 'hosting', invoices: 'invoice', tasks: 'task', users: 'client' }
const NOUN: Record<EntityName, { text: string; feminine: boolean }> = {
  clients: { text: 'Cliente', feminine: false },
  websites: { text: 'Web', feminine: true },
  domains: { text: 'Dominio', feminine: false },
  hostings: { text: 'Hosting', feminine: false },
  invoices: { text: 'Factura', feminine: true },
  tasks: { text: 'Tarea', feminine: true },
  users: { text: 'Usuario', feminine: false },
}

const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
/** Solo se convierten las claves de primer nivel: `formData` y `comments` son JSON y conservan sus claves. */
const mapKeys = (o: Record<string, unknown>, fn: (k: string) => string) => Object.fromEntries(Object.entries(o).map(([k, v]) => [fn(k), v]))
const toRow = (o: object) => mapKeys(o as Record<string, unknown>, snake)
const fromRow = <T,>(r: Record<string, unknown>) => mapKeys(r, camel) as T

function describe(name: EntityName, verb: 'creado' | 'actualizado' | 'eliminado', item: Record<string, unknown>) {
  const label = (item.company as string) ?? (item.name as string) ?? (item.number as string) ?? (item.title as string) ?? (item.plan as string) ?? 'registro'
  const n = NOUN[name]
  return `${n.text} ${n.feminine ? verb.replace(/o$/, 'a') : verb}: ${label}`
}

async function log(name: EntityName, item: { id: string; clientId?: string | null } & Record<string, unknown>, verb: 'creado' | 'actualizado' | 'eliminado') {
  if (name === 'users') return
  await db().from('activity').insert({
    id: uid('act'),
    entity: entityOf[name],
    entity_id: item.id,
    client_id: name === 'clients' ? item.id : (item.clientId ?? null),
    message: describe(name, verb, item),
    actor: 'Unai',
    created_at: new Date().toISOString(),
  })
}

/** Si se crea una web, un dominio, un hosting o una factura de un servicio, el cliente pasa a tenerlo contratado. */
async function ensureClientService(name: EntityName, item: Record<string, unknown>) {
  const map: Partial<Record<EntityName, () => ServiceType | undefined>> = {
    websites: () => 'WEB_DESIGN',
    domains: () => 'DOMAIN',
    hostings: () => 'HOSTING',
    invoices: () => ({ HOSTING: 'HOSTING', DOMAIN: 'DOMAIN', MAINTENANCE: 'MAINTENANCE', SEO: 'SEO', ECOMMERCE: 'ECOMMERCE', WEB_DEVELOPMENT: 'WEB_DESIGN' } as Record<string, ServiceType>)[item.concept as string],
  }
  const service = map[name]?.()
  if (!service || !item.clientId) return
  const { data } = await db().from('clients').select('services').eq('id', item.clientId as string).maybeSingle()
  const services = (data?.services as string[] | undefined) ?? []
  if (data && !services.includes(service)) await db().from('clients').update({ services: [...services, service] }).eq('id', item.clientId as string)
}

function createRepo<K extends EntityName>(name: K): Repository<EntityMap[K]> {
  type T = EntityMap[K]
  const table = TABLE[name]
  return {
    async list() {
      const { data, error } = await db().from(table).select('*').order('created_at', { ascending: false }).limit(5000)
      if (error) throw error
      return (data ?? []).map((r) => fromRow<T>(r))
    },
    async get(id) {
      const { data, error } = await db().from(table).select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data ? fromRow<T>(data) : null
    },
    async create(input) {
      const now = new Date().toISOString()
      const item = { ...input, id: uid(prefixes[name]), createdAt: now, updatedAt: now } as unknown as T
      const { error } = await db().from(table).insert(toRow(item))
      if (error) throw error
      await ensureClientService(name, item as unknown as Record<string, unknown>)
      await log(name, item as never, 'creado')
      return item
    },
    async update(id, patch) {
      const { data, error } = await db().from(table).update(toRow({ ...patch, updatedAt: new Date().toISOString() })).eq('id', id).select('*').single()
      if (error) throw error
      const item = fromRow<T>(data)
      // Reordenar tarjetas del Kanban (solo cambia `position`) no se registra como actividad.
      if (!Object.keys(patch).every((k) => k === 'position')) await log(name, item as never, 'actualizado')
      return item
    },
    async remove(id) {
      const { data } = await db().from(table).select('*').eq('id', id).maybeSingle()
      const { error } = await db().from(table).delete().eq('id', id)
      if (error) throw error
      if (data) await log(name, fromRow(data) as never, 'eliminado')
    },
  }
}

export const supabaseSource: DataSource = {
  kind: 'supabase',
  repo: (name) => createRepo(name),
  activity: {
    async list() {
      const { data, error } = await db().from('activity').select('*').order('created_at', { ascending: false }).limit(120)
      if (error) throw error
      return (data ?? []).map((r) => fromRow<ActivityEntry>(r))
    },
  },
  settings: {
    async get() {
      const { data, error } = await db().from('app_settings').select('data').eq('id', 1).maybeSingle()
      if (error) throw error
      return { ...DEFAULT_SETTINGS, ...((data?.data as Partial<AppSettings>) ?? {}) }
    },
    async update(patch) {
      const next = { ...(await supabaseSource.settings.get()), ...patch }
      const { error } = await db().from('app_settings').upsert({ id: 1, data: next })
      if (error) throw error
      return next
    },
  },
}
