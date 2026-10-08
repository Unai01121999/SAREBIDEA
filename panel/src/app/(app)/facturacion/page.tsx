'use client'

import { AlertTriangle, CheckCircle2, CircleDollarSign, Clock, Pencil, Plus, Repeat, Trash2, TrendingUp, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Donut } from '@/components/charts/donut'
import { HorizontalBars } from '@/components/charts/horizontal-bars'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { DataTable, type Col } from '@/components/data-table/data-table'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { InvoiceFormDialog } from '@/components/invoices/invoice-form'
import { PageHeader } from '@/components/layout/page-header'
import { InvoiceStatusBadge } from '@/components/shared/badges'
import { RowActions } from '@/components/shared/row-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clientsApi, invoicesApi } from '@/hooks/use-entities'
import { useCreateParam } from '@/hooks/use-create-param'
import { downloadCsv } from '@/lib/csv'
import { formatCurrency, formatDate } from '@/lib/format'
import { conceptLabel, invoiceStatusLabel } from '@/lib/labels'
import { billingByClient, billingByConcept, billingStats, effectiveStatus, invoiceTotal, revenueSeries } from '@/lib/metrics'
import { INVOICE_CONCEPTS, INVOICE_STATUSES, type Invoice, type InvoiceConcept, type InvoiceStatus } from '@/types/domain'

