'use client'

import { CheckCircle2, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { InvoiceFilesPanel } from '@/components/invoices/invoice-file'
import { InvoiceFormDialog } from '@/components/invoices/invoice-form'
import { PageHeader } from '@/components/layout/page-header'
import { Can } from '@/components/shared/can'
import { InvoiceStatusBadge } from '@/components/shared/badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { clientsApi, invoicesApi, websitesApi } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/format'
import { conceptLabel } from '@/lib/labels'
import { effectiveStatus, invoiceBase, invoiceTax, invoiceTotal } from '@/lib/metrics'
import { packLabel } from '@/lib/packs'
import { routes } from '@/lib/routes'

export default function InvoiceDetailPage() {
  const id = useSearchParams().get('id') ?? ''
  const { data: invoice, isLoading } = invoicesApi.useOne(id)
  const { data: client } = clientsApi.useOne(invoice?.clientId)
  const { data: web } = websitesApi.useOne(invoice?.websiteId ?? undefined)
  const update = invoicesApi.useUpdate()
  const [editing, setEditing] = useState(false)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!invoice)
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-medium">Factura no encontrada</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/facturacion">Volver a facturación</Link>
        </Button>
      </div>
    )
  const status = effectiveStatus(invoice)
  const i = invoice

  return (
    <div className="animate-fade-up">
      <PageHeader
        crumbs={[{ label: 'Facturación', href: '/facturacion' }, ...(client ? [{ label: client.company, href: routes.client(client.id) }] : []), { label: i.number }]}
        title={`Factura ${i.number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={status} />
            <span className="text-muted-foreground">{conceptLabel[i.concept]}</span>
          </span>
        }
        actions={
          <Can module="billing">
            {i.status !== 'PAID' && i.status !== 'CANCELLED' && (
              <Button variant="outline" size="sm" onClick={() => update.mutate({ id: i.id, patch: { status: 'PAID' } })}>
                <CheckCircle2 /> Marcar como pagada
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Editar
            </Button>
          </Can>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la factura</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Row label="Cliente">{client ? <Link href={routes.client(client.id)} className="hover:text-brand hover:underline">{client.company}</Link> : '—'}</Row>
              <Row label="Web">{web ? <Link href={routes.website(web.id)} className="hover:text-brand hover:underline">{web.name}</Link> : '—'}</Row>
              <Row label="Concepto">{conceptLabel[i.concept]}</Row>
              <Row label="Pack">{i.pack ? packLabel(i.pack) : '—'}</Row>
              <Row label="Fecha de emisión">{formatDate(i.issuedAt)}</Row>
              <Row label="Fecha de vencimiento">{formatDate(i.dueAt)}</Row>
              <Row label="Descripción" className="sm:col-span-2">
                <span className="font-normal text-muted-foreground">{i.description || '—'}</span>
              </Row>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Importes</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <Line label={i.pack ? 'Base imponible (pack)' : 'Base imponible'} value={formatCurrency(i.subtotal, 'EUR')} />
              {!!i.maintenance && <Line label="Mantenimiento" value={formatCurrency(i.maintenance, 'EUR')} />}
              {!!i.maintenance && <Line label="Base imponible total" value={formatCurrency(invoiceBase(i), 'EUR')} muted />}
              <Line label={`IVA (${i.taxRate} %)`} value={formatCurrency(invoiceTax(i), 'EUR')} />
              <div className="flex items-center justify-between border-t pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="text-lg font-semibold tracking-tight tabular">{formatCurrency(invoiceTotal(i), 'EUR')}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4">
        <InvoiceFilesPanel invoice={i} />
      </div>
      <InvoiceFormDialog open={editing} onOpenChange={setEditing} invoice={i} />
    </div>
  )
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words">{children}</dd>
    </div>
  )
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? 'text-muted-foreground' : ''}`}>
      <dt>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  )
}
