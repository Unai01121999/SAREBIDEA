'use client'

import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DataTable, type Col } from '@/components/data-table/data-table'
import { DomainFormDialog } from '@/components/domains/domain-form'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { ExpiryBadge } from '@/components/shared/badges'
import { RowActions } from '@/components/shared/row-actions'
import { StatStrip } from '@/components/shared/stat-strip'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientsApi, domainsApi, useSettings } from '@/hooks/use-entities'
import { useCreateParam } from '@/hooks/use-create-param'
import { downloadCsv } from '@/lib/csv'
import { daysUntil, formatCurrency, formatDate } from '@/lib/format'
import { expiryLabel, expiryLevel, type ExpiryLevel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { Domain } from '@/types/domain'
import { routes } from '@/lib/routes'

const levelOf = (d: Domain) => expiryLevel(daysUntil(d.renewsAt))
const rowTint: Record<ExpiryLevel, string> = {
  expired: 'bg-destructive/[0.06] hover:bg-destructive/10',
  d7: 'bg-destructive/[0.04] hover:bg-destructive/[0.08]',
  d15: 'bg-warning/[0.06] hover:bg-warning/10',
  d30: 'bg-warning/[0.03] hover:bg-warning/[0.07]',
  ok: '',
}

export default function DomainsPage() {
  const router = useRouter()
  const { data: domains, isLoading } = domainsApi.useList()
  const { data: clients } = clientsApi.useList()
  const { data: settings } = useSettings()
  const remove = domainsApi.useRemove()
  const [level, setLevel] = useState<'ALL' | ExpiryLevel>('ALL')
  const [registrar, setRegistrar] = useState('ALL')
  const [createOpen, setCreateOpen] = useCreateParam()
  const [editing, setEditing] = useState<Domain | undefined>()
  const [toDelete, setToDelete] = useState<Domain | undefined>()

  const clientName = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.company])), [clients])
  const counts = useMemo(() => {
    const c: Record<ExpiryLevel, number> = { expired: 0, d7: 0, d15: 0, d30: 0, ok: 0 }
    domains?.forEach((d) => c[levelOf(d)]++)
    return c
  }, [domains])
  const rows = useMemo(() => (domains ?? []).filter((d) => (level === 'ALL' || levelOf(d) === level) && (registrar === 'ALL' || d.registrar === registrar)), [domains, level, registrar])
  const toggle = (l: ExpiryLevel) => setLevel((cur) => (cur === l ? 'ALL' : l))

  const columns: Col<Domain>[] = [
    { id: 'name', header: 'Dominio', accessorFn: (d) => d.name, cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { id: 'client', header: 'Cliente', accessorFn: (d) => clientName.get(d.clientId) ?? '', cell: ({ row }) => <span className="whitespace-nowrap">{clientName.get(row.original.clientId) ?? '—'}</span> },
    { id: 'registrar', header: 'Registrador', accessorFn: (d) => d.registrar, cell: ({ row }) => row.original.registrar },
    { id: 'registeredAt', header: 'Registro', accessorFn: (d) => d.registeredAt, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.registeredAt)}</span> },
    { id: 'renewsAt', header: 'Renovación', accessorFn: (d) => d.renewsAt, cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.renewsAt)}</span> },
    { id: 'alert', header: 'Vencimiento', accessorFn: (d) => daysUntil(d.renewsAt) ?? 0, cell: ({ row }) => <ExpiryBadge renewsAt={row.original.renewsAt} /> },
    { id: 'cost', header: 'Coste anual', accessorFn: (d) => d.annualCost, cell: ({ row }) => <span className="tabular">{formatCurrency(row.original.annualCost)}</span> },
    { id: 'auto', header: 'Auto renovación', accessorFn: (d) => (d.autoRenew ? 1 : 0), cell: ({ row }) => <Badge tone={row.original.autoRenew ? 'success' : 'neutral'}>{row.original.autoRenew ? 'Sí' : 'No'}</Badge> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <RowActions
          actions={[
            { label: 'Ver ficha', icon: <Eye />, onSelect: () => router.push(routes.domain(row.original.id)) },
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
        title="Dominios"
        description="Control de todos los dominios y de sus renovaciones."
        crumbs={[{ label: 'Dominios' }]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nuevo dominio
          </Button>
        }
      />
      <StatStrip
        stats={[
          { label: 'Caducados', value: String(counts.expired), tone: counts.expired ? 'danger' : 'default', onClick: () => toggle('expired'), active: level === 'expired' },
          { label: 'Caducan en 7 días', value: String(counts.d7), tone: counts.d7 ? 'danger' : 'default', onClick: () => toggle('d7'), active: level === 'd7' },
          { label: 'Caducan en 15 días', value: String(counts.d15), tone: counts.d15 ? 'warning' : 'default', onClick: () => toggle('d15'), active: level === 'd15' },
          { label: 'Caducan en 30 días', value: String(counts.d30), tone: counts.d30 ? 'warning' : 'default', onClick: () => toggle('d30'), active: level === 'd30' },
        ]}
      />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Buscar por dominio, cliente o registrador…"
        searchText={(d) => `${d.name} ${clientName.get(d.clientId) ?? ''} ${d.registrar}`}
        initialSort={[{ id: 'renewsAt', desc: false }]}
        onRowClick={(d) => router.push(routes.domain(d.id))}
        rowClassName={(d) => cn('transition-colors', rowTint[levelOf(d)])}
        onExport={(list) => downloadCsv('dominios.csv', list.map((d) => ({ Dominio: d.name, Cliente: clientName.get(d.clientId) ?? '', Registrador: d.registrar, Registro: formatDate(d.registeredAt), Renovacion: formatDate(d.renewsAt), Estado: expiryLabel[levelOf(d)], Coste: d.annualCost, AutoRenovacion: d.autoRenew ? 'Sí' : 'No' })))}
        toolbar={
          <>
            <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
              <SelectTrigger className="h-8 w-56" aria-label="Filtrar por vencimiento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los vencimientos</SelectItem>
                {(['expired', 'd7', 'd15', 'd30', 'ok'] as ExpiryLevel[]).map((l) => (
                  <SelectItem key={l} value={l}>
                    {expiryLabel[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={registrar} onValueChange={setRegistrar}>
              <SelectTrigger className="h-8 w-56" aria-label="Filtrar por registrador">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los registradores</SelectItem>
                {(settings?.domainRegistrars ?? []).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="No hay dominios con estos filtros"
        emptyAction={
          <Button size="sm" variant="outline" asChild>
            <Link href="/dominios">Quitar filtros</Link>
          </Button>
        }
      />
      <DomainFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DomainFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} domain={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title={`Eliminar ${toDelete?.name ?? ''}`} description="Se eliminará el dominio y su historial de renovaciones. Esta acción no se puede deshacer." loading={remove.isPending} onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })} />
    </div>
  )
}
