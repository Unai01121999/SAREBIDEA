'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { addDays } from 'date-fns'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from '@/lib/zod'
import { ClientSelectField, Field, SelectField, SwitchField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { ClientContext, usePrefillData } from '@/components/forms/prefill'
import { INVOICE_KINDS, invoiceDefaults, type InvoiceKind } from '@/lib/prefill'
import { Input, Textarea } from '@/components/ui/input'
import { invoicesApi, useSettings, websitesApi } from '@/hooks/use-entities'
import { formatCurrency, fromDateInput, toDateInput } from '@/lib/format'
import { conceptLabel, invoiceStatusLabel } from '@/lib/labels'
import { invoiceTotal } from '@/lib/metrics'
import { PACKS, RENEWAL_PRICES } from '@/lib/packs'
import { INVOICE_CONCEPTS, INVOICE_STATUSES, PACK_TYPES, type Invoice, type PackType } from '@/types/domain'

const schema = z.object({
  // Vacío = la base de datos asigna el siguiente número del año de emisión (sin huecos ni repetidos).
  number: z.string().trim().refine((v) => v === '' || /^F-\d{4}-\d+$/.test(v), 'Formato: F-AAAA-NNN (por ejemplo F-2026-001)'),
  clientId: z.string().min(1, 'Elige un cliente'),
  concept: z.enum(INVOICE_CONCEPTS),
  description: z.string().trim().min(2, 'Describe brevemente el concepto'),
  issuedAt: z.string().min(1, 'Indica la fecha de emisión'),
  dueAt: z.string().min(1, 'Indica la fecha de vencimiento'),
  subtotal: z.number({ error: 'Introduce la base imponible' }).min(0, 'No puede ser negativo'),
  taxRate: z.number({ error: 'Introduce el IVA' }).min(0).max(100),
  status: z.enum(INVOICE_STATUSES),
  maintenance: z.number({ error: 'Introduce el mantenimiento' }).min(0, 'No puede ser negativo'),
  pack: z.string(),
  kind: z.enum(['DEPOSIT', 'FINAL', 'MAINTENANCE', 'RENEWAL']),
  recurring: z.boolean(),
  websiteId: z.string(),
  domainId: z.string(),
  hostingId: z.string(),
})
type Values = z.infer<typeof schema>

/** Tipo de una factura ya guardada (para editarla). */
function kindOf(i: Invoice): InvoiceKind {
  if (i.concept === 'DOMAIN') return 'RENEWAL'
  if (i.concept === 'MAINTENANCE') return 'MAINTENANCE'
  return /segundo pago/i.test(i.description) ? 'FINAL' : 'DEPOSIT'
}

const KIND_HINT: Record<InvoiceKind, string> = {
  DEPOSIT: '50 % del precio del pack, sin mantenimiento.',
  FINAL: '50 % restante del pack, sin mantenimiento (el mantenimiento se factura aparte).',
  MAINTENANCE: 'Mantenimiento mensual del pack. Desde la primera, los meses siguientes se facturan solos.',
  RENEWAL: 'Renovación anual de dominio y hosting: Starter 90 €, Professional 120 €, Premium 180 €. Se emite sola 30 días antes.',
}

const toValues = (i: Invoice): Values => ({ number: i.number, clientId: i.clientId, concept: i.concept, description: i.description, issuedAt: toDateInput(i.issuedAt), dueAt: toDateInput(i.dueAt), subtotal: i.subtotal, maintenance: i.maintenance ?? 0, pack: i.pack ?? '', kind: kindOf(i), taxRate: i.taxRate, status: i.status, recurring: i.recurring, websiteId: i.websiteId ?? '', domainId: i.domainId ?? '', hostingId: i.hostingId ?? '' })

export function InvoiceFormDialog({ open, onOpenChange, invoice, clientId, serviceKey }: { open: boolean; onOpenChange: (o: boolean) => void; invoice?: Invoice; clientId?: string; /** Servicio a facturar de entrada, p. ej. "hosting:hos_001". */ serviceKey?: string }) {
  const create = invoicesApi.useCreate()
  const update = invoicesApi.useUpdate()
  const { data: invoices } = invoicesApi.useList()
  const { data: settings } = useSettings()
  const { data: websites } = websitesApi.useList()
  const prefill = usePrefillData()

  const nextNumber = useMemo(() => {
    const year = new Date().getFullYear()
    const max = (invoices ?? []).filter((i) => i.number.startsWith(`F-${year}-`)).reduce((m, i) => Math.max(m, Number(i.number.split('-')[2]) || 0), 0)
    return `F-${year}-${String(max + 1).padStart(3, '0')}`
  }, [invoices])

  const blank = (): Values => ({ number: '', clientId: clientId ?? '', concept: 'WEB_DEVELOPMENT', description: '', issuedAt: toDateInput(new Date().toISOString()), dueAt: toDateInput(addDays(new Date(), 30).toISOString()), subtotal: 0, maintenance: 0, pack: '', kind: 'DEPOSIT', taxRate: settings?.taxes.vat ?? 21, status: 'PENDING', recurring: false, websiteId: '', domainId: '', hostingId: '' })

  const { register, control, handleSubmit, reset, setValue, setError, clearErrors, formState: { errors: e, dirtyFields } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank() })
  const [subtotal, maintenance, taxRate, selectedClient, pack, kind] = useWatch({ control, name: ['subtotal', 'maintenance', 'taxRate', 'clientId', 'pack', 'kind'] })
  // Facturas libres antiguas (sin pack): se pueden editar a mano. Las nuevas siempre salen de un pack.
  const legacy = !!invoice && !invoice.pack
  const client = prefill.clientById(selectedClient)

  useEffect(() => {
    if (open) {
      reset(invoice ? toValues(invoice) : blank())
      autoFilled.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id])

  /** Rellena base imponible (precio del pack), mantenimiento, concepto y descripción según el pack y el tipo de factura. */
  const applyPack = (packKey: string, k: InvoiceKind, renewalName?: string) => {
    const p = PACKS[packKey as PackType]
    if (!p) return
    setValue('pack', packKey)
    clearErrors('pack')
    setValue('kind', k)
    const design = k === 'DEPOSIT' || k === 'FINAL'
    // Diseño web en dos pagos del 50 % (sin IVA); el mantenimiento se factura aparte.
    setValue('subtotal', design ? Math.round(p.price * 50) / 100 : k === 'RENEWAL' ? RENEWAL_PRICES[packKey as PackType] : 0)
    setValue('maintenance', k === 'MAINTENANCE' ? p.maintenance : 0)
    setValue('concept', design ? 'WEB_DEVELOPMENT' : k === 'RENEWAL' ? 'DOMAIN' : 'MAINTENANCE')
    setValue('recurring', !design)
    setValue('description', {
      DEPOSIT: `${p.label} · diseño web · primer pago (50 %)`,
      FINAL: `${p.label} · diseño web · segundo pago (50 % restante)`,
      MAINTENANCE: `Mantenimiento mensual ${p.label}`,
      RENEWAL: `Renovación anual de dominio y hosting${renewalName ? ` ${renewalName}` : ''}`,
    }[k])
  }

  // Factura nueva: al elegir el cliente se proponen los datos que ya tiene (su pack, tipo de factura, web, IVA…). Solo se rellena lo que aún no se ha tocado.
  const [packNote, setPackNote] = useState('')
  const autoFilled = useRef(false)
  useEffect(() => {
    if (!open || invoice || !client || !prefill.ready) return
    const d = invoiceDefaults(client, prefill.ctx, serviceKey)
    setPackNote(d.pack ? `Propuesto: ${PACKS[d.pack].label} (${d.source}). Puedes cambiarlo.` : 'Este cliente aún no tiene pack asignado: elige uno.')
    if (d.pack && !dirtyFields.pack) {
      applyPack(d.pack, d.kind, d.renewalName)
      autoFilled.current = true
    } else if (!d.pack && autoFilled.current) {
      // Se cambió a un cliente sin pack: se quitan los datos que se habían propuesto para el anterior.
      for (const f of ['pack', 'description'] as const) setValue(f, '')
      setValue('subtotal', 0)
      setValue('maintenance', 0)
      setValue('kind', 'DEPOSIT')
      setValue('concept', 'WEB_DEVELOPMENT')
      autoFilled.current = false
    }
    if (d.websiteId) setValue('websiteId', d.websiteId)
    if (d.domainId) setValue('domainId', d.domainId)
    if (d.dueAt) setValue('dueAt', d.dueAt)
    if (d.taxRate !== undefined && !dirtyFields.taxRate) setValue('taxRate', d.taxRate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id, client?.id, prefill.ready])

  const submit = handleSubmit(async (v) => {
    if (!legacy && !v.pack) return setError('pack', { message: 'Elige el pack que se factura' })
    if (invoice && !v.number) return setError('number', { message: 'Indica el número de factura' })
    const { kind, pack: packKey, ...rest } = v
    void kind
    // Si la factura no tiene web y el cliente tiene una sola, se vincula a ella automáticamente.
    const clientWebs = (websites ?? []).filter((w) => w.clientId === v.clientId)
    const websiteId = v.websiteId || (clientWebs.length === 1 ? clientWebs[0].id : null)
    const payload = { ...rest, pack: (packKey || null) as PackType | null, websiteId, domainId: v.domainId || null, hostingId: v.hostingId || null, issuedAt: fromDateInput(v.issuedAt), dueAt: fromDateInput(v.dueAt) }
    if (invoice) await update.mutateAsync({ id: invoice.id, patch: payload })
    else await create.mutateAsync(payload)
    onOpenChange(false)
  })

  const total = Number.isFinite(subtotal) && Number.isFinite(taxRate) ? invoiceTotal({ subtotal, maintenance: Number.isFinite(maintenance) ? maintenance : 0, taxRate }) : 0

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={invoice ? `Editar factura ${invoice.number}` : 'Nueva factura'} onSubmit={submit} submitting={create.isPending || update.isPending} submitLabel={invoice ? 'Guardar cambios' : 'Crear factura'} wide>
      <Field label="Número" required={!!invoice} error={e.number?.message} hint={invoice ? undefined : 'Déjalo vacío y se asigna el siguiente automáticamente al guardar.'} htmlFor="i-num">
        <Input id="i-num" {...register('number')} placeholder={invoice ? undefined : `Automático (${nextNumber})`} aria-invalid={!!e.number} />
      </Field>
      <Field label="Cliente" required error={e.clientId?.message} htmlFor="i-client">
        <ClientSelectField control={control} name="clientId" id="i-client" />
      </Field>
      <ClientContext client={client} showFiscal note="Estos son los datos de facturación del cliente (nombre, CIF/NIF y dirección). Se toman de su ficha: si hay que cambiarlos, hazlo allí." />

      {!legacy && (
        <>
          <Field label="Pack" required error={e.pack?.message} htmlFor="i-pack" hint={!invoice ? packNote || undefined : undefined}>
            <SelectField control={control} name="pack" id="i-pack" options={PACK_TYPES.map((k) => ({ value: k, label: `${PACKS[k].label} · ${PACKS[k].price} €` }))} onValueChange={(v) => applyPack(v, kind as InvoiceKind)} />
          </Field>
          <Field label="Tipo de factura" htmlFor="i-kind" hint={KIND_HINT[kind as InvoiceKind]}>
            <SelectField control={control} name="kind" id="i-kind" options={INVOICE_KINDS} onValueChange={(v) => pack && applyPack(pack, v as InvoiceKind)} />
          </Field>
        </>
      )}
      {legacy && (
        <Field label="Concepto" htmlFor="i-concept">
          <SelectField control={control} name="concept" id="i-concept" options={INVOICE_CONCEPTS.map((c) => ({ value: c, label: conceptLabel[c] }))} />
        </Field>
      )}
      <Field label="Estado" htmlFor="i-status">
        <SelectField control={control} name="status" id="i-status" options={INVOICE_STATUSES.map((s) => ({ value: s, label: invoiceStatusLabel[s] }))} />
      </Field>
      <Field label="Descripción" required error={e.description?.message} htmlFor="i-desc" className="sm:col-span-2">
        <Textarea id="i-desc" rows={2} {...register('description')} aria-invalid={!!e.description} />
      </Field>
      <Field label="Fecha de emisión" required error={e.issuedAt?.message} htmlFor="i-iss">
        <Input id="i-iss" type="date" {...register('issuedAt')} />
      </Field>
      <Field label="Fecha de vencimiento" required error={e.dueAt?.message} htmlFor="i-due">
        <Input id="i-due" type="date" {...register('dueAt')} />
      </Field>
      <Field label={legacy ? 'Base imponible (€)' : 'Base imponible: pack (€)'} required error={e.subtotal?.message} htmlFor="i-sub">
        <Input id="i-sub" type="number" step="0.01" min="0" inputMode="decimal" {...register('subtotal', { valueAsNumber: true })} aria-invalid={!!e.subtotal} />
      </Field>
      {!legacy && (
        <Field label="Mantenimiento (€/mes)" error={e.maintenance?.message} htmlFor="i-maint" hint="Según el pack elegido.">
          <Input id="i-maint" type="number" step="0.01" min="0" inputMode="decimal" {...register('maintenance', { valueAsNumber: true })} aria-invalid={!!e.maintenance} />
        </Field>
      )}
      <Field label="IVA (%)" error={e.taxRate?.message} htmlFor="i-tax">
        <Input id="i-tax" type="number" step="0.5" min="0" max="100" inputMode="decimal" {...register('taxRate', { valueAsNumber: true })} />
      </Field>
      {legacy && (
        <div className="sm:col-span-2">
          <SwitchField control={control} name="recurring" label="Ingreso recurrente" hint="Mantenimiento, renovaciones… cuentan en los ingresos recurrentes." />
        </div>
      )}
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3 text-sm sm:col-span-2">
        <span className="text-muted-foreground">Total con IVA</span>
        <span className="text-lg font-semibold tracking-tight tabular">{formatCurrency(total, settings?.currency ?? 'EUR')}</span>
      </div>
    </FormDialog>
  )
}
