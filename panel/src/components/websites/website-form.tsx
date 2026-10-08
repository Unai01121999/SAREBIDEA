'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ClientSelectField, Field, SelectField } from '@/components/forms/fields'
import { applyDefaults, ClientContext, usePrefillData } from '@/components/forms/prefill'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { websitesApi, useSettings } from '@/hooks/use-entities'
import { fromDateInput, toDateInput } from '@/lib/format'
import { webDefaults } from '@/lib/prefill'
import { technologyLabel, websiteStatusLabel } from '@/lib/labels'
import { TECHNOLOGIES, WEBSITE_STATUSES, type Website } from '@/types/domain'

const schema = z.object({
  clientId: z.string().min(1, 'Elige un cliente'),
  name: z.string().trim().min(2, 'Escribe el nombre del proyecto'),
  status: z.enum(WEBSITE_STATUSES),
  technology: z.enum(TECHNOLOGIES),
  description: z.string(),
  domainName: z.string().trim(),
  productionUrl: z.string().trim().refine((v) => v === '' || /^https?:\/\/.+\..+/.test(v), 'La URL debe empezar por https://'),
  stagingUrl: z.string().trim().refine((v) => v === '' || /^https?:\/\/.+\..+/.test(v), 'La URL debe empezar por https://'),
  repoUrl: z.string().trim().refine((v) => v === '' || /^https?:\/\/.+\..+/.test(v), 'La URL debe empezar por https://'),
  mainBranch: z.string().trim(),
  hostingProvider: z.string(),
  startDate: z.string().min(1, 'Indica la fecha de inicio'),
  publishDate: z.string(),
})
type Values = z.infer<typeof schema>

const today = () => toDateInput(new Date().toISOString())
const empty = (clientId = ''): Values => ({ clientId, name: '', status: 'DEVELOPMENT', technology: 'WORDPRESS', description: '', domainName: '', productionUrl: '', stagingUrl: '', repoUrl: '', mainBranch: 'main', hostingProvider: '', startDate: today(), publishDate: '' })
const toValues = (w: Website): Values => ({ clientId: w.clientId, name: w.name, status: w.status, technology: w.technology, description: w.description, domainName: w.domainName, productionUrl: w.productionUrl, stagingUrl: w.stagingUrl, repoUrl: w.repoUrl, mainBranch: w.mainBranch, hostingProvider: w.hostingProvider, startDate: toDateInput(w.startDate), publishDate: toDateInput(w.publishDate) })

export function WebsiteFormDialog({ open, onOpenChange, website, clientId }: { open: boolean; onOpenChange: (o: boolean) => void; website?: Website; clientId?: string }) {
  const create = websitesApi.useCreate()
  const update = websitesApi.useUpdate()
  const { data: settings } = useSettings()
  const prefill = usePrefillData()
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty(clientId) })
  const { register, control, handleSubmit, reset, formState: { errors: e } } = form
  const selectedClient = useWatch({ control, name: 'clientId' })
  const typedDomain = useWatch({ control, name: 'domainName' })
  useEffect(() => {
    if (open) reset(website ? toValues(website) : empty(clientId))
  }, [open, website, clientId, reset])

  // Alta nueva: con el cliente elegido se propone nombre, dominio, URLs, hosting, tecnología y descripción.
  const client = prefill.clientById(selectedClient)
  useEffect(() => {
    if (!open || website || !client || !prefill.ready) return
    applyDefaults(form, webDefaults(client, prefill.ctx))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, website, client?.id, prefill.ready])
  // Si se escribe el dominio, las URL se derivan solas (mientras no se hayan editado a mano).
  useEffect(() => {
    if (!open || website || !typedDomain) return
    applyDefaults(form, { productionUrl: `https://${typedDomain}`, stagingUrl: `https://staging.${typedDomain}` })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedDomain])

  const submit = handleSubmit(async (v) => {
    const payload = { ...v, startDate: fromDateInput(v.startDate), publishDate: v.publishDate ? fromDateInput(v.publishDate) : null }
    if (website) await update.mutateAsync({ id: website.id, patch: payload })
    else await create.mutateAsync(payload)
    onOpenChange(false)
  })

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={website ? 'Editar web' : 'Nueva web'} description="Proyecto web de un cliente." onSubmit={submit} submitting={create.isPending || update.isPending} submitLabel={website ? 'Guardar cambios' : 'Crear web'} wide>
      <Field label="Cliente" required error={e.clientId?.message} htmlFor="w-client">
        <ClientSelectField control={control} name="clientId" id="w-client" />
      </Field>
      {!website && <ClientContext client={client} note="Nombre, dominio, URLs, hosting y descripción se proponen con los datos del cliente. Cámbialos si hace falta." />}
      <Field label="Nombre del proyecto" required error={e.name?.message} htmlFor="w-name">
        <Input id="w-name" {...register('name')} aria-invalid={!!e.name} placeholder="Web corporativa · Cliente" />
      </Field>
      <Field label="Estado" htmlFor="w-status">
        <SelectField control={control} name="status" id="w-status" options={WEBSITE_STATUSES.map((s) => ({ value: s, label: websiteStatusLabel[s] }))} />
      </Field>
      <Field label="Tecnología" htmlFor="w-tech">
        <SelectField control={control} name="technology" id="w-tech" options={TECHNOLOGIES.map((t) => ({ value: t, label: technologyLabel[t] }))} />
      </Field>
      <Field label="Dominio" htmlFor="w-domain">
        <Input id="w-domain" {...register('domainName')} placeholder="sunegocio.com" />
      </Field>
      <Field label="Proveedor de hosting" htmlFor="w-host">
        <SelectField control={control} name="hostingProvider" id="w-host" allowNone noneLabel="Sin definir" options={(settings?.hostingProviders ?? []).map((p) => ({ value: p, label: p }))} />
      </Field>
      <Field label="Fecha de inicio" required error={e.startDate?.message} htmlFor="w-start">
        <Input id="w-start" type="date" {...register('startDate')} aria-invalid={!!e.startDate} />
      </Field>
      <Field label="Fecha de publicación" htmlFor="w-pub">
        <Input id="w-pub" type="date" {...register('publishDate')} />
      </Field>
      <Field label="URL de producción" error={e.productionUrl?.message} htmlFor="w-prod">
        <Input id="w-prod" inputMode="url" {...register('productionUrl')} aria-invalid={!!e.productionUrl} placeholder="https://" />
      </Field>
      <Field label="URL de staging" error={e.stagingUrl?.message} htmlFor="w-stg">
        <Input id="w-stg" inputMode="url" {...register('stagingUrl')} aria-invalid={!!e.stagingUrl} placeholder="https://staging…" />
      </Field>
      <Field label="Repositorio GitHub" error={e.repoUrl?.message} htmlFor="w-repo">
        <Input id="w-repo" inputMode="url" {...register('repoUrl')} aria-invalid={!!e.repoUrl} placeholder="https://github.com/…" />
      </Field>
      <Field label="Rama principal" htmlFor="w-branch">
        <Input id="w-branch" {...register('mainBranch')} />
      </Field>
      <Field label="Descripción del proyecto" htmlFor="w-desc" className="sm:col-span-2">
        <Textarea id="w-desc" rows={3} {...register('description')} />
      </Field>
    </FormDialog>
  )
}
