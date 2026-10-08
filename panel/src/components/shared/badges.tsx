import { Badge } from '@/components/ui/badge'
import { daysUntil } from '@/lib/format'
import {
  clientStatusLabel,
  clientStatusTone,
  expiryLabel,
  expiryLevel,
  expiryTone,
  invoiceStatusLabel,
  invoiceStatusTone,
  priorityLabel,
  priorityTone,
  serviceLabel,
  technologyLabel,
  websiteStatusLabel,
  websiteStatusTone,
} from '@/lib/labels'
import type { ClientStatus, InvoiceStatus, ServiceType, TaskPriority, Technology, WebsiteStatus } from '@/types/domain'

export const ClientStatusBadge = ({ status }: { status: ClientStatus }) => <Badge tone={clientStatusTone[status]}>{clientStatusLabel[status]}</Badge>
export const WebsiteStatusBadge = ({ status }: { status: WebsiteStatus }) => <Badge tone={websiteStatusTone[status]}>{websiteStatusLabel[status]}</Badge>
export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => <Badge tone={invoiceStatusTone[status]}>{invoiceStatusLabel[status]}</Badge>
export const PriorityBadge = ({ priority }: { priority: TaskPriority }) => (
  <Badge tone={priorityTone[priority]} dot={false}>
    {priorityLabel[priority]}
  </Badge>
)
export const TechBadge = ({ tech }: { tech: Technology }) => (
  <Badge tone="neutral" dot={false} className="font-normal">
    {technologyLabel[tech]}
  </Badge>
)
export const ServiceChip = ({ service }: { service: ServiceType }) => (
  <Badge tone="brand" dot={false} className="font-normal">
    {serviceLabel[service]}
  </Badge>
)

/** Estado de vencimiento con color según proximidad: 30, 15, 7 días o caducado. */
export function ExpiryBadge({ renewsAt, compact }: { renewsAt: string; compact?: boolean }) {
  const days = daysUntil(renewsAt)
  const level = expiryLevel(days)
  const text = days === null ? '—' : days < 0 ? `Caducó hace ${-days} ${-days === 1 ? 'día' : 'días'}` : days === 0 ? 'Caduca hoy' : `${days} ${days === 1 ? 'día' : 'días'}`
  return (
    <Badge tone={expiryTone[level]} title={expiryLabel[level]}>
      {compact && level === 'ok' ? text : text}
    </Badge>
  )
}
