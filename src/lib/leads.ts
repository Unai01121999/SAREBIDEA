// Almacén de clientes (leads). Tres modos, por orden de prioridad:
// 1. Producción: Supabase (si hay VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). El ID SB-0001 lo pone la base de datos.
// 2. Vista previa de claude.ai: base de datos compartida del artifact (`db`).
// 3. Desarrollo local: localStorage, solo para poder probar.
import { supabase } from './supabase'

export type LeadSource = 'web' | 'telefono' | 'presencial' | 'email' | 'otro'
export type LeadStatus = 'nuevo' | 'contactado' | 'cliente' | 'descartado'
export type PaymentStatus = 'pendiente' | 'pagado' | 'atrasado'

export type Lead = {
  id: string
  name: string
  phone: string
  email: string
  businessType: string
  description: string
  source: LeadSource
  status: LeadStatus
  notes?: string
  createdAt: string
  /** ID visible del cliente (SB-0001…). Se asigna al crearlo o, si llega del formulario, al abrir el Área privada. */
  code?: string
  /** Web publicada (URL) y dominio. */
  website?: string
  domain?: string
  /** Fechas de vencimiento en formato AAAA-MM-DD. */
  domainExpiry?: string
  webExpiry?: string
  /** Cuenta: importe en euros y estado del pago. */
  amount?: number | null
  paymentStatus?: PaymentStatus
}

export type LeadInput = Omit<Lead, 'id' | 'createdAt' | 'status'> & { status?: LeadStatus }

export const paymentLabels: Record<PaymentStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  atrasado: 'Atrasado',
}

const CODE_PREFIX = 'SB-'
const codeNumber = (c?: string) => (c?.startsWith(CODE_PREFIX) ? Number(c.slice(CODE_PREFIX.length)) || 0 : 0)
export const formatCode = (n: number) => `${CODE_PREFIX}${String(n).padStart(4, '0')}`
/** Siguiente ID libre a partir de los clientes ya cargados. */
export const nextCode = (leads: Lead[]) => formatCode(Math.max(0, ...leads.map((l) => codeNumber(l.code))) + 1)

/** Días hasta una fecha AAAA-MM-DD (negativo si ya pasó). */
export function daysUntil(date?: string): number | null {
  if (!date) return null
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

export const euros = (n?: number | null) =>
  typeof n === 'number' ? n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 }) : '—'

export const sourceLabels: Record<LeadSource, string> = {
  web: 'Formulario web',
  telefono: 'Teléfono',
  presencial: 'En persona',
  email: 'Email',
  otro: 'Otro',
}

export const statusLabels: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  cliente: 'Cliente',
  descartado: 'Descartado',
}

const COLLECTION = 'leads'
const LOCAL_KEY = 'sarebidea-leads'

type DbDoc = { id: string; data(): Record<string, unknown> | undefined }
type Db = {
  collection(p: string): {
    doc(id?: string): {
      set(d: object): Promise<void>
      update(d: object): Promise<void>
      delete(): Promise<void>
      get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>
    }
    orderBy(f: string, d?: 'asc' | 'desc'): { onSnapshot(n: (s: { docs: DbDoc[] }) => void, e?: (err: { code: string }) => void): () => void }
  }
}
type UserCap = { canEdit(): Promise<boolean> }
type ClaudeWin = { claude?: { use(name: string): Promise<unknown> } }

// --- Supabase: columnas en snake_case ---
const columns: Record<string, string> = {
  businessType: 'business_type',
  createdAt: 'created_at',
  domainExpiry: 'domain_expiry',
  webExpiry: 'web_expiry',
  paymentStatus: 'payment_status',
}
const toRow = (o: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(o)
      .filter(([k, v]) => v !== undefined && k !== 'id')
      // Fechas vacías: null (la columna es de tipo date)
      .map(([k, v]) => [columns[k] ?? k, (k === 'domainExpiry' || k === 'webExpiry') && v === '' ? null : v]),
  )
const fromRow = (r: Record<string, unknown>): Lead => {
  const o: Record<string, unknown> = {}
  const back = Object.fromEntries(Object.entries(columns).map(([a, b]) => [b, a]))
  for (const [k, v] of Object.entries(r)) o[back[k] ?? k] = v === null && k !== 'amount' ? undefined : v
  if (typeof o.amount === 'string') o.amount = Number(o.amount)
  return o as Lead
}

let dbPromise: Promise<Db | null> | null = null
/** Base de datos del artifact, o null si no estamos dentro de claude.ai. */
export function getDb(): Promise<Db | null> {
  const c = (window as unknown as ClaudeWin).claude
  if (!c?.use) return Promise.resolve(null)
  dbPromise ??= (c.use('db') as Promise<Db | null>).catch(() => null)
  return dbPromise
}

/** ¿Puede este visitante ver el Área Privada? En claude.ai: solo editores/propietario. En local: sí (demo). */
export async function canSeePrivate(): Promise<boolean> {
  if (supabase) return true // en producción decide AuthGate (correo + segundo factor)
  const c = (window as unknown as ClaudeWin).claude
  if (!c?.use) return true
  const user = (await c.use('user').catch(() => null)) as UserCap | null
  return user ? user.canEdit() : false
}

