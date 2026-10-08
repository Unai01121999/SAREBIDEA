'use client'

import { Archive, ExternalLink, GitBranch, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { ExpiryBadge, PriorityBadge, TechBadge, WebsiteStatusBadge } from '@/components/shared/badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { WebsiteFormDialog } from '@/components/websites/website-form'
import { clientsApi, domainsApi, hostingsApi, tasksApi, websitesApi } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/format'
import { taskStatusLabel } from '@/lib/labels'
import { routes } from '@/lib/routes'

export default function WebsiteDetailPage() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  const { data: web, isLoading } = websitesApi.useOne(id)
  const { data: client } = clientsApi.useOne(web?.clientId)
  const domains = domainsApi.useList()
  const hostings = hostingsApi.useList()
  const tasks = tasksApi.useList()
  const update = websitesApi.useUpdate()
  const remove = websitesApi.useRemove()
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)

  const wDomains = useMemo(() => (domains.data ?? []).filter((d) => d.websiteId === id), [domains.data, id])
  const wHostings = useMemo(() => (hostings.data ?? []).filter((h) => h.websiteId === id), [hostings.data, id])
  const wTasks = useMemo(() => (tasks.data ?? []).filter((t) => t.websiteId === id), [tasks.data, id])

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!web)
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-medium">Web no encontrada</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/webs/produccion">Volver a webs</Link>
        </Button>
      </div>
    )

  return (
    <div className="animate-fade-up">
      <PageHeader
        crumbs={[{ label: 'Webs', href: '/webs/produccion' }, { label: web.name }]}
        title={web.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <WebsiteStatusBadge status={web.status} />
            <TechBadge tech={web.technology} />
            <span>{web.domainName}</span>
          </span>
        }
        actions={
          <>
            {web.productionUrl && (
              <Button asChild size="sm">
                <a href={web.productionUrl} target="_blank" rel="noreferrer">
                  <ExternalLink /> Ver web
                </a>
              </Button>
            )}
            {web.repoUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={web.repoUrl} target="_blank" rel="noreferrer">
                  <GitBranch /> Repositorio
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
              <Pencil /> Editar información
            </Button>
            {web.status !== 'ARCHIVED' && (
              <Button variant="outline" size="sm" onClick={() => update.mutate({ id: web.id, patch: { status: 'ARCHIVED' } })}>
                <Archive /> Archivar
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDialog('delete')}>
              <Trash2 />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Row label="Cliente">
                {client ? (
                  <Link href={routes.client(client.id)} className="hover:text-brand hover:underline">
                    {client.company}
                  </Link>
                ) : (
                  '—'
                )}
              </Row>
              <Row label="Dominio">
                {wDomains[0] ? (
                  <Link href={routes.domain(wDomains[0].id)} className="hover:text-brand hover:underline">
                    {wDomains[0].name}
                  </Link>
                ) : (
                  web.domainName || '—'
                )}
              </Row>
              <Row label="Fecha de inicio">{formatDate(web.startDate)}</Row>
              <Row label="Fecha de publicación">{formatDate(web.publishDate)}</Row>
              <Row label="Creada">{formatDate(web.createdAt)}</Row>
              <Row label="Última actualización">{formatDate(web.updatedAt)}</Row>
              <Row label="Descripción del proyecto" className="sm:col-span-2">
                <span className="font-normal text-muted-foreground">{web.description || '—'}</span>
              </Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <Row label="URL de producción">{web.productionUrl ? <ExtLink href={web.productionUrl} /> : '—'}</Row>
              <Row label="URL de staging">{web.stagingUrl ? <ExtLink href={web.stagingUrl} /> : '—'}</Row>
              <Row label="Repositorio GitHub">{web.repoUrl ? <ExtLink href={web.repoUrl} /> : '—'}</Row>
              <Row label="Rama principal">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{web.mainBranch}</code>
              </Row>
              <Row label="Proveedor de hosting">{web.hostingProvider || '—'}</Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hosting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {wHostings.length ? (
              wHostings.map((h) => (
                <Link key={h.id} href={routes.hosting(h.id)} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                  <span className="truncate">
                    {h.provider} · {h.plan} · {formatCurrency(h.annualCost)}
                  </span>
                  <ExpiryBadge renewsAt={h.renewsAt} />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin hosting asociado.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tareas relacionadas</CardTitle>
          </CardHeader>
          <CardContent>
            {wTasks.length ? (
              <ul className="-my-2 divide-y">
                {wTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <PriorityBadge priority={t.priority} />
                    <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">{taskStatusLabel[t.status]}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No hay tareas para esta web.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <WebsiteFormDialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)} website={web} />
      <ConfirmDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)} title={`Eliminar ${web.name}`} description="La web se eliminará. Sus dominios y hosting quedarán sin web asociada." loading={remove.isPending} onConfirm={() => remove.mutate(web.id, { onSuccess: () => router.push('/webs/produccion') })} />
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

function ExtLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
      <span className="break-all">{href.replace(/^https?:\/\//, '')}</span> <ExternalLink className="size-3 shrink-0" />
    </a>
  )
}
