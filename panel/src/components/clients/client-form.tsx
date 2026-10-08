'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { CheckboxGroupField, Field, SelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { clientsApi } from '@/hooks/use-entities'
import { clientStatusLabel, serviceLabel } from '@/lib/labels'
import { CLIENT_STATUSES, SERVICE_TYPES, type Client } from '@/types/domain'

export const clientSchema = z.object({
  company: z.string().trim().min(2, 'Escribe el nombre de la empresa'),
  contactName: z.string().trim().min(2, 'Escribe la persona de contacto'),
  email: z.email('Revisa el correo electrónico'),
  phone: z.string().trim().refine((v) => v === '' || v.replace(/\D/g, '').length >= 9, 'El teléfono debe tener al menos 9 cifras'),
  address: z.string().trim(),
  postalCode: z.string().trim().refine((v) => v === '' || /^\d{5}$/.test(v), 'El código postal tiene 5 cifras'),
  province: z.string().trim(),
  country: z.string().trim().min(2, 'Indica el país'),
  taxId: z.string().trim(),
  status: z.enum(CLIENT_STATUSES),
  services: z.array(z.enum(SERVICE_TYPES)),
  notes: z.string(),
})
export type ClientValues = z.infer<typeof clientSchema>

const empty: ClientValues = { company: '', contactName: '', email: '', phone: '', address: '', postalCode: '', province: '', country: 'España', taxId: '', status: 'PENDING', services: [], notes: '' }

const toValues = (c: Client): ClientValues => ({ company: c.company, contactName: c.contactName, email: c.email, phone: c.phone, address: c.address, postalCode: c.postalCode, province: c.province, country: c.country, taxId: c.taxId, status: c.status, services: c.services, notes: c.notes })

/** Lógica del formulario de cliente (alta y edición). La comparten el modal y la página «Nuevo cliente». */
export function useClientForm(client: Client | undefined, onDone: (saved?: Client) => void) {
  const create = clientsApi.useCreate()
  const update = clientsApi.useUpdate()
  const form = useForm<ClientValues>({ resolver: zodResolver(clientSchema), defaultValues: client ? toValues(client) : empty })
  const submitting = create.isPending || update.isPending

  const submit = form.handleSubmit(async (v) => {
    if (client) {
      const saved = await update.mutateAsync({ id: client.id, patch: v })
      onDone(saved)
    } else {
      const saved = await create.mutateAsync({ ...v, archived: false })
      onDone(saved)
    }
  })
  return { form, submit, submitting, reset: (c?: Client) => form.reset(c ? toValues(c) : empty) }
}

export function ClientFormFields({ form }: { form: UseFormReturn<ClientValues> }) {
  const { register, control, formState: { errors: e } } = form
  return (
    <>
      <Field label="Nombre de la empresa" required error={e.company?.message} htmlFor="c-company" className="sm:col-span-2">
        <Input id="c-company" {...register('company')} aria-invalid={!!e.company} placeholder="Panadería Urrutia" />
      </Field>
      <Field label="Persona de contacto" required error={e.contactName?.message} htmlFor="c-contact">
        <Input id="c-contact" {...register('contactName')} aria-invalid={!!e.contactName} />
      </Field>
      <Field label="Correo electrónico" required error={e.email?.message} htmlFor="c-email">
        <Input id="c-email" type="email" {...register('email')} aria-invalid={!!e.email} />
      </Field>
      <Field label="Teléfono" error={e.phone?.message} htmlFor="c-phone">
        <Input id="c-phone" type="tel" {...register('phone')} aria-invalid={!!e.phone} />
      </Field>
      <Field label="CIF / NIF" htmlFor="c-tax">
        <Input id="c-tax" {...register('taxId')} />
      </Field>
      <Field label="Dirección" htmlFor="c-address" className="sm:col-span-2">
        <Input id="c-address" {...register('address')} />
      </Field>
      <Field label="Código postal" error={e.postalCode?.message} htmlFor="c-cp">
        <Input id="c-cp" inputMode="numeric" {...register('postalCode')} aria-invalid={!!e.postalCode} />
      </Field>
      <Field label="Provincia" htmlFor="c-prov">
        <Input id="c-prov" {...register('province')} />
      </Field>
      <Field label="País" required error={e.country?.message} htmlFor="c-country">
        <Input id="c-country" {...register('country')} aria-invalid={!!e.country} />
      </Field>
      <Field label="Estado" htmlFor="c-status">
        <SelectField control={control} name="status" id="c-status" options={CLIENT_STATUSES.map((s) => ({ value: s, label: clientStatusLabel[s] }))} />
      </Field>
      <Field label="Servicios contratados" className="sm:col-span-2">
        <CheckboxGroupField control={control} name="services" options={SERVICE_TYPES.map((s) => ({ value: s, label: serviceLabel[s] }))} />
      </Field>
      <Field label="Notas internas" hint="Solo las ves tú." htmlFor="c-notes" className="sm:col-span-2">
        <Textarea id="c-notes" rows={3} {...register('notes')} />
      </Field>
    </>
  )
}

export function ClientFormDialog({ open, onOpenChange, client }: { open: boolean; onOpenChange: (o: boolean) => void; client?: Client }) {
  const { form, submit, submitting, reset } = useClientForm(client, () => onOpenChange(false))
  useEffect(() => {
    if (open) reset(client)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id])
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={client ? 'Editar cliente' : 'Nuevo cliente'} description={client ? client.company : 'Datos generales y servicios contratados.'} onSubmit={submit} submitting={submitting} submitLabel={client ? 'Guardar cambios' : 'Crear cliente'} wide>
      <ClientFormFields form={form} />
    </FormDialog>
  )
}