export const isHosted = () => !!supabase || !!(window as unknown as ClaudeWin).claude?.use

const readLocal = (): Lead[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as Lead[]
  } catch {
    return []
  }
}
const localListeners = new Set<(l: Lead[]) => void>()
const writeLocal = (leads: Lead[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(leads))
  } catch {
    /* almacenamiento bloqueado: seguimos en memoria */
  }
  localListeners.forEach((fn) => fn(leads))
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** Última lista recibida por watchLeads: sirve para calcular el siguiente ID. */
let latest: Lead[] = []

export async function createLead(input: LeadInput): Promise<void> {
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    // El visitante anónimo solo puede escribir los campos del formulario (lo garantiza la base de datos).
    const row = data.session
      ? toRow({ ...input, status: input.status ?? 'nuevo' })
      : toRow({ name: input.name, phone: input.phone, email: input.email, businessType: input.businessType, description: input.description })
    const { error } = await supabase.from('leads').insert(row)
    if (error) throw error
    return
  }
  const lead: Omit<Lead, 'id'> = { ...input, status: input.status ?? 'nuevo', createdAt: new Date().toISOString() }
  // El formulario público no puede leer la lista; esos clientes reciben su ID al abrir el Área privada.
  if (!lead.code && latest.length) lead.code = nextCode(latest)
  // La base de datos no admite campos sin valor.
  for (const k of Object.keys(lead) as (keyof typeof lead)[]) if (lead[k] === undefined) delete lead[k]
  const db = await getDb()
  if (db) {
    await db.collection(COLLECTION).doc(uid()).set(lead)
    return
  }
  writeLocal([{ ...lead, id: uid() }, ...readLocal()])
}

export async function updateLead(id: string, patch: Partial<Omit<Lead, 'id'>>): Promise<void> {
  patch = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined))
  if (supabase) {
    const { error } = await supabase.from('leads').update(toRow(patch)).eq('id', id)
    if (error) throw error
    return
  }
  const db = await getDb()
  if (db) return db.collection(COLLECTION).doc(id).update(patch)
  writeLocal(readLocal().map((l) => (l.id === id ? { ...l, ...patch } : l)))
}

export async function deleteLead(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
    return
  }
  const db = await getDb()
  if (db) return db.collection(COLLECTION).doc(id).delete()
  writeLocal(readLocal().filter((l) => l.id !== id))
}

/** Suscripción en vivo a todas las solicitudes, más recientes primero. */
export function watchLeads(onLeads: (leads: Lead[]) => void, onError: (code: string) => void): () => void {
  let stop: (() => void) | null = null
  const next = (leads: Lead[]) => {
    latest = leads
    onLeads(leads)
    assignMissingCodes(leads)
  }
  if (supabase) {
    const sb = supabase
    const load = async () => {
      const { data, error } = await sb.from('leads').select('*').order('created_at', { ascending: false })
      if (error) onError(error.code ?? 'error')
      else onLeads(data.map(fromRow))
    }
    load()
    const channel = sb
      .channel('leads-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load)
      .subscribe()
    return () => {
      sb.removeChannel(channel)
    }
  }
  let cancelled = false
  getDb().then((db) => {
    if (cancelled) return
    if (!db) {
      next(readLocal())
      localListeners.add(next)
      stop = () => localListeners.delete(next)
      return
    }
    stop = db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snap) => next(snap.docs.map((d) => ({ ...(d.data() as Omit<Lead, 'id'>), id: d.id }))),
        (e) => onError(e.code),
      )
  })
  return () => {
    cancelled = true
    stop?.()
  }
}

let assigning = false
/** Da un ID a los clientes que aún no lo tienen, por orden de llegada. */
async function assignMissingCodes(leads: Lead[]) {
  const missing = leads.filter((l) => !l.code).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  if (!missing.length || assigning) return
  assigning = true
  try {
    let n = Math.max(0, ...leads.map((l) => codeNumber(l.code)))
    for (const l of missing) await updateLead(l.id, { code: formatCode(++n) })
  } catch {
    /* sin permiso de escritura: se reintentará en la próxima actualización */
  } finally {
    assigning = false
  }
}

export type LeadFormErrors = Partial<Record<'name' | 'phone' | 'email' | 'businessType' | 'description' | 'amount', string>>

/** Validación compartida por el formulario público y el alta manual. */
export function validateLead(v: { name: string; phone: string; email: string; businessType: string; description: string }, opts: { requireAll: boolean }) {
  const e: LeadFormErrors = {}
  if (v.name.trim().length < 3) e.name = 'Escribe el nombre completo.'
  const digits = v.phone.replace(/\D/g, '')
  if (opts.requireAll || v.phone.trim()) {
    if (digits.length < 9) e.phone = 'El teléfono debe tener al menos 9 cifras.'
  }
  if (opts.requireAll || v.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Revisa el correo: falta la @ o el dominio.'
  }
  if (!opts.requireAll && !v.phone.trim() && !v.email.trim()) e.phone = 'Añade al menos un teléfono o un correo.'
  if (opts.requireAll && !v.businessType) e.businessType = 'Elige el tipo de negocio.'
  if (opts.requireAll && v.description.trim().length < 10) e.description = 'Cuéntanos un poco más (mínimo 10 caracteres).'
  return e
}
