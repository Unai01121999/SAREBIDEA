'use client'

import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { DomainFormDialog } from '@/components/domains/domain-form'
import { PageHeader } from '@/components/layout/page-header'
import { ExpiryBadge } from '@/components/shared/badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { clientsApi, domainsApi, websitesApi } from '@/hooks/use-entities'
import { daysUntil, formatCurrency, formatDate } from '@/lib/format'

export default function DomainDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: d, isLoading } = domainsApi.useOne(id)
  const { data: client } = clientsApi.useOne(d?.clientId)
  const { data: web } = websitesApi.useOne(d?.websiteId ?? undefined)
  const remove = domainsApi.useRemove()
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!d)
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-medium">Dominio no encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dominios">Volver a dominios</Link>
        </Button>
      </div>
    )
  const days = daysUntil(d.renewsAt)

  return (
    <div className="animate-fade-up">
      <PageHeader
        crumbs={[{ label: 'Dominios', href: '/dominios' }, { label: d.name }]}
        title={d.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ExpiryBadge renewsAt={d.renewsAt} />
            <Badge tone={d.autoRenew ? 'success' : 'neutral'}>{d.autoRenew ? 'Renovación automática' : 'Renovación manual'}</Badge>
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
              <Pencil /> Editar
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDialog('delete')}>
              <Trash2 /> Eliminar
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Row label="Cliente">{client ? <Link href={`/clientes/${client.id}`} className="hover:text-brand hover:underline">{client.company}</Link> : '—'}</Row>
              <Row label="Proyecto web relacionado">{web ? <Link href={`/webs/ficha/${web.id}`} className="hover:text-brand hover:underline">{web.name}</Link> : 'Sin web asociada'}</Row>
              <Row label="Registrador">{d.registrar}</Row>
              <Row label="Coste anual">{formatCurrency(d.annualCost)}</Row>
              <Row label="Fecha de registro">{formatDate(d.registeredAt)}</Row>
              <Row label="Fecha de renovación">
                {formatDate(d.renewsAt)}
                {days !== null && <span className="ml-2 font-normal text-muted-foreground">({days < 0 ? `hace ${-days} días` : `en ${days} días`})</span>}
              </Row>
              <Row label="Notas" className="sm:col-span-2">
                <span className="font-normal text-muted-foreground">{d.notes || '—'}</span>
              </Row>
            </dl>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nameservers</CardTitle>
            </CardHeader>
            <CardContent>
              {d.nameservers.length ? (
                <ul className="space-y-1.5">
                  {d.nameservers.map((n) => (
                    <li key={n}>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{n}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Sin nameservers definidos.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Registros DNS</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed">{d.dns || 'Sin registros anotados.'}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
      <DomainFormDialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)} domain={d} />
      <ConfirmDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)} title={`Eliminar ${d.name}`} description="Se eliminará el dominio. Esta acción no se puede deshacer." loading={remove.isPending} onConfirm={() => remove.mutate(d.id, { onSuccess: () => router.push('/dominios') })} />
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
