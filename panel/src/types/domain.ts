// Modelos del dominio. Reflejan 1:1 el esquema de Prisma (prisma/schema.prisma).
// Fechas como ISO 8601 (string) para que sean serializables entre servidor y cliente.

export type ISODate = string

export const CLIENT_STATUSES = ['ACTIVE', 'PENDING', 'INACTIVE'] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

export const CLIENT_ORIGINS = ['MANUAL', 'FORM'] as const
export type ClientOrigin = (typeof CLIENT_ORIGINS)[number]

export const SERVICE_TYPES = ['WEB_DESIGN', 'HOSTING', 'DOMAIN', 'MAINTENANCE', 'SEO', 'ECOMMERCE'] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

export const WEBSITE_STATUSES = ['DEVELOPMENT', 'PRODUCTION', 'PAUSED', 'ARCHIVED'] as const
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number]

export const TECHNOLOGIES = ['WORDPRESS', 'NEXTJS', 'REACT', 'SHOPIFY', 'PRESTASHOP', 'WEBFLOW', 'OTHER'] as const
export type Technology = (typeof TECHNOLOGIES)[number]

export const INVOICE_STATUSES = ['PAID', 'PENDING', 'OVERDUE', 'CANCELLED'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const INVOICE_CONCEPTS = ['WEB_DEVELOPMENT', 'HOSTING', 'DOMAIN', 'MAINTENANCE', 'SEO', 'ECOMMERCE'] as const
export type InvoiceConcept = (typeof INVOICE_CONCEPTS)[number]

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const USER_ROLES = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface Client {
  id: string
  company: string
  contactName: string
  email: string
  phone: string
  address: string
  postalCode: string
  province: string
  country: string
  taxId: string
  status: ClientStatus
  services: ServiceType[]
  notes: string
  archived: boolean
  /** Cómo llegó: dado de alta a mano en el panel o a través del formulario de la web. */
  origin: ClientOrigin
  /** Si vino del formulario: ID de la solicitud en la tabla `leads` de Supabase (evita importarla dos veces). */
  sourceId: string | null
  /** Lo que escribió la persona en el formulario (solo origen FORM). */
  formData: ClientFormData | null
  createdAt: ISODate
  updatedAt: ISODate
}

export interface ClientFormData {
  code: string
  businessType: string
  description: string
  submittedAt: ISODate
}

export interface Website {
  id: string
  clientId: string
  name: string
  status: WebsiteStatus
  technology: Technology
  description: string
  domainName: string
  productionUrl: string
  stagingUrl: string
  repoUrl: string
  mainBranch: string
  hostingProvider: string
  startDate: ISODate
  publishDate: ISODate | null
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Domain {
  id: string
  clientId: string
  websiteId: string | null
  name: string
  registrar: string
  registeredAt: ISODate
  renewsAt: ISODate
  annualCost: number
  autoRenew: boolean
  dns: string
  nameservers: string[]
  notes: string
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Hosting {
  id: string
  clientId: string
  websiteId: string | null
  provider: string
  plan: string
  annualCost: number
  contractedAt: ISODate
  renewsAt: ISODate
  active: boolean
  notes: string
  createdAt: ISODate
  updatedAt: ISODate
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  concept: InvoiceConcept
  description: string
  issuedAt: ISODate
  dueAt: ISODate
  /** Base imponible en euros. */
  subtotal: number
  /** IVA en porcentaje (21 = 21 %). */
  taxRate: number
  status: InvoiceStatus
  /** Servicio recurrente (hosting, mantenimiento…): cuenta como ingreso recurrente. */
  recurring: boolean
  /** A qué se refiere la factura (opcionales): permiten ver las facturas de una web, un dominio o un hosting. */
  websiteId: string | null
  domainId: string | null
  hostingId: string | null
  createdAt: ISODate
  updatedAt: ISODate
}

export interface TaskComment {
  id: string
  author: string
  text: string
  createdAt: ISODate
}

export interface Task {
  id: string
  title: string
  description: string
  clientId: string | null
  websiteId: string | null
  priority: TaskPriority
  status: TaskStatus
  labels: string[]
  comments: TaskComment[]
  /** Posición dentro de su columna del Kanban. */
  position: number
  dueAt: ISODate | null
  completedAt: ISODate | null
  createdAt: ISODate
  updatedAt: ISODate
}

export interface ActivityEntry {
  id: string
  entity: 'client' | 'website' | 'domain' | 'hosting' | 'invoice' | 'task'
  entityId: string
  clientId: string | null
  message: string
  actor: string
  createdAt: ISODate
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: ISODate
  updatedAt: ISODate
}

export interface AppSettings {
  company: { name: string; taxId: string; address: string; email: string; phone: string; website: string }
  taxes: { vat: number; irpf: number }
  currency: 'EUR' | 'USD' | 'GBP'
  hostingProviders: string[]
  domainRegistrars: string[]
}

/** Entidades que se gestionan con el repositorio genérico. */
export interface EntityMap {
  clients: Client
  websites: Website
  domains: Domain
  hostings: Hosting
  invoices: Invoice
  tasks: Task
  users: AdminUser
}
export type EntityName = keyof EntityMap

export type NewEntity<T extends { id: string }> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
