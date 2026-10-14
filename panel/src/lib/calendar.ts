// Calendario de acciones: convierte lo que ya existe en el panel (altas de webs y dominios, renovaciones, facturas, tareas…)
// en eventos con fecha. Además de lo ya ocurrido calcula lo previsto: las facturas mensuales de mantenimiento, la renovación
// anual de hosting + dominio y su factura (30 días antes). Funciones puras: no tocan la base de datos.
import { addDays, addMonths, addYears, format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns'
import { RENEWAL_LEAD_DAYS, RENEWAL_PRICES, PACKS, packOfClient } from '@/lib/packs'
import { routes } from '@/lib/routes'
import type { Client, Domain, Hosting, Invoice, Task, Website } from '@/types/domain'

export type CalendarCategory = 'client' | 'web' | 'domain' | 'renewal' | 'invoice' | 'maintenance' | 'task'

export const CATEGORIES: { key: CalendarCategory; label: string; dot: string; chip: string }[] = [
  { key: 'client', label: 'Clientes', dot: 'bg-slate-500', chip: 'bg-slate-500/12 text-slate-700 dark:text-slate-300' },
  { key: 'web', label: 'Webs', dot: 'bg-blue-500', chip: 'bg-blue-500/12 text-blue-700 dark:text-blue-300' },
  { key: 'domain', label: 'Dominios y hosting', dot: 'bg-violet-500', chip: 'bg-violet-500/12 text-violet-700 dark:text-violet-300' },
  { key: 'renewal', label: 'Renovaciones', dot: 'bg-amber-500', chip: 'bg-amber-500/15 text-amber-800 dark:text-amber-300' },
  { key: 'invoice', label: 'Facturas', dot: 'bg-emerald-500', chip: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  { key: 'maintenance', label: 'Mantenimiento', dot: 'bg-cyan-500', chip: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300' },
  { key: 'task', label: 'Tareas', dot: 'bg-rose-500', chip: 'bg-rose-500/12 text-rose-700 dark:text-rose-300' },
]

export interface CalendarEvent {
  id: string
  /** Día (aaaa-mm-dd, hora local). */
  day: string
  category: CalendarCategory
  title: string
  detail?: string
  href?: string
  /** Previsto (aún no ha ocurrido ni existe): se dibuja con trazo discontinuo. */
  planned: boolean
}

export interface CalendarData {
  clients: Client[]
  websites: Website[]
  domains: Domain[]
  hostings: Hosting[]
  invoices: Invoice[]
  tasks: Task[]
  /** Si la persona no puede ver facturación no se muestran las facturas. */
  showInvoices: boolean
}

export const dayKey = (d: Date | string) => format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd')
const euro = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n)

/** Eventos entre `from` y `to` (ambos incluidos). */
export function buildEvents(data: CalendarData, from: Date, to: Date): CalendarEvent[] {
  const out: CalendarEvent[] = []
  const today = startOfDay(new Date())
  const inRange = (d: Date) => !isBefore(d, startOfDay(from)) && !isAfter(d, to)
  const add = (e: Omit<CalendarEvent, 'day' | 'planned'> & { date: Date; planned?: boolean }) => {
    if (inRange(e.date)) out.push({ ...e, day: dayKey(e.date), planned: e.planned ?? isAfter(startOfDay(e.date), today) })
  }
  const client = (id: string) => data.clients.find((c) => c.id === id)?.company ?? ''

  for (const c of data.clients) add({ id: `c-${c.id}`, date: parseISO(c.createdAt), category: 'client', title: `Alta de cliente · ${c.company}`, href: routes.client(c.id) })

  for (const w of data.websites) {
    add({ id: `w-${w.id}`, date: parseISO(w.startDate), category: 'web', title: `Alta de web · ${w.name}`, detail: client(w.clientId), href: routes.website(w.id) })
    if (w.publishDate) add({ id: `wp-${w.id}`, date: parseISO(w.publishDate), category: 'web', title: `Web publicada · ${w.name}`, detail: client(w.clientId), href: routes.website(w.id) })
  }

  for (const h of data.hostings) {
    add({ id: `h-${h.id}`, date: parseISO(h.contractedAt), category: 'domain', title: `Hosting contratado · ${h.provider}`, detail: client(h.clientId), href: routes.hosting(h.id) })
  }

  const billingInvoices = data.showInvoices ? data.invoices : []
  for (const d of data.domains) {
    add({ id: `d-${d.id}`, date: parseISO(d.registeredAt), category: 'domain', title: `Dominio registrado · ${d.name}`, detail: client(d.clientId), href: routes.domain(d.id) })
    // Renovación anual de hosting + dominio: la fecha guardada y sus aniversarios siguientes (el primer año va incluido en el pack).
    const first = parseISO(d.renewsAt)
    const pack = packOfClient(d.clientId, d.websiteId, data.invoices)
    for (let k = 0; k <= 10; k++) {
      const date = addYears(first, k)
      if (isAfter(startOfDay(date), addDays(to, RENEWAL_LEAD_DAYS))) break
      const key = format(date, 'yyyy-MM-dd')
      add({ id: `dr-${d.id}-${k}`, date, category: 'renewal', title: `Renovación de hosting y dominio · ${d.name}`, detail: client(d.clientId), href: routes.domain(d.id) })
      if (!data.showInvoices) continue
      const issued = addDays(date, -RENEWAL_LEAD_DAYS)
      const exists = billingInvoices.some((i) => i.domainId === d.id && i.concept === 'DOMAIN' && i.renewalOf === key)
      if (!exists && !isBefore(startOfDay(date), today)) {
        const amount = pack ? RENEWAL_PRICES[pack] : d.annualCost
        add({ id: `drf-${d.id}-${k}`, date: isBefore(issued, today) ? today : issued, category: 'renewal', title: `Se emite la factura de renovación · ${d.name}`, detail: `${client(d.clientId)} · ${amount ? `${euro(amount)} + IVA` : 'sin importe'}`, href: routes.domain(d.id), planned: true })
      }
    }
  }

  for (const t of data.tasks) if (t.dueAt && t.status !== 'DONE') add({ id: `t-${t.id}`, date: parseISO(t.dueAt), category: 'task', title: `Tarea · ${t.title}`, detail: t.clientId ? client(t.clientId) : undefined, href: '/tareas' })

  if (data.showInvoices) {
    for (const i of data.invoices) {
      if (i.status === 'CANCELLED') continue
      const isRenewal = i.concept === 'DOMAIN' && !!i.renewalOf
      const isMaintenance = i.concept === 'MAINTENANCE'
      const category: CalendarCategory = isMaintenance ? 'maintenance' : isRenewal ? 'renewal' : 'invoice'
      const kind = isMaintenance ? 'Factura de mantenimiento' : isRenewal ? 'Factura de renovación de hosting y dominio' : 'Factura'
      add({ id: `i-${i.id}`, date: parseISO(i.issuedAt), category, title: `${kind} · ${i.number}`, detail: `${client(i.clientId)}${i.status === 'PAID' ? ' · pagada' : ''}`, href: routes.invoice(i.id), planned: false })
    }
    // Facturas mensuales de mantenimiento que aún no existen: el mismo día de cada mes en que se emitió la primera factura del pack.
    for (const first of data.invoices) {
      if (!first.pack || !first.maintenance || first.originId || first.concept !== 'WEB_DEVELOPMENT' || first.status === 'CANCELLED') continue
      const exist = new Set(data.invoices.filter((i) => i.originId === first.id).map((i) => format(parseISO(i.issuedAt), 'yyyy-MM')))
      const base = parseISO(first.issuedAt)
      for (let k = 1; k <= 60; k++) {
        const date = addMonths(base, k)
        if (isAfter(date, to)) break
        if (isBefore(startOfDay(date), today) || exist.has(format(date, 'yyyy-MM'))) continue
        add({ id: `im-${first.id}-${k}`, date, category: 'maintenance', title: `Se emite la factura de mantenimiento · ${PACKS[first.pack].label}`, detail: `${client(first.clientId)} · ${euro(first.maintenance)}/mes + IVA`, href: routes.invoice(first.id), planned: true })
      }
    }
  }
  return out.sort((a, b) => a.day.localeCompare(b.day) || a.title.localeCompare(b.title))
}