export default function BillingPage() {
  const params = useSearchParams()
  const { data: invoices, isLoading } = invoicesApi.useList()
  const { data: clients } = clientsApi.useList()
  const update = invoicesApi.useUpdate()
  const remove = invoicesApi.useRemove()
  const [createOpen, setCreateOpen] = useCreateParam()
  const [editing, setEditing] = useState<Invoice | undefined>()
  const [toDelete, setToDelete] = useState<Invoice | undefined>()
  const [status, setStatus] = useState<'ALL' | InvoiceStatus>('ALL')
  const [concept, setConcept] = useState<'ALL' | InvoiceConcept>('ALL')

  const clientName = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.company])), [clients])
  const stats = useMemo(() => (invoices ? billingStats(invoices) : null), [invoices])
  const series = useMemo(() => (invoices ? revenueSeries(invoices, 12) : []), [invoices])
  const byClient = useMemo(() => (invoices && clients ? billingByClient(invoices, clients, 8) : []), [invoices, clients])
  const byConcept = useMemo(() => (invoices ? billingByConcept(invoices) : []), [invoices])
  const rows = useMemo(() => (invoices ?? []).filter((i) => (status === 'ALL' || effectiveStatus(i) === status) && (concept === 'ALL' || i.concept === concept)), [invoices, status, concept])

  const columns: Col<Invoice>[] = [
    { id: 'number', header: 'Número', accessorFn: (i) => i.number, cell: ({ row }) => <span className="font-medium tabular">{row.original.number}</span> },
    { id: 'client', header: 'Cliente', accessorFn: (i) => clientName.get(i.clientId) ?? '', cell: ({ row }) => <span className="whitespace-nowrap">{clientName.get(row.original.clientId) ?? '—'}</span> },
    { id: 'concept', header: 'Concepto', accessorFn: (i) => conceptLabel[i.concept], cell: ({ row }) => <div className="max-w-[240px]"><p className="truncate">{conceptLabel[row.original.concept]}</p><p className="truncate text-xs text-muted-foreground">{row.original.description}</p></div> },
    { id: 'issuedAt', header: 'Emisión', accessorFn: (i) => i.issuedAt, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.issuedAt)}</span> },
    { id: 'dueAt', header: 'Vencimiento', accessorFn: (i) => i.dueAt, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.dueAt)}</span> },
    { id: 'amount', header: 'Importe', accessorFn: (i) => invoiceTotal(i), cell: ({ row }) => <div className="text-right"><p className="font-medium tabular">{formatCurrency(invoiceTotal(row.original), 'EUR')}</p><p className="text-xs text-muted-foreground tabular">base {formatCurrency(row.original.subtotal)}</p></div> },
    { id: 'status', header: 'Estado', accessorFn: (i) => effectiveStatus(i), cell: ({ row }) => <InvoiceStatusBadge status={effectiveStatus(row.original)} /> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const i = row.original
        return (
          <RowActions
            actions={[
              ...(i.status !== 'PAID' && i.status !== 'CANCELLED' ? [{ label: 'Marcar como pagada', icon: <CheckCircle2 />, onSelect: () => update.mutate({ id: i.id, patch: { status: 'PAID' as const } }) }] : []),
              { label: 'Editar', icon: <Pencil />, onSelect: () => setEditing(i) },
              ...(i.status !== 'CANCELLED' ? [{ label: 'Cancelar factura', icon: <XCircle />, onSelect: () => update.mutate({ id: i.id, patch: { status: 'CANCELLED' as const } }) }] : []),
              { label: 'Eliminar', icon: <Trash2 />, destructive: true, separatorBefore: true, onSelect: () => setToDelete(i) },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Facturación"
        description="Control financiero: facturas, ingresos y cobros pendientes."
        crumbs={[{ label: 'Facturación' }]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nueva factura
          </Button>
        }
      />

      <section aria-label="Indicadores financieros" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Facturación mensual" value={formatCurrency(stats?.thisMonth ?? 0)} icon={CircleDollarSign} delta={stats?.monthDelta} hint="vs. mismo periodo del mes anterior" loading={isLoading} />
        <KpiCard label="Facturación anual" value={formatCurrency(stats?.thisYear ?? 0)} icon={TrendingUp} accent="success" hint="Base imponible" loading={isLoading} />
        <KpiCard label="Ingresos recurrentes" value={formatCurrency(stats?.recurringMonthly ?? 0)} icon={Repeat} accent="info" hint="Media mensual (12 meses)" loading={isLoading} />
        <KpiCard label="Facturas pendientes" value={String(stats?.pendingCount ?? 0)} icon={Clock} accent="warning" hint={stats ? formatCurrency(stats.pendingAmount) : undefined} loading={isLoading} />
        <KpiCard label="Facturas vencidas" value={String(stats?.overdueCount ?? 0)} icon={AlertTriangle} accent="danger" hint={stats ? formatCurrency(stats.overdueAmount) : undefined} loading={isLoading} />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolución de ingresos</CardTitle>
            <CardDescription>Base imponible mensual, cobrada y pendiente</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[280px]" /> : <RevenueChart data={series} />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reparto por servicios</CardTitle>
            <CardDescription>Facturación total por concepto</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[280px]" /> : <Donut data={byConcept} />}</CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Facturación por cliente</CardTitle>
            <CardDescription>Los 8 clientes con más facturación</CardDescription>
          </CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-[300px]" /> : <HorizontalBars data={byClient} />}</CardContent>
        </Card>
      </section>

      <h2 className="mt-8 mb-3 text-lg font-semibold tracking-tight">Facturas</h2>
      <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)} className="mb-3">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="ALL">Todas</TabsTrigger>
          {INVOICE_STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {invoiceStatusLabel[s]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Buscar por número, cliente o concepto…"
        initialSearch={params.get('q') ?? ''}
        searchText={(i) => `${i.number} ${clientName.get(i.clientId) ?? ''} ${conceptLabel[i.concept]} ${i.description}`}
        initialSort={[{ id: 'issuedAt', desc: true }]}
        onRowClick={(i) => setEditing(i)}
        onExport={(list) => downloadCsv('facturas.csv', list.map((i) => ({ Numero: i.number, Cliente: clientName.get(i.clientId) ?? '', Concepto: conceptLabel[i.concept], Descripcion: i.description, Emision: formatDate(i.issuedAt), Vencimiento: formatDate(i.dueAt), Base: i.subtotal, IVA: i.taxRate, Total: invoiceTotal(i), Estado: invoiceStatusLabel[effectiveStatus(i)] })))}
        toolbar={
          <Select value={concept} onValueChange={(v) => setConcept(v as typeof concept)}>
            <SelectTrigger className="h-8 w-52" aria-label="Filtrar por concepto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los conceptos</SelectItem>
              {INVOICE_CONCEPTS.map((c) => (
                <SelectItem key={c} value={c}>
                  {conceptLabel[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No hay facturas con estos filtros"
      />

      <InvoiceFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <InvoiceFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} invoice={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title={`Eliminar factura ${toDelete?.number ?? ''}`} description="Se eliminará la factura. Si solo quieres anularla, usa «Cancelar factura» para conservar el registro." loading={remove.isPending} onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })} />
    </div>
  )
}
