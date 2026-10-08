'use client'

import { Archive, Eye, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DataTable, type Col } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { TechBadge, WebsiteStatusBadge } from '@/components/shared/badges'
import { RowActions } from '@/components/shared/row-actions'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WebsiteFormDialog } from '@/components/websites/website-form'
import { clientsApi, websitesApi } from '@/hooks/use-entities'
import { useCreateParam } from '@/hooks/use-create-param'
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { technologyLabel, websiteStatusLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { TECHNOLOGIES, type Technology, type Website, type WebsiteStatus } from '@/types/domain'
import { routes } from '@/lib/routes'

const VIEWS: Record<string, { label: string; status: WebsiteStatus | null }> = {
  produccion: { label: 'Producción', status: 'PRODUCTION' },
  desarrollo: { label: 'Desarrollo', status: 'DEVELOPMENT' },
  pausadas: { label: 'Pausadas', status: 'PAUSED' },
  archivadas: { label: 'Archivadas', status: 'ARCHIVED' },
  todas: { label: 'Todas', status: null },
}

export function WebsitesView({ estado }: { estado: string }) {
  const view = VIEWS[estado] ?? VIEWS.produccion
  const router = useRouter()
  const { data: websites, isLoading } = websitesApi.useList()
  const { data: clients } = clientsApi.useList()
  const update = websitesApi.useUpdate()
  const remove = websitesApi.useRemove()
  const [tech, setTech] = useState<'ALL' | Technology>('ALL')
  const [createOpen, setCreateOpen] = useCreateParam()
  const [editing, setEditing] = useState<Website | undefined>()
  const [toDelete, setToDelete] = useState<Website | undefined>()

  const clientName = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.company])), [clients])
  const counts = useMemo(() => {
    const m: Record<string, number> = { todas: websites?.length ?? 0 }
    for (const [k, v] of Object.entries(VIEWS)) if (v.status) m[k] = websites?.filter((w) => w.status === v.status).length ?? 0
    return m
  }, [websites])
  const rows = useMemo(() => (websites ?? []).filter((w) => (!view.status || w.status === view.status) && (tech === 'ALL' || w.technology === tech)), [websites, view.status, tech])

  const columns: Col<Website>[] = [
    {
      id: 'name',
      header: 'Proyecto',
      accessorFn: (w) => w.name,
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[280px]">
          <p className="truncate font-medium">{row.original.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.domainName || 'Sin dominio'}</p>
        </div>
      ),
    },
    { id: 'client', header: 'Cliente', accessorFn: (w) => clientName.get(w.clientId) ?? '', cell: ({ row }) => <Link href={routes.client(row.original.clientId)} onClick={(e) => e.stopPropagation()} className="whitespace-nowrap hover:text-brand hover:underline">{clientName.get(row.original.clientId) ?? '—'}</Link> },
    {
      id: 'url',
      header: 'URL',
      accessorFn: (w) => w.productionUrl,
      cell: ({ row }) =>
        row.original.productionUrl ? (
          <a href={row.original.productionUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-brand hover:underline">
            {row.original.domainName} <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">Sin publicar</span>
        ),
    },
    { id: 'status', header: 'Estado', accessorFn: (w) => w.status, cell: ({ row }) => <WebsiteStatusBadge status={row.original.status} /> },
    { id: 'tech', header: 'Tecnología', accessorFn: (w) => technologyLabel[w.technology], cell: ({ row }) => <TechBadge tech={row.original.technology} /> },
    { id: 'createdAt', header: 'Creación', accessorFn: (w) => w.createdAt, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
    { id: 'updatedAt', header: 'Actualización', accessorFn: (w) => w.updatedAt, cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.updatedAt)}</span> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const w = row.original
        return (
          <RowActions
            actions={[
              { label: 'Ver ficha', icon: <Eye />, onSelect: () => router.push(routes.website(w.id)) },
              { label: 'Editar', icon: <Pencil />, onSelect: () => setEditing(w) },
              ...(w.status !== 'ARCHIVED' ? [{ label: 'Archivar', icon: <Archive />, onSelect: () => update.mutate({ id: w.id, patch: { status: 'ARCHIVED' as const } }) }] : []),
              { label: 'Eliminar', icon: <Trash2 />, destructive: true, separatorBefore: true, onSelect: () => setToDelete(w) },
            ]}
          />
        )
      },
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Webs"
        description="Todos los proyectos web, por estado."
        crumbs={[{ label: 'Webs' }, { label: view.label }]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Nueva web
          </Button>
        }
      />
      <nav aria-label="Estado de las webs" className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:inline-flex">
        {Object.entries(VIEWS).map(([key, v]) => (
          <Link key={key} href={`/webs/${key}`} aria-current={key === estado ? 'page' : undefined} className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors', key === estado ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {v.label}
            <span className="text-xs tabular opacity-60">{counts[key] ?? 0}</span>
          </Link>
        ))}
      </nav>
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        searchPlaceholder="Buscar por proyecto, cliente o dominio…"
        searchText={(w) => `${w.name} ${w.domainName} ${clientName.get(w.clientId) ?? ''} ${technologyLabel[w.technology]}`}
        initialSort={[{ id: 'updatedAt', desc: true }]}
        onRowClick={(w) => router.push(routes.website(w.id))}
        onExport={(list) => downloadCsv('webs.csv', list.map((w) => ({ Proyecto: w.name, Cliente: clientName.get(w.clientId) ?? '', URL: w.productionUrl, Estado: websiteStatusLabel[w.status], Tecnologia: technologyLabel[w.technology], Creacion: formatDate(w.createdAt), Actualizacion: formatDate(w.updatedAt) })))}
        toolbar={
          <Select value={tech} onValueChange={(v) => setTech(v as typeof tech)}>
            <SelectTrigger className="h-8 w-52" aria-label="Filtrar por tecnología">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las tecnologías</SelectItem>
              {TECHNOLOGIES.map((t) => (
                <SelectItem key={t} value={t}>
                  {technologyLabel[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle={`No hay webs en «${view.label}»`}
      />
      <WebsiteFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <WebsiteFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} website={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title={`Eliminar ${toDelete?.name ?? ''}`} description="La web se eliminará. Sus dominios y hosting quedarán sin web asociada. Si solo quieres ocultarla, usa «Archivar»." loading={remove.isPending} onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })} />
    </div>
  )
}
