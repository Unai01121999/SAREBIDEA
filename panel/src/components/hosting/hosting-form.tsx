'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ClientSelectField, Field, SelectField, SwitchField, WebsiteSelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { hostingsApi, useSettings } from '@/hooks/use-entities'
import { fromDateInput, toDateInput } from '@/lib/format'
import type { Hosting } from '@/types/domain'

const schema = z.object({
  clientId: z.string().min(1, 'Elige un cliente'),
  websiteId: z.string(),
  provider: z.string().min(1, 'Elige el proveedor'),
  plan: z.string().trim().min(2, 'Indica el plan contratado'),
  annualCost: z.number({ error: 'Introduce un importe' }).min(0, 'No puede ser negativo'),
  contractedAt: z.string().min(1, 'Indica la fecha de contratación'),
  renewsAt: z.string().min(1, 'Indica la fecha de renovación'),
  active: z.boolean(),
  notes: z.string(),
})
type Values = z.infer<typeof schema>

const today = () => toDateInput(new Date().toISOString())
const empty = (clientId = ''): Values => ({ clientId, websiteId: '', provider: '', plan: '', annualCost: 60, contractedAt: today(), renewsAt: '', active: true, notes: '' })
const toValues = (h: Hosting): Values => ({ clientId: h.clientId, websiteId: h.websiteId ?? '', provider: h.provider, plan: h.plan, annualCost: h.annualCost, contractedAt: toDateInput(h.contractedAt), renewsAt: toDateInput(h.renewsAt), active: h.active, notes: h.notes })

export function HostingFormDialog({ open, onOpenChange, hosting, clientId }: { open: boolean; onOpenChange: (o: boolean) => void; hosting?: Hosting; clientId?: string }) {
  const create = hostingsApi.useCreate()
  const update = hostingsApi.useUpdate()
  const { data: settings } = useSettings()
  const { register, control, handleSubmit, reset, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty(clientId) })
  const selectedClient = useWatch({ control, name: 'clientId' })
  useEffect(() => {
    if (open) reset(hosting ? toValues(hosting) : empty(clientId))
  }, [open, hosting, clientId, reset])

  const submit = handleSubmit(async (v) => {
    const payload = { ...v, websiteId: v.websiteId || null, contractedAt: fromDateInput(v.contractedAt), renewsAt: fromDateInput(v.renewsAt) }
    if (hosting) await update.mutateAsync({ id: hosting.id, patch: payload })
    else await create.mutateAsync(payload)
    onOpenChange(false)
  })

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={hosting ? 'Editar hosting' : 'Nuevo hosting'} onSubmit={submit} submitting={create.isPending || update.isPending} submitLabel={hosting ? 'Guardar cambios' : 'Crear hosting'} wide>
      <Field label="Cliente" required error={e.clientId?.message} htmlFor="h-client">
        <ClientSelectField control={control} name="clientId" id="h-client" />
      </Field>
      <Field label="Web asociada" htmlFor="h-web">
        <WebsiteSelectField control={control} name="websiteId" clientId={selectedClient} id="h-web" />
      </Field>
      <Field label="Proveedor" required error={e.provider?.message} htmlFor="h-prov">
        <SelectField control={control} name="provider" id="h-prov" options={(settings?.hostingProviders ?? []).map((p) => ({ value: p, label: p }))} />
      </Field>
      <Field label="Plan contratado" required error={e.plan?.message} htmlFor="h-plan">
        <Input id="h-plan" {...register('plan')} aria-invalid={!!e.plan} placeholder="Business" />
      </Field>
      <Field label="Coste anual (€)" error={e.annualCost?.message} htmlFor="h-cost">
        <Input id="h-cost" type="number" step="0.01" min="0" inputMode="decimal" {...register('annualCost', { valueAsNumber: true })} aria-invalid={!!e.annualCost} />
      </Field>
      <div className="flex items-end">
        <div className="w-full">
          <SwitchField control={control} name="active" label="Hosting activo" />
        </div>
      </div>
      <Field label="Fecha de contratación" required error={e.contractedAt?.message} htmlFor="h-con">
        <Input id="h-con" type="date" {...register('contractedAt')} />
      </Field>
      <Field label="Fecha de renovación" required error={e.renewsAt?.message} htmlFor="h-ren">
        <Input id="h-ren" type="date" {...register('renewsAt')} aria-invalid={!!e.renewsAt} />
      </Field>
      <Field label="Notas" htmlFor="h-notes" className="sm:col-span-2">
        <Textarea id="h-notes" rows={3} {...register('notes')} />
      </Field>
    </FormDialog>
  )
}
