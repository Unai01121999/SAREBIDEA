import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatCurrency = (n: number, currency = 'EUR', compact = false) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: n % 1 === 0 || compact ? 0 : 2,
    notation: compact && Math.abs(n) >= 10_000 ? 'compact' : 'standard',
  }).format(n)

export const formatNumber = (n: number) => new Intl.NumberFormat('es-ES').format(n)

export const formatDate = (iso?: string | null, pattern = 'd MMM yyyy') => (iso ? format(parseISO(iso), pattern, { locale: es }) : '—')

export const formatDateTime = (iso?: string | null) => (iso ? format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es }) : '—')

export const timeAgo = (iso: string) => formatDistanceToNowStrict(parseISO(iso), { locale: es, addSuffix: true })

/** Días hasta una fecha (negativo si ya pasó). */
export const daysUntil = (iso?: string | null) => (iso ? differenceInCalendarDays(parseISO(iso), new Date()) : null)

/** "2026-10-07" para <input type="date">. */
export const toDateInput = (iso?: string | null) => (iso ? format(parseISO(iso), 'yyyy-MM-dd') : '')
export const fromDateInput = (v: string) => (v ? new Date(`${v}T12:00:00`).toISOString() : '')

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

export const hostname = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
