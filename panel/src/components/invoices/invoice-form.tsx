'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { addDays } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ClientSelectField, Field, SelectField, SwitchField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { ClientContext, usePrefillData } from '@/components/forms/prefill'
import { Input, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { invoicesApi, useSettings } from '@/hooks/use-entities'
import { formatCurrency, fromDateInput, toDateInput } from '@/lib/format'
import { conceptLabel, invoiceStatusLabel } from '@/lib/labels'
import { invoiceTotal } from '@/lib/metrics'
import { billableServices } from '@/lib/prefill'
import { INVOICE_CONCEPTS, INVOICE_STATUSES, type Invoice } from '@/types/domain'

const schema = z.object({
  number: z.string().trim().min(3, 'Indica el número de factura'),
  clientId: z.string().min(1, 'Elige un cliente'),
  concept: z.enum(INVOICE_CONCEPTS),
  description: z.string().trim().min(2, 'Describe brevemente el concepto'),
  issuedAt: z.string().min(1, 'Indica la fecha de emisión'),
  dueAt: z.string().min(1, 'Indica la fecha de vencimiento'),
  subtotal: z.number({ error: 'Introduce la base imponible' }).min(0, 'No puede ser negativo'),
  taxRate: z.number({ error: 'Introduce el IVA' }).min(0).max(100),
  status: z.enum(INVOICE_STATUSES),
  recurring: z.boolean(),
  websiteId: z.string(),
  domainId: z.string(),
  hostingId: z.string(),
})
type Values = z.infer<typeof schema>

const toValues = (i: Invoice): Values => ({ number: i.number, clientId: i.clientId, concept: i.concept, description: i.description, issuedAt: toDateInput(i.issuedAt), dueAt: toDateInput(i.dueAt), subtotal: i.subtotal, taxRate: i.taxRate, status: i.status, recurring: i.recurring, websiteId: i.websiteId ?? '', domainId: i.domainId ?? '', hostingId: i.hostingId ?? '' })

const NONE = '__none'

export function InvoiceFormDialog({ open, onOpenChange, invoice, clientId, serviceKey }: { open: boolean; onOpenChange: (o: boolean) => void; invoice?: Invoice; clientId?: string; /** Servicio a facturar de entrada, p. ej. "hosting:hos_001". */ serviceKey?: string }) {
  const create = invoicesApi.useCreate()
  const update = invoicesApi.useUpdate()
  const { data: invoices } = invoicesApi.useList()
  const { data: settings } = useSettings()
  const prefill = usePrefillData()
  const [service, setService] = useState(NONE)

  const nextNumber = useMemo(() => {
    const year = new Date().getFullYear()
    const max = (invoices ?? []).filter((i) => i.number.startsWith(`F-${year}-`)).reduce((m, i) => Math.max(m, Number(i.number.split('-')[2]) || 0), 0)
    return `F-${year}-${String(max + 1).padStart(3, '0')}`
  }, [invoices])

  const blank = (): Values => ({ number: nextNumber, clientId: clientId ?? '', concept: 'WEB_DEVELOPMENT', description: '', issuedAt: toDateInput(new Date().toISOString()), dueAt: toDateInput(addDays(new Date(), 30).toISOString()), subtotal: 0, taxRate: settings?.taxes.vat ?? 21, status: 'PENDING', recurring: false, websiteId: '', domainId: '', hostingId: '' })

  const { register, control, handleSubmit, reset, setValue, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank() })
  const [subtotal, taxRate, selectedClient] = useWatch({ control, name: ['subtotal', 'taxRate', 'clientId'] })
  const client = prefill.clientById(selectedClient)
  const services = useMemo(() => (selectedClient && prefill.ready ? billableServices(selectedClient, prefill.ctx) : []), [selectedClient, prefill.ready, prefill.ctx])

  useEffect(() => {
    if (open) {
      reset(invoice ? toValues(invoice) : blank())
      setService(NONE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id])

  /** Rellena concepto, descripción, importe y relaciones a partir de un servicio que el cliente ya tiene. */
  const pickService = (key: string) => {
    setService(key)
    const s = services.find((x) => `${x.kind}:${x.id}` === key)
    if (!s) return
    setValue('concept', s.concept)
    setValue('description', s.description)
    if (s.subtotal > 0) setValue('subtotal', s.subtotal)
    setValue('recurring', s.recurring)
    setValue('websiteId', s.websiteId ?? '')
    setValue('domainId', s.domainId ?? '')
    setValue('hostingId', s.hostingId ?? '')
  }

  // Si se abre desde un servicio concreto (p. ej. «Facturar» en la ficha de un hosting), se aplica al abrir.
  useEffect(() => {
    if (open && !invoice && serviceKey && services.some((x) => `${x.kind}:${x.id}` === serviceKey) && service === NONE) pickService(serviceKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceKey, services.length])

  const submit = handleSubmit(async (v) => {
    const payload = { ...v, websiteId: v.websiteId || null, domainId: v.domainId || null, hostingId: v.hostingId || null, issuedAt: fromDateInput(v.issuedAt), dueAt: fromDateInput(v.dueAt) }
    if (invoice) await update.mutateAsync({ id: invoice.id, patch: payload })
    else await create.mutateAsync(payload)
    onOpenChange(false)
  })

  const total = Number.isFinite(subtotal) && Number.isFinite(taxRate) ? invoiceTotal({ subtotal, taxRate }) : 0

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={invoice ? `Editar factura ${invoice.number}` : 'Nueva factura'} onSubmit={submit} submitting={create.isPending || update.isPending} submitLabel={invoice ? 'Guardar cambios' : 'Crear factura'} wide>
      <Field label="Número" required error={e.number?.message} htmlFor="i-num">
        <Input id="i-num" {...register('number')} aria-invalid={!!e.number} />
      </Field>
      <Field label="Cliente" required error={e.clientId?.message} htmlFor="i-client">
        <ClientSelectField control={control} name="clientId" id="i-client" />
      </Field>
      <ClientContext client={client} showFiscal note="Estos son los datos de facturación del cliente (nombre, CIF/NIF y dirección). Se toman de su ficha: si hay que cambiarlos, hazlo allí." />

      {!invoice && services.length > 0 && (
        <Field label="Facturar un servicio del cliente" hint="Rellena concepto, descripción e importe con lo que ya tiene contratado." htmlFor="i-service" className="sm:col-span-2">
          <Select value={service} onValueChange={pickService}>
            <SelectTrigger id="i-service">
              <SelectValue placeholder="Elige hosting, dominio o web…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Factura libre (rellenar a mano)</SelectItem>
              {services.map((s) => (
                <SelectItem key={`${s.kind}:${s.id}`} value={`${s.kind}:${s.id}`}>
                  {s.label}
                  {s.subtotal > 0 ? ` · ${formatCurrency(s.subtotal)}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="Concepto" htmlFor="i-concept">
        <SelectField control={control} name="concept" id="i-concept" options={INVOICE_CONCEPTS.map((c) => ({ value: c, label: conceptLabel[c] }))} />
      </Field>
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
      <Field label="Base imponible (€)" required error={e.subtotal?.message} htmlFor="i-sub">
        <Input id="i-sub" type="number" step="0.01" min="0" inputMode="decimal" {...register('subtotal', { valueAsNumber: true })} aria-invalid={!!e.subtotal} />
      </Field>
      <Field label="IVA (%)" error={e.taxRate?.message} htmlFor="i-tax">
        <Input id="i-tax" type="number" step="0.5" min="0" max="100" inputMode="decimal" {...register('taxRate', { valueAsNumber: true })} />
      </Field>
      <div className="sm:col-span-2">
        <SwitchField control={control} name="recurring" label="Ingreso recurrente" hint="Hosting, mantenimiento, renovaciones… cuentan en los ingresos recurrentes." />
      </div>
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3 text-sm sm:col-span-2">
        <span className="text-muted-foreground">Total con IVA</span>
        <span className="text-lg font-semibold tracking-tight tabular">{formatCurrency(total, settings?.currency ?? 'EUR')}</span>
      </div>
    </FormDialog>
  )
}
