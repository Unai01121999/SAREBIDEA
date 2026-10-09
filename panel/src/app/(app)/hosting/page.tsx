'use client'

import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DataTable, type Col } from '@/components/data-table/data-table'
import { HostingFormDialog } from '@/components/hosting/hosting-form'
import { PageHeader } from '@/components/layout/page-header'
import { ExpiryBadge } from '@/components/shared/badges'
import { Can } from '@/components/shared/can'
import { RowActions } from '@/components/shared/row-actions'
import { StatStrip } from '@/components/shared/stat-strip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientsApi, hostingsApi, useSettings, websitesApi } from '@/hooks/use-entities'
import { useCreateParam } from '@/hooks/use-create-param'
import { downloadCsv } from '@/lib/csv'
import { daysUntil, formatCurrency, formatDate } from '@/lib/format'
import type { Hosting } from '@/types/domain'
import { routes } from '@/lib/routes'

export default function HostingPage() {
  const router = useRouter()
  const { data: hostings, isLoading } = hostingsApi.useList()
  const { data: clients } = clientsApi.useList()
  const { data: websites } = websitesApi.useList()
  const { data: settings } = useSettings()
  const remove = hostingsApi.useRemove()
  const [provider, setProvider] = useState('ALL')
  const [soonOnly, setSoonOnly] = useState(false)
  const [createOpen, setCreateOpen] = useCreateParam()
  const [editing, setEditing] = useState<Hosting | undefined>()
  const [toDelete, setToDelete] = useState<Hosting | undefined>()

  const clientName = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.company])), [clients])
  const webName = useMemo(() => new Map((websites ?? []).map((w) => [w.id, w.domainName || w.name])), [websites])
  const active = useMemo(() => (hostings ?? []).filter((h) => h.active), [hostings])
  const soon = useMemo(() => active.filter((h) => (daysUntil(h.renewsAt) ?? 999) <= 30), [active])
  const total = active.reduce((a, h) => a + h.annualCost, 0)
  const rows = useMemo(() => (hostings ?? []).filter((h) => (provider === 'ALL' || h.provider === provider) && (!soonOnly || (h.active && (daysUntil(h.renewsAt) ?? 999) <= 30))), [hostings, provider, soonOnly])

  const columns: Col<Hosting>[] = [
    { id: 'client', header: 'Cliente', accessorFn: (h) => clientName.get(h.clientId) ?? '', cell: ({ row }) => <span className="font-medium whitespace-nowrap">{clientName.get(row.original.clientId) ?? '—'}</span> },
    { id: 'web', header: 'Web asociada', accessorFn: (h) => (h.websiteId ? webName.get(h.websiteId) ?? '' : ''), cell: ({ row }) => <span className="text-muted-foreground">{row.original.websiteId ? webName.get(row.original.websiteId) ?? '—' : '—'}</span> },
    { id: 'provider', header: 'Proveedor', accessorFn: (h) => h.provider, cell: ({ row }) => row.original.provider },
    { id: 'plan', header: 'Plan', accessorFn: (h) => h.plan, cell: ({ row }) => row.original.plan },
    { id: 'cost', header: 'Coste anual', accessorFn: (h) => h.annualCost, cell: ({ row }) => <span className="tabular">{formatCurrency(row.original.annualCost)}</span> },
    { id: 'renewsAt', header: 'Renovación', accessorFn: (h) => h.renewsAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.renewsAt)}</span> },
    { id: 'alert', header: 'Vencimiento', accessorFn: (h) => daysUntil(h.renewsAt) ?? 0, cell: ({ row }) => <ExpiryBadge renewsAt={row.original.renewsAt} /> },
    { id: 'active', header: 'Estado', accessorFn: (h) => (h.active ? 1 : 0), cell: ({ row }) => <Badge tone={row.original.active ? 'success' : 'neutral'}>{row.original.active ? 'Activo' : 'Inactivo'}</Badge> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: 'Ver ficha', icon: <Eye />, onSelect: () => router.push(routes.hosting(row.original.id)) },
            { label: 'Editar', icon: <Pencil />, onSelect: () => setEditing(row.original) },
            { label: 'Eliminar', icon: <Trash2 />, destructive: true, separatorBefore: true, onSelect: () => setToDelete(row.original) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Hosting"
        description="Alojamientos contratados para tus clientes."
        crumbs={[{ label: 'Hosting' }]}
        actions={
          <Can module="clients">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Nuevo hosting
            </Button>
          </Can>
        }
      />
      <StatStrip
        stats={[
          { label: 'Hosting activos', value: String(active.length) },
          { label: 'Próximos a renovar', value: String(soon.length), hint: 'En 30 días o menos', tone: soon.length ? 'warning' : 'default', onClick: () => setSoonOnly((v) => !v), active: soonOnly },
          { label: 'Coste total anual', value: formatCurrency(total), hint: 'Solo hosting activos' },
          { label: 'Coste medio', value: formatCurrency(active.length ? total / active.length : 0), hint: 'Por hosting al año' },
        ]}
      />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Buscar por cliente, web, proveedor o plan…"
        searchText={(h) => `${clientName.get(h.clientId) ?? ''} ${h.websiteId ? webName.get(h.websiteId) ?? '' : ''} ${h.provider} ${h.plan}`}
        initialSort={[{ id: 'renewsAt', desc: false }]}
        onRowClick={(h) => router.push(routes.hosting(h.id))}
        onExport={(list) => downloadCsv('hosting.csv', list.map((h) => ({ Cliente: clientName.get(h.clientId) ?? '', Web: h.websiteId ? webName.get(h.websiteId) ?? '' : '', Proveedor: h.provider, Plan: h.plan, CosteAnual: h.annualCost, Renovacion: formatDate(h.renewsAt), Activo: h.active ? 'Sí' : 'No' })))}
        toolbar={
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="h-8 w-52" aria-label="Filtrar por proveedor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los proveedores</SelectItem>
              {(settings?.hostingProviders ?? []).map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No hay hosting con estos filtros"
      />
      <HostingFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <HostingFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} hosting={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title="Eliminar hosting" description="Se eliminará este alojamiento. Esta acción no se puede deshacer." loading={remove.isPending} onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })} />
    </div>
  )
}
