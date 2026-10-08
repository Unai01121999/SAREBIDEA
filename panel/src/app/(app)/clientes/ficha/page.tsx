'use client'

import { Archive, ArchiveRestore, ExternalLink, FileText, Mail, MapPin, Pencil, PenLine, Phone, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ClientFormDialog } from '@/components/clients/client-form'
import { DomainFormDialog } from '@/components/domains/domain-form'
import { InvoiceFormDialog } from '@/components/invoices/invoice-form'
import { PageHeader } from '@/components/layout/page-header'
import { ClientStatusBadge, ExpiryBadge, InvoiceStatusBadge, ServiceChip, TechBadge, WebsiteStatusBadge } from '@/components/shared/badges'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WebsiteFormDialog } from '@/components/websites/website-form'
import { clientsApi, domainsApi, hostingsApi, invoicesApi, useActivity, websitesApi } from '@/hooks/use-entities'
import { formatCurrency, formatDate, formatDateTime, timeAgo } from '@/lib/format'
import { conceptLabel, originLabel, originTone } from '@/lib/labels'
import { effectiveStatus, invoiceTotal } from '@/lib/metrics'
import type { Client } from '@/types/domain'
import { routes } from '@/lib/routes'

export default function ClientDetailPage() {
  const id = useSearchParams().get('id') ?? ''
  const router = useRouter()
  const { data: client, isLoading } = clientsApi.useOne(id)
  const websites = websitesApi.useList()
  const domains = domainsApi.useList()
  const hostings = hostingsApi.useList()
  const invoices = invoicesApi.useList()
  const activity = useActivity()
  const update = clientsApi.useUpdate()
  const remove = clientsApi.useRemove()

  const [dialog, setDialog] = useState<'edit' | 'web' | 'domain' | 'invoice' | 'delete' | null>(null)

  const cWebs = useMemo(() => (websites.data ?? []).filter((w) => w.clientId === id), [websites.data, id])
  const cDomains = useMemo(() => (domains.data ?? []).filter((d) => d.clientId === id), [domains.data, id])
  const cHostings = useMemo(() => (hostings.data ?? []).filter((h) => h.clientId === id), [hostings.data, id])
  const cInvoices = useMemo(() => (invoices.data ?? []).filter((i) => i.clientId === id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)), [invoices.data, id])
  const cActivity = useMemo(() => (activity.data ?? []).filter((a) => a.clientId === id), [activity.data, id])

  const billed = cInvoices.filter((i) => i.status !== 'CANCELLED').reduce((a, i) => a + i.subtotal, 0)
  const pending = cInvoices.filter((i) => ['PENDING', 'OVERDUE'].includes(effectiveStatus(i))).reduce((a, i) => a + i.subtotal, 0)

  if (isLoading) return <Skeleton className="h-96 w-full" />
  if (!client)
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-medium">Cliente no encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/clientes">Volver al listado</Link>
        </Button>
      </div>
    )

  return (
    <div className="animate-fade-up">
      <PageHeader
        crumbs={[{ label: 'Clientes', href: '/clientes' }, { label: client.company }]}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={client.company} size={40} />
            <span className="truncate">{client.company}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ClientStatusBadge status={client.status} />
            <Badge tone={originTone[client.origin ?? 'MANUAL']} dot={false}>
              {originLabel[client.origin ?? 'MANUAL']}
            </Badge>
            {client.archived && <Badge tone="neutral">Archivado</Badge>}
            <span>Cliente desde {formatDate(client.createdAt)}</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialog('edit')}>
              <Pencil /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => update.mutate({ id: client.id, patch: { archived: !client.archived } })}>
              {client.archived ? <ArchiveRestore /> : <Archive />} {client.archived ? 'Restaurar' : 'Archivar'}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDialog('delete')}>
              <Trash2 /> Eliminar
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Webs', value: String(cWebs.length) },
          { label: 'Dominios', value: String(cDomains.length) },
          { label: 'Facturado', value: formatCurrency(billed) },
          { label: 'Pendiente de cobro', value: formatCurrency(pending), warn: pending > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card px-4 py-3 shadow-xs">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold tracking-tight tabular ${s.warn ? 'text-warning' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="datos">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="webs">Webs ({cWebs.length})</TabsTrigger>
          <TabsTrigger value="dominios">Dominios ({cDomains.length})</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación ({cInvoices.length})</TabsTrigger>
          <TabsTrigger value="origen">Origen</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Datos generales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Info label="Persona de contacto" value={client.contactName} />
                <Info label="CIF / NIF" value={client.taxId} />
                <Info label="Email" value={client.email} href={`mailto:${client.email}`} icon={<Mail className="size-3.5" />} />
                <Info label="Teléfono" value={client.phone} href={client.phone ? `tel:${client.phone.replace(/\s/g, '')}` : undefined} icon={<Phone className="size-3.5" />} />
                <Info label="Dirección" value={[client.address, `${client.postalCode} ${client.province}`.trim(), client.country].filter(Boolean).join(', ')} icon={<MapPin className="size-3.5" />} className="sm:col-span-2" />
                <Info label="Fecha de alta" value={formatDate(client.createdAt)} />
                <Info label="Última modificación" value={formatDate(client.updatedAt)} />
              </dl>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Servicios contratados</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">{client.services.length ? client.services.map((s) => <ServiceChip key={s} service={s} />) : <p className="text-sm text-muted-foreground">Ninguno todavía.</p>}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{client.notes || 'Sin notas.'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hosting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cHostings.length ? (
                  cHostings.map((h) => (
                    <Link key={h.id} href={routes.hosting(h.id)} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                      <span className="truncate">
                        {h.provider} · {h.plan}
                      </span>
                      <ExpiryBadge renewsAt={h.renewsAt} />
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sin hosting contratado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webs">
          <SectionBar title="Webs asociadas" action={<Button size="sm" onClick={() => setDialog('web')}><Plus /> Nueva web</Button>} />
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tecnología</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Actualizada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cWebs.map((w) => (
                  <TableRow key={w.id} className="cursor-pointer" onClick={() => router.push(routes.website(w.id))}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell><WebsiteStatusBadge status={w.status} /></TableCell>
                    <TableCell><TechBadge tech={w.technology} /></TableCell>
                    <TableCell>
                      {w.productionUrl ? (
                        <a href={w.productionUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-brand hover:underline">
                          {w.domainName} <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Sin publicar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(w.updatedAt)}</TableCell>
                  </TableRow>
                ))}
                {!cWebs.length && <EmptyRow cols={5} text="Este cliente no tiene webs." />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="dominios">
          <SectionBar title="Dominios asociados" action={<Button size="sm" onClick={() => setDialog('domain')}><Plus /> Nuevo dominio</Button>} />
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dominio</TableHead>
                  <TableHead>Registrador</TableHead>
                  <TableHead>Renovación</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead className="text-right">Coste</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cDomains.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => router.push(routes.domain(d.id))}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.registrar}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(d.renewsAt)}</TableCell>
                    <TableCell><ExpiryBadge renewsAt={d.renewsAt} /></TableCell>
                    <TableCell className="text-right tabular">{formatCurrency(d.annualCost)}</TableCell>
                  </TableRow>
                ))}
                {!cDomains.length && <EmptyRow cols={5} text="Este cliente no tiene dominios." />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="facturacion">
          <SectionBar title="Facturación relacionada" action={<Button size="sm" onClick={() => setDialog('invoice')}><Plus /> Nueva factura</Button>} />
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Emisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cInvoices.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium tabular">{i.number}</TableCell>
                    <TableCell>{conceptLabel[i.concept]}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(i.issuedAt)}</TableCell>
                    <TableCell><InvoiceStatusBadge status={effectiveStatus(i)} /></TableCell>
                    <TableCell className="text-right tabular">{formatCurrency(invoiceTotal(i), 'EUR')}</TableCell>
                  </TableRow>
                ))}
                {!cInvoices.length && <EmptyRow cols={5} text="Sin facturas todavía." />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="origen">
          <OriginPanel client={client} />
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardContent>
              {cActivity.length ? (
                <ul className="divide-y">
                  {cActivity.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                      <span>{a.message}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(a.createdAt)} · {a.actor}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin acciones registradas para este cliente.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ClientFormDialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)} client={client} />
      <WebsiteFormDialog open={dialog === 'web'} onOpenChange={(o) => !o && setDialog(null)} clientId={client.id} />
      <DomainFormDialog open={dialog === 'domain'} onOpenChange={(o) => !o && setDialog(null)} clientId={client.id} />
      <InvoiceFormDialog open={dialog === 'invoice'} onOpenChange={(o) => !o && setDialog(null)} clientId={client.id} />
      <ConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Eliminar ${client.company}`}
        description="Se eliminarán también sus webs, dominios, hosting, facturas y tareas. Esta acción no se puede deshacer."
        loading={remove.isPending}
        onConfirm={() => remove.mutate(client.id, { onSuccess: () => router.push('/clientes') })}
      />
    </div>
  )
}

function Info({ label, value, href, icon, className }: { label: string; value: string; href?: string; icon?: React.ReactNode; className?: string }) {
  const body = value || '—'
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium break-words">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {href && value ? (
          <a href={href} className="hover:text-brand hover:underline">
            {body}
          </a>
        ) : (
          body
        )}
      </dd>
    </div>
  )
}

function SectionBar({ title, action }: { title: string; action: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {action}
    </div>
  )
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={cols} className="py-10 text-center text-sm text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  )
}

/** Cómo llegó este cliente: formulario de la web o alta manual, con lo que se escribió en el formulario. */
function OriginPanel({ client }: { client: Client }) {
  const fromForm = (client.origin ?? 'MANUAL') === 'FORM'
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {fromForm ? <FileText className="size-4 text-info" /> : <PenLine className="size-4 text-muted-foreground" />}
            {fromForm ? 'Llegó a través del formulario de la web' : 'Dado de alta manualmente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 text-sm text-muted-foreground">
            {fromForm ? 'La propia persona rellenó el formulario de contacto de sarebidea.com y la solicitud se importó al panel automáticamente.' : 'Lo añadiste tú desde el panel (por ejemplo tras una llamada, un correo o una visita).'}
          </p>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Origen</dt>
              <dd className="mt-1">
                <Badge tone={originTone[client.origin ?? 'MANUAL']}>{originLabel[client.origin ?? 'MANUAL']}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{fromForm ? 'Solicitud recibida' : 'Fecha de alta'}</dt>
              <dd className="mt-1 text-sm font-medium">{formatDateTime(fromForm ? (client.formData?.submittedAt ?? client.createdAt) : client.createdAt)}</dd>
            </div>
            {fromForm ? (
              <>
                {client.formData?.code && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Referencia de la solicitud</dt>
                    <dd className="mt-1 text-sm font-medium tabular">{client.formData.code}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-muted-foreground">Tipo de negocio indicado</dt>
                  <dd className="mt-1 text-sm font-medium">{client.formData?.businessType || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Lo que escribió en el formulario</dt>
                  <dd className="mt-1 rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap">{client.formData?.description || '—'}</dd>
                </div>
              </>
            ) : (
              <div>
                <dt className="text-xs text-muted-foreground">Dado de alta por</dt>
                <dd className="mt-1 text-sm font-medium">Unai Padura Larrea</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
