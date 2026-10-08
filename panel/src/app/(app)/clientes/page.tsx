'use client'

import { Archive, ArchiveRestore, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ClientFormDialog } from '@/components/clients/client-form'
import { DataTable, type Col } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { ClientStatusBadge } from '@/components/shared/badges'
import { RowActions } from '@/components/shared/row-actions'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientsApi, websitesApi } from '@/hooks/use-entities'
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { clientStatusLabel } from '@/lib/labels'
import { CLIENT_STATUSES, type Client } from '@/types/domain'
import { routes } from '@/lib/routes'

export default function ClientsPage() {
  const router = useRouter()
  const { data: clients, isLoading } = clientsApi.useList()
  const { data: websites } = websitesApi.useList()
  const update = clientsApi.useUpdate()
  const remove = clientsApi.useRemove()
  const [status, setStatus] = useState<'ALL' | Client['status']>('ALL')
  const [scope, setScope] = useState<'active' | 'archived' | 'all'>('active')
  const [editing, setEditing] = useState<Client | undefined>()
  const [toDelete, setToDelete] = useState<Client | undefined>()

  const webCount = useMemo(() => {
    const m = new Map<string, number>()
    websites?.forEach((w) => m.set(w.clientId, (m.get(w.clientId) ?? 0) + 1))
    return m
  }, [websites])

  const rows = useMemo(
    () => (clients ?? []).filter((c) => (status === 'ALL' || c.status === status) && (scope === 'all' || (scope === 'archived') === c.archived)),
    [clients, status, scope],
  )

  const columns: Col<Client>[] = [
    {
      id: 'company',
      header: 'Empresa',
      accessorFn: (c) => c.company,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.original.company} />
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.company}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.taxId || 'Sin CIF/NIF'}</p>
          </div>
        </div>
      ),
    },
    { id: 'contact', header: 'Contacto', accessorFn: (c) => c.contactName, cell: ({ row }) => <span className="block max-w-[170px] truncate" title={row.original.contactName}>{row.original.contactName}</span> },
    { id: 'email', header: 'Email', accessorFn: (c) => c.email, cell: ({ row }) => <span className="block max-w-[210px] truncate text-muted-foreground" title={row.original.email}>{row.original.email}</span> },
    { id: 'phone', header: 'Teléfono', accessorFn: (c) => c.phone, cell: ({ row }) => <span className="whitespace-nowrap tabular">{row.original.phone || '—'}</span> },
    { id: 'status', header: 'Estado', accessorFn: (c) => c.status, cell: ({ row }) => <ClientStatusBadge status={row.original.status} /> },
    { id: 'webs', header: 'Webs', accessorFn: (c) => webCount.get(c.id) ?? 0, cell: ({ row }) => <span className="tabular">{webCount.get(row.original.id) ?? 0}</span> },
    { id: 'createdAt', header: 'Alta', accessorFn: (c) => c.createdAt, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const c = row.original
        return (
          <RowActions
            actions={[
              { label: 'Ver ficha', icon: <Eye />, onSelect: () => router.push(routes.client(c.id)) },
              { label: 'Editar', icon: <Pencil />, onSelect: () => setEditing(c) },
              { label: c.archived ? 'Restaurar' : 'Archivar', icon: c.archived ? <ArchiveRestore /> : <Archive />, onSelect: () => update.mutate({ id: c.id, patch: { archived: !c.archived } }) },
              { label: 'Eliminar', icon: <Trash2 />, destructive: true, separatorBefore: true, onSelect: () => setToDelete(c) },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Clientes"
        description={`${clients?.filter((c) => !c.archived).length ?? '…'} clientes en tu cartera.`}
        crumbs={[{ label: 'Clientes' }, { label: 'Listado' }]}
        actions={
          <Button asChild>
            <Link href="/clientes/nuevo">
              <Plus /> Nuevo cliente
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Buscar por empresa, contacto, email, CIF…"
        searchText={(c) => `${c.company} ${c.contactName} ${c.email} ${c.phone} ${c.taxId} ${c.province}`}
        initialSort={[{ id: 'createdAt', desc: true }]}
        onRowClick={(c) => router.push(routes.client(c.id))}
        rowClassName={(c) => (c.archived ? 'opacity-60' : undefined)}
        onExport={(list) =>
          downloadCsv(
            'clientes.csv',
            list.map((c) => ({ Empresa: c.company, Contacto: c.contactName, Email: c.email, Telefono: c.phone, CIF: c.taxId, Direccion: c.address, CP: c.postalCode, Provincia: c.province, Pais: c.country, Estado: clientStatusLabel[c.status], Webs: webCount.get(c.id) ?? 0, Alta: formatDate(c.createdAt) })),
          )
        }
        toolbar={
          <>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-8 w-48" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {clientStatusLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
              <SelectTrigger className="h-8 w-32" aria-label="Archivados">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Vigentes</SelectItem>
                <SelectItem value="archived">Archivados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
        emptyTitle="No hay clientes con estos filtros"
        emptyAction={
          <Button asChild size="sm">
            <Link href="/clientes/nuevo">Crear cliente</Link>
          </Button>
        }
      />

      <ClientFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} client={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title={`Eliminar ${toDelete?.company ?? ''}`}
        description="Se eliminarán también sus webs, dominios, hosting, facturas y tareas. Esta acción no se puede deshacer. Si solo quieres ocultarlo, usa «Archivar»."
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })}
      />
    </div>
  )
}
