// Sugerencias para no volver a escribir datos: a partir de la ficha del cliente y de lo que ya tiene (webs, dominios,
// hosting) se proponen valores para los formularios nuevos. Son funciones puras; los formularios solo rellenan los
// campos que la persona todavía no ha tocado.
import { toDateInput } from '@/lib/format'
import { conceptLabel } from '@/lib/labels'
import { packOfClient, RENEWAL_PRICES } from '@/lib/packs'
import type { Client, Domain, Hosting, Invoice, InvoiceConcept, PackType, Technology, Website } from '@/types/domain'

const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com', 'msn.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'telefonica.net'])

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '')

/** Dominio probable de un cliente: el de su correo (si es propio) o el nombre de la empresa con .com. */
export function guessDomain(client: Pick<Client, 'email' | 'company'>): string {
  const host = client.email.split('@')[1]?.trim().toLowerCase()
  if (host && host.includes('.') && !FREE_MAIL.has(host)) return host
  return `${slugify(client.company)}.com`
}

const mostCommon = <T,>(xs: T[]): T | undefined => {
  const counts = new Map<T, number>()
  xs.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

/** Dirección fiscal en una línea (para mostrarla en facturas y fichas). */
export const fullAddress = (c: Pick<Client, 'address' | 'postalCode' | 'province' | 'country'>) =>
  [c.address, `${c.postalCode} ${c.province}`.trim(), c.country].filter(Boolean).join(', ')

export interface PrefillContext {
  /** Facturas existentes (opcional): permiten saber el pack del cliente y proponer el precio de renovación. */
  invoices?: Invoice[]
  websites: Website[]
  domains: Domain[]
  hostings: Hosting[]
}

export function webDefaults(client: Client, ctx: PrefillContext) {
  const domainName = guessDomain(client)
  const tech: Technology | undefined = mostCommon(ctx.websites.filter((w) => w.clientId === client.id).map((w) => w.technology))
  const provider = mostCommon(ctx.hostings.filter((h) => h.clientId === client.id).map((h) => h.provider)) ?? mostCommon(ctx.websites.filter((w) => w.clientId === client.id).map((w) => w.hostingProvider).filter(Boolean))
  const wish = client.formData?.description ? `Solicitud original: ${client.formData.description}` : ''
  return {
    name: `Web · ${client.company}`,
    technology: tech,
    description: wish,
    domainName,
    productionUrl: `https://${domainName}`,
    stagingUrl: `https://staging.${domainName}`,
    hostingProvider: provider,
  }
}

const NAMESERVERS: Record<string, string[]> = {
  Hostinger: ['ns1.dns-parking.com', 'ns2.dns-parking.com'],
  OVH: ['dns200.anycast.me', 'ns200.anycast.me'],
  Cloudflare: ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
  DonDominio: ['ns1.dondominio.com', 'ns2.dondominio.com'],
  GoDaddy: ['ns55.domaincontrol.com', 'ns56.domaincontrol.com'],
}

/**
 * Pack del cliente: el que ya se le ha facturado (de esa web o, si no, el primero), si no el de su web y, si no, el que eligió en el formulario.
 * Coincide con el criterio de la base de datos (función pack_del_dominio).
 */
export function clientPack(client: Client, ctx: PrefillContext, websiteId?: string | null): PackType | null {
  const billed = packOfClient(client.id, websiteId, ctx.invoices ?? [])
  if (billed) return billed
  const webs = ctx.websites.filter((w) => w.clientId === client.id && w.status !== 'ARCHIVED')
  const web = (websiteId && webs.find((w) => w.id === websiteId)) || webs.find((w) => w.pack)
  if (web?.pack) return web.pack
  return client.packInterest && client.packInterest !== 'INDECISO' ? client.packInterest : null
}

/** Coste anual de un dominio = precio de la renovación de hosting + dominio de su pack (Starter 90 · Professional 120 · Premium 180 €). Sin pack, el valor guardado. */
export function domainAnnualCost(d: Domain, client: Client | undefined, ctx: PrefillContext): number {
  const pack = client ? clientPack(client, ctx, d.websiteId) : packOfClient(d.clientId, d.websiteId, ctx.invoices ?? [])
  return pack ? RENEWAL_PRICES[pack] : d.annualCost
}

export function domainDefaults(client: Client, web: Website | undefined, ctx: PrefillContext) {
  const name = web?.domainName || guessDomain(client)
  const mine = ctx.domains.filter((d) => d.clientId === client.id)
  const registrar = mostCommon(mine.map((d) => d.registrar))
  return {
    name,
    websiteId: web?.id,
    registrar,
    nameservers: registrar && NAMESERVERS[registrar] ? NAMESERVERS[registrar].join('\n') : undefined,
    // Coste anual = renovación de hosting + dominio según su pack (90 / 120 / 180 €).
    annualCost: (() => {
      const pack = clientPack(client, ctx, web?.id)
      return pack ? RENEWAL_PRICES[pack] : 0
    })(),
  }
}

export function hostingDefaults(client: Client, web: Website | undefined, ctx: PrefillContext) {
  const mine = ctx.hostings.filter((h) => h.clientId === client.id)
  const provider = web?.hostingProvider || mostCommon(mine.map((h) => h.provider))
  return { websiteId: web?.id, provider }
}

/** Si el cliente tiene una sola web, se propone esa (para domino, hosting y tareas). */
export const onlyWebOf = (clientId: string, websites: Website[]) => {
  const mine = websites.filter((w) => w.clientId === clientId && w.status !== 'ARCHIVED')
  return mine.length === 1 ? mine[0] : undefined
}

export type BillableService =
  | { kind: 'hosting'; id: string; label: string; concept: InvoiceConcept; description: string; subtotal: number; recurring: true; websiteId: string | null; domainId: null; hostingId: string; dueSuggest: string }
  | { kind: 'domain'; id: string; label: string; concept: InvoiceConcept; description: string; subtotal: number; recurring: true; websiteId: string | null; domainId: string; hostingId: null; dueSuggest: string }
  | { kind: 'website'; id: string; label: string; concept: InvoiceConcept; description: string; subtotal: number; recurring: false; websiteId: string; domainId: null; hostingId: null; dueSuggest: string }

/** Renovación anual de hosting + dominio: importe según el pack del cliente (90 / 120 / 180 €); sin pack conocido, el coste anual del dominio. */
const renewalAmount = (d: Domain, ctx: PrefillContext) => {
  const pack = packOfClient(d.clientId, d.websiteId, ctx.invoices ?? [])
  return pack ? RENEWAL_PRICES[pack] : d.annualCost
}

/** Servicios del cliente que se pueden facturar con un clic: hosting y dominios (con su importe) y webs. */
export function billableServices(clientId: string, ctx: PrefillContext): BillableService[] {
  const out: BillableService[] = []
  for (const h of ctx.hostings.filter((x) => x.clientId === clientId))
    out.push({ kind: 'hosting', id: h.id, label: `Hosting ${h.provider} · ${h.plan}`, concept: 'HOSTING', description: `Alojamiento web ${h.provider} ${h.plan}`, subtotal: h.annualCost, recurring: true, websiteId: h.websiteId, domainId: null, hostingId: h.id, dueSuggest: toDateInput(h.renewsAt) })
  for (const d of ctx.domains.filter((x) => x.clientId === clientId))
    out.push({ kind: 'domain', id: d.id, label: `Dominio ${d.name}`, concept: 'DOMAIN', description: `Renovación de hosting y dominio ${d.name}`, subtotal: renewalAmount(d, ctx), recurring: true, websiteId: d.websiteId, domainId: d.id, hostingId: null, dueSuggest: toDateInput(d.renewsAt) })
  for (const w of ctx.websites.filter((x) => x.clientId === clientId && x.status !== 'ARCHIVED'))
    out.push({ kind: 'website', id: w.id, label: `Web ${w.domainName || w.name}`, concept: 'WEB_DEVELOPMENT', description: `Diseño y desarrollo de ${w.name}`, subtotal: 0, recurring: false, websiteId: w.id, domainId: null, hostingId: null, dueSuggest: '' })
  return out
}

export type InvoiceKind = 'FIRST' | 'MAINTENANCE' | 'RENEWAL'

/**
 * Datos que ya tiene el cliente para proponerlos en una factura nueva: el pack asignado (el ya facturado, el de su web o el que
 * eligió en el formulario), el tipo de factura, la web, el IVA que se le aplicó y, si se factura desde un dominio, su renovación.
 */
export function invoiceDefaults(client: Client, ctx: PrefillContext, serviceKey?: string) {
  const invoices = ctx.invoices ?? []
  const [serviceType, serviceId] = (serviceKey ?? '').split(':')
  const webs = ctx.websites.filter((w) => w.clientId === client.id && w.status !== 'ARCHIVED')
  const domain = serviceType === 'domain' ? ctx.domains.find((d) => d.id === serviceId) : undefined
  const serviceWeb = serviceType === 'website' ? ctx.websites.find((w) => w.id === serviceId) : domain?.websiteId ? ctx.websites.find((w) => w.id === domain.websiteId) : undefined
  const web = serviceWeb ?? (webs.length === 1 ? webs[0] : undefined)

  let pack: PackType | null = null
  let source = ''
  const billed = packOfClient(client.id, web?.id, invoices)
  if (serviceType === 'website' && serviceWeb?.pack) [pack, source] = [serviceWeb.pack, 'el pack de esta web']
  else if (billed) [pack, source] = [billed, 'el pack que ya se le ha facturado']
  else if ((web ?? webs.find((w) => w.pack))?.pack) [pack, source] = [(web ?? webs.find((w) => w.pack))!.pack!, 'el pack de su web']
  else if (client.packInterest && client.packInterest !== 'INDECISO') [pack, source] = [client.packInterest, 'el pack que eligió en el formulario']

  const hasFirst = invoices.some((i) => i.clientId === client.id && i.pack && !i.originId && i.concept === 'WEB_DEVELOPMENT' && i.status !== 'CANCELLED')
  const kind: InvoiceKind = domain ? 'RENEWAL' : hasFirst && serviceType !== 'website' ? 'MAINTENANCE' : 'FIRST'
  const lastTax = [...invoices].filter((i) => i.clientId === client.id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0]?.taxRate
  return { pack, kind, source, websiteId: web?.id, domainId: domain?.id, taxRate: lastTax, dueAt: domain ? toDateInput(domain.renewsAt) : undefined, renewalName: domain?.name }
}

export const conceptDescription = (concept: InvoiceConcept) => conceptLabel[concept]
