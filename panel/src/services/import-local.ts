// Sube a Supabase los datos que había guardado este navegador (modo demostración / antes de conectar la base de datos).
// Es seguro repetirlo: lo que ya existe en la base de datos no se sobrescribe. Las solicitudes del formulario no se duplican
// (se reconocen por su `sourceId` y se enlazan con el cliente que ya creó la base de datos).
import { supabase } from '@/lib/supabase'
import { aFila, COLUMNAS, TABLAS } from './db-schema'
import type { Client, Domain, EntityName, Hosting, Invoice, Task, Website } from '@/types/domain'

const KEY = 'sarebidea-panel-db-v3'
type Local = { clients?: Client[]; websites?: Website[]; domains?: Domain[]; hostings?: Hosting[]; invoices?: Invoice[]; tasks?: Task[] }


export function readLocalData(): Local | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Local) : null
  } catch {
    return null
  }
}

export const localCounts = (d: Local | null) => ({
  clients: d?.clients?.length ?? 0,
  websites: d?.websites?.length ?? 0,
  domains: d?.domains?.length ?? 0,
  hostings: d?.hostings?.length ?? 0,
  invoices: d?.invoices?.length ?? 0,
  tasks: d?.tasks?.length ?? 0,
})

export function discardLocalData() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* sin acceso al almacenamiento */
  }
}

async function insertAll(entity: EntityName, rows: object[]) {
  if (!supabase) throw new Error('Supabase no está configurado')
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from(TABLAS[entity]).upsert(rows.slice(i, i + 200).map((r) => aFila(COLUMNAS[entity], r)), { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw new Error(`${TABLAS[entity]}: ${error.message}`)
  }
}

/** Devuelve cuántos registros se han enviado. */
export async function importLocalData(): Promise<number> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const d = readLocalData()
  if (!d) return 0
  const { data: existing, error } = await supabase.from(TABLAS.clients).select('id, id_origen').not('id_origen', 'is', null)
  if (error) throw new Error(error.message)
  const bySource = new Map((existing ?? []).map((c) => [c.id_origen as string, c.id as string]))
  const remap = new Map<string, string>() // id local -> id en la base de datos
  const newClients: Client[] = []
  for (const c of d.clients ?? []) {
    const dbId = c.sourceId ? bySource.get(c.sourceId) : undefined
    if (dbId) remap.set(c.id, dbId)
    else newClients.push(c)
  }
  const fix = <T extends { clientId?: string | null }>(x: T): T => ({ ...x, clientId: x.clientId ? (remap.get(x.clientId) ?? x.clientId) : x.clientId })
  await insertAll('clients', newClients)
  await insertAll('websites', (d.websites ?? []).map(fix))
  await insertAll('domains', (d.domains ?? []).map(fix))
  await insertAll('hostings', (d.hostings ?? []).map(fix))
  await insertAll('invoices', (d.invoices ?? []).map(fix))
  await insertAll('tasks', (d.tasks ?? []).map(fix))
  return newClients.length + (d.websites?.length ?? 0) + (d.domains?.length ?? 0) + (d.hostings?.length ?? 0) + (d.invoices?.length ?? 0) + (d.tasks?.length ?? 0)
}
