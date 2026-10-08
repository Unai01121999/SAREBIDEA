// Etiquetas en español y colores semánticos de cada enumeración del dominio.
import type { ClientStatus, InvoiceConcept, InvoiceStatus, ServiceType, TaskPriority, TaskStatus, Technology, UserRole, WebsiteStatus } from '@/types/domain'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

export const clientStatusLabel: Record<ClientStatus, string> = { ACTIVE: 'Activo', PENDING: 'Pendiente', INACTIVE: 'Inactivo' }
export const clientStatusTone: Record<ClientStatus, Tone> = { ACTIVE: 'success', PENDING: 'warning', INACTIVE: 'neutral' }

export const serviceLabel: Record<ServiceType, string> = {
  WEB_DESIGN: 'Diseño web',
  HOSTING: 'Hosting',
  DOMAIN: 'Dominio',
  MAINTENANCE: 'Mantenimiento',
  SEO: 'SEO',
  ECOMMERCE: 'Tienda online',
}

export const websiteStatusLabel: Record<WebsiteStatus, string> = { DEVELOPMENT: 'Desarrollo', PRODUCTION: 'Producción', PAUSED: 'Pausada', ARCHIVED: 'Archivada' }
export const websiteStatusTone: Record<WebsiteStatus, Tone> = { DEVELOPMENT: 'info', PRODUCTION: 'success', PAUSED: 'warning', ARCHIVED: 'neutral' }

export const technologyLabel: Record<Technology, string> = {
  WORDPRESS: 'WordPress',
  NEXTJS: 'Next.js',
  REACT: 'React',
  SHOPIFY: 'Shopify',
  PRESTASHOP: 'Prestashop',
  WEBFLOW: 'Webflow',
  OTHER: 'Otra',
}

export const invoiceStatusLabel: Record<InvoiceStatus, string> = { PAID: 'Pagada', PENDING: 'Pendiente', OVERDUE: 'Vencida', CANCELLED: 'Cancelada' }
export const invoiceStatusTone: Record<InvoiceStatus, Tone> = { PAID: 'success', PENDING: 'warning', OVERDUE: 'danger', CANCELLED: 'neutral' }

export const conceptLabel: Record<InvoiceConcept, string> = {
  WEB_DEVELOPMENT: 'Desarrollo web',
  HOSTING: 'Hosting',
  DOMAIN: 'Dominio',
  MAINTENANCE: 'Mantenimiento',
  SEO: 'SEO',
  ECOMMERCE: 'Tienda online',
}

export const taskStatusLabel: Record<TaskStatus, string> = { TODO: 'Pendiente', IN_PROGRESS: 'En proceso', REVIEW: 'En revisión', DONE: 'Completada' }
export const priorityLabel: Record<TaskPriority, string> = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente' }
export const priorityTone: Record<TaskPriority, Tone> = { LOW: 'neutral', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger' }

export const roleLabel: Record<UserRole, string> = { OWNER: 'Propietario', ADMIN: 'Administrador', EDITOR: 'Editor', VIEWER: 'Solo lectura' }

export const toneClasses: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/14 text-warning',
  danger: 'bg-destructive/12 text-destructive',
  info: 'bg-info/12 text-info',
  brand: 'bg-brand/12 text-brand',
}

/** Alerta de vencimiento según los días que faltan (dominios y hosting). */
export type ExpiryLevel = 'expired' | 'd7' | 'd15' | 'd30' | 'ok'
export function expiryLevel(days: number | null): ExpiryLevel {
  if (days === null) return 'ok'
  if (days < 0) return 'expired'
  if (days <= 7) return 'd7'
  if (days <= 15) return 'd15'
  if (days <= 30) return 'd30'
  return 'ok'
}
export const expiryLabel: Record<ExpiryLevel, string> = { expired: 'Caducado', d7: 'Caduca en 7 días', d15: 'Caduca en 15 días', d30: 'Caduca en 30 días', ok: 'Vigente' }
export const expiryTone: Record<ExpiryLevel, Tone> = { expired: 'danger', d7: 'danger', d15: 'warning', d30: 'warning', ok: 'success' }
