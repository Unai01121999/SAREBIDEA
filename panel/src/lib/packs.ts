import type { PackType } from '@/types/domain'

/** Packs de venta. Precios sin IVA: el pago único se factura una vez y el mantenimiento es mensual. */
export const PACKS: Record<PackType, { label: string; price: number; maintenance: number }> = {
  STARTER: { label: 'Pack Starter', price: 399, maintenance: 19 },
  PROFESSIONAL: { label: 'Pack Professional', price: 699, maintenance: 29 },
  PREMIUM: { label: 'Pack Premium', price: 1199, maintenance: 49 },
}
export const packLabel = (p?: PackType | null) => (p ? PACKS[p].label : '')
