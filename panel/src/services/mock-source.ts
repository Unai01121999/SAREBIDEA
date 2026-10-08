import { clearDb, getDb, persistDb, resetDb } from '@/lib/mock-db'
import { sleep, uid } from '@/lib/utils'
import type { ActivityEntry, EntityMap, EntityName } from '@/types/domain'
import type { DataSource, Repository } from './repository'

const LATENCY = 90 // ms: permite ver los estados de carga

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

function describe(name: EntityName, verb: 'creado' | 'actualizado' | 'eliminado', item: Record<string, unknown>): string {
  const label = (item.company as string) ?? (item.name as string) ?? (item.number as string) ?? (item.title as string) ?? (item.plan as string) ?? 'registro'
  const n = NOUN[name]
  return `${n.text} ${n.feminine ? verb.replace(/o$/, 'a') : verb}: ${label}`
}

function log(name: EntityName, item: { id: string; clientId?: string | null } & Record<string, unknown>, verb: 'creado' | 'actualizado' | 'eliminado') {
  if (name === 'users') return
  const db = getDb()
  db.activity.unshift({
    id: uid('act'),
    entity: entityOf[name],
    entityId: item.id,
    clientId: name === 'clients' ? item.id : (item.clientId ?? null),
    message: describe(name, verb, item),
    actor: 'Unai',
    createdAt: new Date().toISOString(),
  })
  db.activity.length = Math.min(db.activity.length, 120)
}

/** Borrado en cascada igual que las relaciones onDelete: Cascade de Prisma. */
function cascadeClient(id: string) {
  const db = getDb()
  const webIds = new Set(db.websites.filter((w) => w.clientId === id).map((w) => w.id))
  db.websites = db.websites.filter((w) => w.clientId !== id)
  db.domains = db.domains.filter((d) => d.clientId !== id)
  db.hostings = db.hostings.filter((h) => h.clientId !== id)
  db.invoices = db.invoices.filter((i) => i.clientId !== id)
  db.tasks = db.tasks.filter((t) => t.clientId !== id && !(t.websiteId && webIds.has(t.websiteId)))
}
function cascadeWebsite(id: string) {
  const db = getDb()
  db.domains.forEach((d) => d.websiteId === id && (d.websiteId = null))
  db.hostings.forEach((h) => h.websiteId === id && (h.websiteId = null))
  db.tasks.forEach((t) => t.websiteId === id && (t.websiteId = null))
}

function createRepo<K extends EntityName>(name: K): Repository<EntityMap[K]> {
  type T = EntityMap[K]
  const table = () => getDb()[name] as unknown as T[]
  return {
    async list() {
      await sleep(LATENCY)
      return [...table()]
    },
    async get(id) {
      await sleep(LATENCY / 2)
      return table().find((x) => x.id === id) ?? null
    },
    async create(input) {
      await sleep(LATENCY)
      const now = new Date().toISOString()
      const item = { ...input, id: uid(prefixes[name]), createdAt: now, updatedAt: now } as unknown as T
      table().unshift(item)
      log(name, item as never, 'creado')
      persistDb()
      return item
    },
    async update(id, patch) {
      await sleep(LATENCY)
      const rows = table()
      const i = rows.findIndex((x) => x.id === id)
      if (i < 0) throw new Error('Registro no encontrado')
      rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() } as T
      // Reordenar tarjetas del Kanban (solo cambia `position`) no se registra como actividad.
      if (!Object.keys(patch).every((k) => k === 'position')) log(name, rows[i] as never, 'actualizado')
      persistDb()
      return rows[i]
    },
    async remove(id) {
      await sleep(LATENCY)
      const rows = table()
      const i = rows.findIndex((x) => x.id === id)
      if (i < 0) return
      const [removed] = rows.splice(i, 1)
      if (name === 'clients') cascadeClient(id)
      if (name === 'websites') cascadeWebsite(id)
      log(name, removed as never, 'eliminado')
      persistDb()
    },
  }
}

export const mockSource: DataSource = {
  repo: (name) => createRepo(name),
  activity: {
    async list() {
      await sleep(LATENCY)
      return [...getDb().activity]
    },
  },
  settings: {
    async get() {
      await sleep(LATENCY / 2)
      return getDb().settings
    },
    async update(patch) {
      await sleep(LATENCY)
      const db = getDb()
      db.settings = { ...db.settings, ...patch }
      persistDb()
      return db.settings
    },
  },
  async reset() {
    await sleep(LATENCY)
    resetDb()
  },
  async clear() {
    await sleep(LATENCY)
    clearDb()
  },
}
