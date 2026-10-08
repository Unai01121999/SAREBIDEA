'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { addDays } from 'date-fns'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ClientSelectField, Field, SelectField, SwitchField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { invoicesApi, useSettings } from '@/hooks/use-entities'
import { formatCurrency, fromDateInput, toDateInput } from '@/lib/format'
import { conceptLabel, invoiceStatusLabel } from '@/lib/labels'
import { invoiceTotal } from '@/lib/metrics'
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
})
type Values = z.infer<typeof schema>

const toValues = (i: Invoice): Values => ({ number: i.number, clientId: i.clientId, concept: i.concept, description: i.description, issuedAt: toDateInput(i.issuedAt), dueAt: toDateInput(i.dueAt), subtotal: i.subtotal, taxRate: i.taxRate, status: i.status, recurring: i.recurring })

export function InvoiceFormDialog({ open, onOpenChange, invoice, clientId }: { open: boolean; onOpenChange: (o: boolean) => void; invoice?: Invoice; clientId?: string }) {
  const create = invoicesApi.useCreate()
  const update = invoicesApi.useUpdate()
  const { data: invoices } = invoicesApi.useList()
  const { data: settings } = useSettings()

  const nextNumber = useMemo(() => {
    const year = new Date().getFullYear()
    const max = (invoices ?? []).filter((i) => i.number.startsWith(`F-${year}-`)).reduce((m, i) => Math.max(m, Number(i.number.split('-')[2]) || 0), 0)
    return `F-${year}-${String(max + 1).padStart(3, '0')}`
  }, [invoices])

  const blank = (): Values => ({ number: nextNumber, clientId: clientId ?? '', concept: 'WEB_DEVELOPMENT', description: '', issuedAt: toDateInput(new Date().toISOString()), dueAt: toDateInput(addDays(new Date(), 30).toISOString()), subtotal: 0, taxRate: settings?.taxes.vat ?? 21, status: 'PENDING', recurring: false })

  const { register, control, handleSubmit, reset, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank() })
  const [subtotal, taxRate] = useWatch({ control, name: ['subtotal', 'taxRate'] })
  useEffect(() => {
    if (open) reset(invoice ? toValues(invoice) : blank())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id])

  const submit = handleSubmit(async (v) => {
    const payload = { ...v, issuedAt: fromDateInput(v.issuedAt), dueAt: fromDateInput(v.dueAt) }
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
