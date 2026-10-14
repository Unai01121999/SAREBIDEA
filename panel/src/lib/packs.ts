import type { PackInterest, PackType } from '@/types/domain'

/** Packs de venta. Precios sin IVA: el pago único se factura una vez y el mantenimiento es mensual. */
export const PACKS: Record<PackType, { label: string; price: number; maintenance: number }> = {
  STARTER: { label: 'Pack Starter', price: 399, maintenance: 19 },
  PROFESSIONAL: { label: 'Pack Professional', price: 699, maintenance: 29 },
  PREMIUM: { label: 'Pack Premium', price: 1199, maintenance: 49 },
}
export const packInterestLabel = (p?: PackInterest | null) => (p === 'INDECISO' ? 'No lo tiene claro' : p ? `${PACKS[p].label} · ${PACKS[p].price} € + IVA` : '')
export const packLabel = (p?: PackType | null) => (p ? PACKS[p].label : '')

/**
 * Renovación anual de hosting + dominio (sin IVA). El primer año va incluido en el pack; después se factura cada año,
 * 30 días antes de que venza la renovación del dominio. Premium: «desde 180 €».
 * Los mismos importes están en la función SQL `precio_renovacion` (supabase/migrations/014_…).
 */
export const RENEWAL_PRICES: Record<PackType, number> = { STARTER: 90, PROFESSIONAL: 120, PREMIUM: 180 }
/** Días de antelación con los que se emite la factura de renovación. */
export const RENEWAL_LEAD_DAYS = 30

/** Pack del cliente: el de la primera factura de pack de esa web; si no hay, el de la primera del cliente. */
export function packOfClient(clientId: string, websiteId: string | null | undefined, invoices: { clientId: string; websiteId: string | null; pack?: PackType | null; originId?: string | null; concept: string; status: string; issuedAt: string }[]): PackType | null {
  const firsts = invoices
    .filter((i) => i.clientId === clientId && i.pack && !i.originId && i.concept === 'WEB_DEVELOPMENT' && i.status !== 'CANCELLED')
    .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))
  return (firsts.find((i) => websiteId && i.websiteId === websiteId) ?? firsts[0])?.pack ?? null
}
