'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ClientSelectField, Field, SelectField, SwitchField, WebsiteSelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { domainsApi, useSettings } from '@/hooks/use-entities'
import { fromDateInput, toDateInput } from '@/lib/format'
import type { Domain } from '@/types/domain'

const schema = z.object({
  clientId: z.string().min(1, 'Elige un cliente'),
  websiteId: z.string(),
  name: z.string().trim().min(3, 'Escribe el dominio').refine((v) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v), 'Formato: ejemplo.com'),
  registrar: z.string().min(1, 'Elige el registrador'),
  registeredAt: z.string().min(1, 'Indica la fecha de registro'),
  renewsAt: z.string().min(1, 'Indica la fecha de renovación'),
  annualCost: z.number({ error: 'Introduce un importe' }).min(0, 'No puede ser negativo'),
  autoRenew: z.boolean(),
  nameservers: z.string(),
  dns: z.string(),
  notes: z.string(),
})
type Values = z.infer<typeof schema>

const today = () => toDateInput(new Date().toISOString())
const empty = (clientId = ''): Values => ({ clientId, websiteId: '', name: '', registrar: '', registeredAt: today(), renewsAt: '', annualCost: 12, autoRenew: true, nameservers: '', dns: '', notes: '' })
const toValues = (d: Domain): Values => ({ clientId: d.clientId, websiteId: d.websiteId ?? '', name: d.name, registrar: d.registrar, registeredAt: toDateInput(d.registeredAt), renewsAt: toDateInput(d.renewsAt), annualCost: d.annualCost, autoRenew: d.autoRenew, nameservers: d.nameservers.join('\n'), dns: d.dns, notes: d.notes })

export function DomainFormDialog({ open, onOpenChange, domain, clientId }: { open: boolean; onOpenChange: (o: boolean) => void; domain?: Domain; clientId?: string }) {
  const create = domainsApi.useCreate()
  const update = domainsApi.useUpdate()
  const { data: settings } = useSettings()
  const { register, control, handleSubmit, reset, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty(clientId) })
  const selectedClient = useWatch({ control, name: 'clientId' })
  useEffect(() => {
    if (open) reset(domain ? toValues(domain) : empty(clientId))
  }, [open, domain, clientId, reset])

  const submit = handleSubmit(async (v) => {
    const payload = { ...v, name: v.name.toLowerCase(), websiteId: v.websiteId || null, registeredAt: fromDateInput(v.registeredAt), renewsAt: fromDateInput(v.renewsAt), nameservers: v.nameservers.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) }
    if (domain) await update.mutateAsync({ id: domain.id, patch: payload })
    else await create.mutateAsync(payload)
    onOpenChange(false)
  })

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={domain ? 'Editar dominio' : 'Nuevo dominio'} onSubmit={submit} submitting={create.isPending || update.isPending} submitLabel={domain ? 'Guardar cambios' : 'Crear dominio'} wide>
      <Field label="Dominio" required error={e.name?.message} htmlFor="d-name">
        <Input id="d-name" {...register('name')} aria-invalid={!!e.name} placeholder="sunegocio.com" />
      </Field>
      <Field label="Registrador" required error={e.registrar?.message} htmlFor="d-reg">
        <SelectField control={control} name="registrar" id="d-reg" options={(settings?.domainRegistrars ?? []).map((p) => ({ value: p, label: p }))} />
      </Field>
      <Field label="Cliente" required error={e.clientId?.message} htmlFor="d-client">
        <ClientSelectField control={control} name="clientId" id="d-client" />
      </Field>
      <Field label="Proyecto web relacionado" htmlFor="d-web">
        <WebsiteSelectField control={control} name="websiteId" clientId={selectedClient} id="d-web" />
      </Field>
      <Field label="Fecha de registro" required error={e.registeredAt?.message} htmlFor="d-reg-at">
        <Input id="d-reg-at" type="date" {...register('registeredAt')} />
      </Field>
      <Field label="Fecha de renovación" required error={e.renewsAt?.message} htmlFor="d-ren">
        <Input id="d-ren" type="date" {...register('renewsAt')} aria-invalid={!!e.renewsAt} />
      </Field>
      <Field label="Coste anual (€)" error={e.annualCost?.message} htmlFor="d-cost">
        <Input id="d-cost" type="number" step="0.01" min="0" inputMode="decimal" {...register('annualCost', { valueAsNumber: true })} aria-invalid={!!e.annualCost} />
      </Field>
      <div className="flex items-end">
        <div className="w-full">
          <SwitchField control={control} name="autoRenew" label="Renovación automática" />
        </div>
      </div>
      <Field label="Nameservers" hint="Uno por línea." htmlFor="d-ns">
        <Textarea id="d-ns" rows={3} {...register('nameservers')} />
      </Field>
      <Field label="Registros DNS" htmlFor="d-dns">
        <Textarea id="d-dns" rows={3} {...register('dns')} className="font-mono text-xs" />
      </Field>
      <Field label="Notas" htmlFor="d-notes" className="sm:col-span-2">
        <Textarea id="d-notes" rows={2} {...register('notes')} />
      </Field>
    </FormDialog>
  )
}
