'use client'

import { InvoiceStatusBadge } from '@/components/shared/badges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { invoicesApi } from '@/hooks/use-entities'
import { useCan } from '@/hooks/use-permissions'
import { formatCurrency, formatDate } from '@/lib/format'
import { conceptLabel } from '@/lib/labels'
import { effectiveStatus, invoiceTotal } from '@/lib/metrics'
import type { Invoice } from '@/types/domain'

/** Facturas ligadas a una web, un dominio o un hosting (a través de sus campos websiteId / domainId / hostingId). */
export function RelatedInvoices({ match, action, className }: { match: (i: Invoice) => boolean; action?: React.ReactNode; className?: string }) {
  const canBilling = useCan()('billing', 'read')
  const { data } = invoicesApi.useList()
  const rows = (data ?? []).filter(match).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  const total = rows.filter((i) => i.status !== 'CANCELLED').reduce((a, i) => a + i.subtotal, 0)
  if (!canBilling) return null
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle>Facturas relacionadas</CardTitle>
          <p className="text-[13px] text-muted-foreground">{rows.length ? `${rows.length} ${rows.length === 1 ? 'factura' : 'facturas'} · ${formatCurrency(total)} facturados` : 'Todavía no hay facturas.'}</p>
        </div>
        {action}
      </CardHeader>
      {rows.length > 0 && (
        <CardContent>
          <ul className="-my-2 divide-y">
            {rows.slice(0, 8).map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-28 shrink-0 font-medium tabular">{i.number}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {conceptLabel[i.concept]} · {formatDate(i.issuedAt)}
                </span>
                <span className="w-24 shrink-0 text-right tabular">{formatCurrency(invoiceTotal(i), 'EUR')}</span>
                <InvoiceStatusBadge status={effectiveStatus(i)} />
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
