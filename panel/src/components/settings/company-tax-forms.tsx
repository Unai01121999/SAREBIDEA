'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Field, SelectField } from '@/components/forms/fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpdateSettings } from '@/hooks/use-entities'

const companySchema = z.object({
  name: z.string().trim().min(2, 'Indica el nombre'),
  taxId: z.string().trim(),
  address: z.string().trim(),
  email: z.email('Revisa el correo'),
  phone: z.string().trim(),
  website: z.string().trim(),
})
type CompanyValues = z.infer<typeof companySchema>

export function CompanyForm() {
  const { data } = useSettings()
  const save = useUpdateSettings()
  const { register, handleSubmit, reset, formState: { errors: e, isDirty } } = useForm<CompanyValues>({ resolver: zodResolver(companySchema) })
  useEffect(() => {
    if (data) reset(data.company)
  }, [data, reset])
  if (!data) return <Skeleton className="h-80 max-w-2xl" />
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Datos de la empresa</CardTitle>
        <CardDescription>Aparecen en tus facturas y documentos.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((v) => save.mutate({ company: v }))} noValidate>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre o razón social" required error={e.name?.message} htmlFor="s-name" className="sm:col-span-2">
            <Input id="s-name" {...register('name')} aria-invalid={!!e.name} />
          </Field>
          <Field label="CIF / NIF" htmlFor="s-tax">
            <Input id="s-tax" {...register('taxId')} />
          </Field>
          <Field label="Teléfono" htmlFor="s-phone">
            <Input id="s-phone" type="tel" {...register('phone')} />
          </Field>
          <Field label="Correo electrónico" required error={e.email?.message} htmlFor="s-email">
            <Input id="s-email" type="email" {...register('email')} aria-invalid={!!e.email} />
          </Field>
          <Field label="Sitio web" htmlFor="s-web">
            <Input id="s-web" {...register('website')} />
          </Field>
          <Field label="Dirección" htmlFor="s-addr" className="sm:col-span-2">
            <Input id="s-addr" {...register('address')} />
          </Field>
        </CardContent>
        <div className="flex justify-end border-t px-5 py-3">
          <Button type="submit" disabled={!isDirty || save.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  )
}

const taxSchema = z.object({
  vat: z.number({ error: 'Introduce el IVA' }).min(0).max(100),
  irpf: z.number({ error: 'Introduce el IRPF' }).min(0).max(100),
  currency: z.enum(['EUR', 'USD', 'GBP']),
})
type TaxValues = z.infer<typeof taxSchema>

export function TaxForm() {
  const { data } = useSettings()
  const save = useUpdateSettings()
  const { register, control, handleSubmit, reset, formState: { errors: e, isDirty } } = useForm<TaxValues>({ resolver: zodResolver(taxSchema) })
  useEffect(() => {
    if (data) reset({ ...data.taxes, currency: data.currency })
  }, [data, reset])
  if (!data) return <Skeleton className="h-64 max-w-2xl" />
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Impuestos y moneda</CardTitle>
        <CardDescription>Valores por defecto al crear facturas.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit((v) => save.mutate({ taxes: { vat: v.vat, irpf: v.irpf }, currency: v.currency }))} noValidate>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="IVA (%)" error={e.vat?.message} htmlFor="s-vat">
            <Input id="s-vat" type="number" step="0.5" {...register('vat', { valueAsNumber: true })} />
          </Field>
          <Field label="IRPF (%)" error={e.irpf?.message} htmlFor="s-irpf">
            <Input id="s-irpf" type="number" step="0.5" {...register('irpf', { valueAsNumber: true })} />
          </Field>
          <Field label="Moneda" htmlFor="s-cur">
            <SelectField control={control} name="currency" id="s-cur" options={[{ value: 'EUR', label: 'Euro (€)' }, { value: 'USD', label: 'Dólar ($)' }, { value: 'GBP', label: 'Libra (£)' }]} />
          </Field>
        </CardContent>
        <div className="flex justify-end border-t px-5 py-3">
          <Button type="submit" disabled={!isDirty || save.isPending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  )
}
