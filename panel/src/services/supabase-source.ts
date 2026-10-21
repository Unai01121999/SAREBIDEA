// Fuente de datos real: Supabase (PostgreSQL). Cada entidad vive en su tabla; las políticas RLS solo dejan entrar
// según su rol (políticas RLS). Los nombres de tablas y columnas están en español (ver db-schema.ts).
import { supabase } from '@/lib/supabase'
import { uid } from '@/lib/utils'
import { DEFAULT_SETTINGS } from '@/mocks/generate'
import type { ActivityEntry, AppSettings, EntityMap, EntityName, ServiceType } from '@/types/domain'
import { aFila, COLUMNAS, COLUMNAS_ACTIVIDAD, desdeFila, TABLA_ACTIVIDAD, TABLA_AJUSTES, TABLAS } from './db-schema'
import type { DataSource, Repository } from './repository'

const db = () => {
  if (!supabase) throw new Error('Supabase no está configurado')
  return supabase
}

const PAGE = 1000
const prefixes: Record<EntityName, string> = { clients: 'cli', websites: 'web', domains: 'dom', hostings: 'hos', invoices: 'inv', tasks: 'tsk', users: 'usr' }
// El historial (tabla `activity`) lo escribe la propia base de datos con disparadores, con el nombre de quien hace el cambio.

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
  // Atómico en la base de datos: dos altas a la vez no se pisan la lista de servicios.
  await db().rpc('anadir_servicio_cliente', { p_cliente: item.clientId as string, p_servicio: service })
}

function createRepo<K extends EntityName>(name: K): Repository<EntityMap[K]> {
  type T = EntityMap[K]
  const table = TABLAS[name]
  const cols = COLUMNAS[name]
  const fromRow = (r: Record<string, unknown>) => desdeFila<T>(cols, r)
  const toRow = (o: object) => aFila(cols, o)
  return {
    async list() {
      // Por páginas de 1000 (el máximo que devuelve Supabase por consulta), sin tope total.
      const rows: Record<string, unknown>[] = []
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db().from(table).select('*').order('creado_el', { ascending: false }).order('id').range(from, from + PAGE - 1)
        if (error) throw error
        rows.push(...(data ?? []))
        if (!data || data.length < PAGE) break
      }
      return rows.map((r) => fromRow(r))
    },
    async get(id) {
      const { data, error } = await db().from(table).select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return data ? fromRow(data) : null
    },
    async create(input) {
      const now = new Date().toISOString()
      const draft = { ...input, id: uid(prefixes[name]), createdAt: now, updatedAt: now }
      // Se devuelve la fila guardada: la base de datos puede completar datos (p. ej. el número de factura).
      const { data, error } = await db().from(table).insert(toRow(draft)).select('*').single()
      if (error) throw error
      const item = fromRow(data)
      await ensureClientService(name, item as unknown as Record<string, unknown>)
      return item
    },
    async update(id, patch) {
      const { data, error } = await db().from(table).update(toRow({ ...patch, updatedAt: new Date().toISOString() })).eq('id', id).select('*').single()
      if (error) throw error
      const item = fromRow(data)
      return item
    },
    async remove(id) {
      const { error } = await db().from(table).delete().eq('id', id)
      if (error) throw error
    },
  }
}

export const supabaseSource: DataSource = {
  kind: 'supabase',
  repo: (name) => createRepo(name),
  activity: {
    async list() {
      const { data, error } = await db().from(TABLA_ACTIVIDAD).select('*').order('creado_el', { ascending: false }).limit(120)
      if (error) throw error
      return (data ?? []).map((r) => desdeFila<ActivityEntry>(COLUMNAS_ACTIVIDAD, r))
    },
  },
  settings: {
    async get() {
      const { data, error } = await db().from(TABLA_AJUSTES).select('datos').eq('id', 1).maybeSingle()
      if (error) throw error
      const saved = (data?.datos as Partial<AppSettings>) ?? {}
      // La empresa se mezcla campo a campo: los ajustes guardados antes de añadir un campo no lo traen.
      return { ...DEFAULT_SETTINGS, ...saved, company: { ...DEFAULT_SETTINGS.company, ...(saved.company ?? {}) } }
    },
    async update(patch) {
      // Solo se envía lo que cambia y la base de datos lo mezcla: dos personas guardando a la vez no se pisan.
      const { error } = await db().rpc('actualizar_ajustes', { p_cambios: patch })
      if (error) throw error
      return supabaseSource.settings.get()
    },
  },
}
