// Sugerencias para no volver a escribir datos: a partir de la ficha del cliente y de lo que ya tiene (webs, dominios,
// hosting) se proponen valores para los formularios nuevos. Son funciones puras; los formularios solo rellenan los
// campos que la persona todavía no ha tocado.
import { toDateInput } from '@/lib/format'
import { conceptLabel } from '@/lib/labels'
import type { Client, Domain, Hosting, InvoiceConcept, Technology, Website } from '@/types/domain'

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

export function domainDefaults(client: Client, web: Website | undefined, ctx: PrefillContext) {
  const name = web?.domainName || guessDomain(client)
  const mine = ctx.domains.filter((d) => d.clientId === client.id)
  const registrar = mostCommon(mine.map((d) => d.registrar))
  return {
    name,
    websiteId: web?.id,
    registrar,
    nameservers: registrar && NAMESERVERS[registrar] ? NAMESERVERS[registrar].join('\n') : undefined,
    // Si ya tiene otros dominios con el mismo registrador, se propone el mismo precio medio.
    annualCost: mine.length ? Math.round((mine.reduce((a, d) => a + d.annualCost, 0) / mine.length) * 100) / 100 : undefined,
  }
}

export function hostingDefaults(client: Client, web: Website | undefined, ctx: PrefillContext) {
  const mine = ctx.hostings.filter((h) => h.clientId === client.id)
  const provider = web?.hostingProvider || mostCommon(mine.map((h) => h.provider))
  const same = mine.find((h) => h.provider === provider)
  return { websiteId: web?.id, provider, plan: same?.plan, annualCost: same?.annualCost }
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

/** Servicios del cliente que se pueden facturar con un clic: hosting y dominios (con su importe) y webs. */
export function billableServices(clientId: string, ctx: PrefillContext): BillableService[] {
  const out: BillableService[] = []
  for (const h of ctx.hostings.filter((x) => x.clientId === clientId))
    out.push({ kind: 'hosting', id: h.id, label: `Hosting ${h.provider} · ${h.plan}`, concept: 'HOSTING', description: `Alojamiento web ${h.provider} ${h.plan}`, subtotal: h.annualCost, recurring: true, websiteId: h.websiteId, domainId: null, hostingId: h.id, dueSuggest: toDateInput(h.renewsAt) })
  for (const d of ctx.domains.filter((x) => x.clientId === clientId))
    out.push({ kind: 'domain', id: d.id, label: `Dominio ${d.name}`, concept: 'DOMAIN', description: `Renovación del dominio ${d.name}`, subtotal: d.annualCost, recurring: true, websiteId: d.websiteId, domainId: d.id, hostingId: null, dueSuggest: toDateInput(d.renewsAt) })
  for (const w of ctx.websites.filter((x) => x.clientId === clientId && x.status !== 'ARCHIVED'))
    out.push({ kind: 'website', id: w.id, label: `Web ${w.domainName || w.name}`, concept: 'WEB_DEVELOPMENT', description: `Diseño y desarrollo de ${w.name}`, subtotal: 0, recurring: false, websiteId: w.id, domainId: null, hostingId: null, dueSuggest: '' })
  return out
}

export const conceptDescription = (concept: InvoiceConcept) => conceptLabel[concept]
