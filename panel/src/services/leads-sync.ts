// Importa al panel las solicitudes del formulario de la web (tabla `leads` de Supabase).
// Cada solicitud nueva se convierte en un cliente con origen «Formulario web». Es idempotente: se identifica por `sourceId`.
// Las solicitudes que se dieron de alta a mano en el visor antiguo (source distinto de «web») entran como «Alta manual».
import { getDb, persistDb } from '@/lib/mock-db'
import { supabase } from '@/lib/supabase'
import { uid } from '@/lib/utils'
import type { Client, ClientStatus } from '@/types/domain'

interface LeadRow {
  id: string
  code: string | null
  name: string
  company?: string | null
  phone: string | null
  email: string | null
  business_type: string | null
  description: string | null
  source: string | null
  status: string | null
  notes: string | null
  website: string | null
  domain: string | null
  created_at: string
}

const statusMap: Record<string, ClientStatus> = { nuevo: 'PENDING', contactado: 'PENDING', cliente: 'ACTIVE', descartado: 'INACTIVE' }

function toClient(l: LeadRow): Client {
  const fromForm = (l.source ?? 'web') === 'web'
  const extra = [l.website && `Web: ${l.website}`, l.domain && `Dominio: ${l.domain}`, l.notes].filter(Boolean).join('\n')
  const now = new Date().toISOString()
  return {
    id: uid('cli'),
    company: l.company?.trim() || l.name,
    contactName: l.name,
    email: l.email ?? '',
    phone: l.phone ?? '',
    address: '',
    postalCode: '',
    province: '',
    country: 'España',
    taxId: '',
    status: statusMap[l.status ?? 'nuevo'] ?? 'PENDING',
    services: [],
    notes: extra,
    archived: false,
    origin: fromForm ? 'FORM' : 'MANUAL',
    sourceId: l.id,
    formData: fromForm ? { code: l.code ?? '', businessType: l.business_type ?? '', description: l.description ?? '', submittedAt: l.created_at } : null,
    createdAt: l.created_at,
    updatedAt: now,
  }
}

/** Devuelve cuántas solicitudes nuevas se han importado. */
export async function syncFormLeads(): Promise<number> {
  if (!supabase) return 0
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: true })
  if (error || !data) return 0
  const db = getDb()
  const known = new Set(db.clients.map((c) => c.sourceId).filter(Boolean))
  const fresh = (data as LeadRow[]).filter((l) => !known.has(l.id))
  for (const l of fresh) {
    const c = toClient(l)
    db.clients.unshift(c)
    db.activity.unshift({ id: uid('act'), entity: 'client', entityId: c.id, clientId: c.id, message: `Nueva solicitud ${c.origin === 'FORM' ? 'del formulario' : 'importada'}: ${c.company}`, actor: 'Formulario web', createdAt: l.created_at })
  }
  if (fresh.length) {
    db.activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    db.activity.length = Math.min(db.activity.length, 120)
    persistDb()
  }
  return fresh.length
}
