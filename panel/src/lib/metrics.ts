// Cálculos de KPIs y series para los gráficos. Funciones puras: fáciles de testear y de mover al servidor.
import { addMonths, format, isSameMonth, isSameYear, parseISO, startOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { conceptLabel } from '@/lib/labels'
import type { Client, Domain, Hosting, Invoice, InvoiceConcept, Task, Website } from '@/types/domain'
import { daysUntil } from './format'

export const invoiceTotal = (i: Pick<Invoice, 'subtotal' | 'taxRate'>) => Math.round(i.subtotal * (1 + i.taxRate / 100) * 100) / 100
export const invoiceTax = (i: Pick<Invoice, 'subtotal' | 'taxRate'>) => invoiceTotal(i) - i.subtotal

/** Una factura vencida es una pendiente cuya fecha de vencimiento ya pasó (o marcada así a mano). */
export const effectiveStatus = (i: Invoice) => (i.status === 'PENDING' && (daysUntil(i.dueAt) ?? 0) < 0 ? ('OVERDUE' as const) : i.status)

const billed = (i: Invoice) => i.status !== 'CANCELLED'
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

export function revenueSeries(invoices: Invoice[], months = 12, now = new Date()) {
  const start = startOfMonth(subMonths(now, months - 1))
  return Array.from({ length: months }, (_, k) => {
    const m = addMonths(start, k)
    const inMonth = invoices.filter((i) => billed(i) && isSameMonth(parseISO(i.issuedAt), m))
    const paid = sum(inMonth.filter((i) => i.status === 'PAID').map((i) => i.subtotal))
    const open = sum(inMonth.filter((i) => i.status !== 'PAID').map((i) => i.subtotal))
    return { key: format(m, 'yyyy-MM'), label: format(m, 'MMM', { locale: es }), full: format(m, 'MMMM yyyy', { locale: es }), paid: Math.round(paid), open: Math.round(open), total: Math.round(paid + open) }
  })
}

export function billingStats(invoices: Invoice[], now = new Date()) {
  const ok = invoices.filter(billed)
  const thisMonth = sum(ok.filter((i) => isSameMonth(parseISO(i.issuedAt), now)).map((i) => i.subtotal))
  // Comparación justa: el mes en curso solo se compara con el mismo tramo (hasta el mismo día) del mes anterior.
  const prevMonth = sum(ok.filter((i) => isSameMonth(parseISO(i.issuedAt), subMonths(now, 1)) && parseISO(i.issuedAt).getDate() <= now.getDate()).map((i) => i.subtotal))
  const thisYear = sum(ok.filter((i) => isSameYear(parseISO(i.issuedAt), now)).map((i) => i.subtotal))
  const last12 = sum(ok.filter((i) => parseISO(i.issuedAt) >= subMonths(now, 12) && i.recurring).map((i) => i.subtotal))
  const pending = invoices.filter((i) => effectiveStatus(i) === 'PENDING')
  const overdue = invoices.filter((i) => effectiveStatus(i) === 'OVERDUE')
  return {
    thisMonth,
    prevMonth,
    monthDelta: prevMonth ? ((thisMonth - prevMonth) / prevMonth) * 100 : 0,
    thisYear,
    recurringMonthly: last12 / 12,
    pendingCount: pending.length,
    pendingAmount: sum(pending.map((i) => i.subtotal)),
    overdueCount: overdue.length,
    overdueAmount: sum(overdue.map((i) => i.subtotal)),
  }
}

export function billingByClient(invoices: Invoice[], clients: Client[], limit = 8) {
  const byId = new Map<string, number>()
  for (const i of invoices.filter(billed)) byId.set(i.clientId, (byId.get(i.clientId) ?? 0) + i.subtotal)
  return [...byId.entries()]
    .map(([id, total]) => ({ name: clients.find((c) => c.id === id)?.company ?? 'Cliente', total: Math.round(total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

export function billingByConcept(invoices: Invoice[]) {
  const map = new Map<InvoiceConcept, number>()
  for (const i of invoices.filter(billed)) map.set(i.concept, (map.get(i.concept) ?? 0) + i.subtotal)
  return [...map.entries()].map(([concept, total]) => ({ concept, name: conceptLabel[concept], total: Math.round(total) })).sort((a, b) => b.total - a.total)
}

export interface Renewal {
  id: string
  kind: 'domain' | 'hosting'
  label: string
  clientId: string
  renewsAt: string
  days: number
  cost: number
}

/** Próximas renovaciones (incluye las ya caducadas), ordenadas por urgencia. */
export function upcomingRenewals<T extends Domain | Hosting>(rows: T[], kind: 'domain' | 'hosting', withinDays = 60): Renewal[] {
  return rows
    .map((r) => ({
      id: r.id,
      kind,
      label: kind === 'domain' ? (r as Domain).name : `${(r as Hosting).provider} · ${(r as Hosting).plan}`,
      clientId: r.clientId,
      renewsAt: r.renewsAt,
      days: daysUntil(r.renewsAt) ?? 9999,
      cost: r.annualCost,
    }))
    .filter((r) => r.days <= withinDays)
    .sort((a, b) => a.days - b.days)
}

export function dashboardStats(d: { clients: Client[]; websites: Website[]; domains: Domain[]; hostings: Hosting[]; invoices: Invoice[]; tasks: Task[] }) {
  const b = billingStats(d.invoices)
  return {
    clients: d.clients.filter((c) => !c.archived).length,
    activeClients: d.clients.filter((c) => !c.archived && c.status === 'ACTIVE').length,
    webProduction: d.websites.filter((w) => w.status === 'PRODUCTION').length,
    webDevelopment: d.websites.filter((w) => w.status === 'DEVELOPMENT').length,
    webArchived: d.websites.filter((w) => w.status === 'ARCHIVED').length,
    domains: d.domains.length,
    hostingActive: d.hostings.filter((h) => h.active).length,
    hostingCost: sum(d.hostings.filter((h) => h.active).map((h) => h.annualCost)),
    domainsCost: sum(d.domains.map((x) => x.annualCost)),
    ...b,
  }
}
