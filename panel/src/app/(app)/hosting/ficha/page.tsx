'use client'

import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { HostingFormDialog } from '@/components/hosting/hosting-form'
import { PageHeader } from '@/components/layout/page-header'
import { ExpiryBadge } from '@/components/shared/badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { clientsApi, hostingsApi, websitesApi } from '@/hooks/use-entities'
import { formatCurrency, formatDate } from '@/lib/format'
import { routes } from '@/lib/routes'

export default function HostingDetailPage() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  const { data: h, isLoading } = hostingsApi.useOne(id)
  const { data: client } = clientsApi.useOne(h?.clientId)
  const { data: web } = websitesApi.useOne(h?.websiteId ?? undefined)
  const remove = hostingsApi.useRemove()
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!h)
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-medium">Hosting no encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/hosting">Volver a hosting</Link>
        </Button>
      </div>
    )

  return (
    <div className="animate-fade-up">
      <PageHeader
        crumbs={[{ label: 'Hosting', href: '/hosting' }, { label: `${h.provider} · ${h.plan}` }]}
        title={`${h.provider} · ${h.plan}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={h.active ? 'success' : 'neutral'}>{h.active ? 'Activo' : 'Inactivo'}</Badge>
            <ExpiryBadge renewsAt={h.renewsAt} />
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
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Row label="Cliente">{client ? <Link href={routes.client(client.id)} className="hover:text-brand hover:underline">{client.company}</Link> : '—'}</Row>
            <Row label="Web">{web ? <Link href={routes.website(web.id)} className="hover:text-brand hover:underline">{web.name}</Link> : 'Sin web asociada'}</Row>
            <Row label="Proveedor">{h.provider}</Row>
            <Row label="Plan">{h.plan}</Row>
            <Row label="Coste anual">{formatCurrency(h.annualCost)}</Row>
            <Row label="Coste mensual equivalente">{formatCurrency(h.annualCost / 12)}</Row>
            <Row label="Fecha de contratación">{formatDate(h.contractedAt)}</Row>
            <Row label="Fecha de renovación">{formatDate(h.renewsAt)}</Row>
            <Row label="Notas" className="sm:col-span-2">
              <span className="font-normal text-muted-foreground">{h.notes || '—'}</span>
            </Row>
          </dl>
        </CardContent>
      </Card>
      <HostingFormDialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)} hosting={h} />
      <ConfirmDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)} title="Eliminar hosting" description="Se eliminará este alojamiento. Esta acción no se puede deshacer." loading={remove.isPending} onConfirm={() => remove.mutate(h.id, { onSuccess: () => router.push('/hosting') })} />
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
