'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from '@/lib/zod'
import { CheckboxGroupField, Field, SelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { clientsApi, domainsApi, hostingsApi, useSettings, websitesApi } from '@/hooks/use-entities'
import { packInterestLabel } from '@/lib/packs'
import { fromDateInput } from '@/lib/format'
import { clientStatusLabel, serviceLabel, technologyLabel } from '@/lib/labels'
import { guessDomain } from '@/lib/prefill'
import { CLIENT_STATUSES, PACK_INTERESTS, SERVICE_TYPES, TECHNOLOGIES, type Client, type Domain, type Hosting, type PackInterest, type Technology, type Website } from '@/types/domain'

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
  packInterest: z.string(),
  // Apartados opcionales: si se dejan vacíos no pasa nada; si se rellenan, se crea el registro en su listado.
  webUrl: z.string().trim(),
  domainName: z.string().trim(),
  hostProvider: z.string(),
})
export type ClientValues = z.infer<typeof clientSchema>

const extras = { webUrl: '', domainName: '', hostProvider: '' }
const empty: ClientValues = { company: '', contactName: '', email: '', phone: '', address: '', postalCode: '', province: '', country: 'España', taxId: '', status: 'PENDING', services: [], notes: '', packInterest: '', ...extras }

const toValues = (c: Client, extra: typeof extras = extras): ClientValues => ({ company: c.company, contactName: c.contactName, email: c.email, phone: c.phone, address: c.address, postalCode: c.postalCode, province: c.province, country: c.country, taxId: c.taxId, status: c.status, services: c.services, notes: c.notes, packInterest: c.packInterest ?? '', ...extra })

/** Lógica del formulario de cliente (alta y edición). La comparten el modal y la página «Nuevo cliente». */
const inOneYear = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}
const num = (v: string, fallback: number) => (v.trim() === '' ? fallback : Number(v.replace(',', '.')))
const hostOf = (url: string) => {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function useClientForm(client: Client | undefined, onDone: (saved?: Client) => void) {
  const create = clientsApi.useCreate()
  const update = clientsApi.useUpdate()
  const createWeb = websitesApi.useCreate()
  const createDomain = domainsApi.useCreate()
  const createHosting = hostingsApi.useCreate()
  const updateWeb = websitesApi.useUpdate(true)
  const updateDomain = domainsApi.useUpdate(true)
  const updateHosting = hostingsApi.useUpdate(true)
  const { data: settings } = useSettings()
  const { data: webs } = websitesApi.useList()
  const { data: domains } = domainsApi.useList()
  const { data: hostings } = hostingsApi.useList()

  // Registros ya guardados de este cliente: se muestran en el formulario y se actualizan en vez de duplicarse.
  const existing = useMemo(() => {
    if (!client) return { web: undefined, domain: undefined, hosting: undefined }
    const web: Website | undefined = (webs ?? []).find((w) => w.clientId === client.id && w.status !== 'ARCHIVED') ?? (webs ?? []).find((w) => w.clientId === client.id)
    const mine = <T extends { clientId: string; websiteId: string | null }>(list: T[] | undefined) => (list ?? []).filter((x) => x.clientId === client.id)
    const pick = <T extends { clientId: string; websiteId: string | null }>(list: T[] | undefined) => mine(list).find((x) => web && x.websiteId === web.id) ?? mine(list)[0]
    const domain: Domain | undefined = pick(domains)
    const hosting: Hosting | undefined = pick(hostings)
    return { web, domain, hosting }
  }, [client, webs, domains, hostings])
  const extraValues = useMemo(() => ({ webUrl: existing.web?.productionUrl ?? '', domainName: existing.domain?.name ?? existing.web?.domainName ?? '', hostProvider: existing.hosting?.provider ?? existing.web?.hostingProvider ?? '' }), [existing])

  const form = useForm<ClientValues>({ resolver: zodResolver(clientSchema), defaultValues: client ? toValues(client, extraValues) : empty })
  const submitting = create.isPending || update.isPending || createWeb.isPending || createDomain.isPending || createHosting.isPending || updateWeb.isPending || updateDomain.isPending || updateHosting.isPending

  /** Crea web, dominio y hosting solo si su apartado se ha rellenado; domino y hosting quedan enlazados a la web. */
  const createExtras = async (c: Client, v: ClientValues) => {
    const url = v.webUrl.trim()
    const hasWeb = !!url
    const hasDomain = !!v.domainName
    const hasHosting = !!v.hostProvider
    if (!hasWeb && !hasDomain && !hasHosting) return
    const domainName = v.domainName.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase() || hostOf(url)
    let websiteId: string | null = existing.web?.id ?? null
    if (hasWeb && existing.web) {
      const host = hostOf(url) || domainName || existing.web.domainName
      await updateWeb.mutateAsync({ id: existing.web.id, patch: { productionUrl: /^https?:\/\//i.test(url) ? url : `https://${url}`, domainName: host, hostingProvider: v.hostProvider } })
    } else if (hasWeb) {
      const host = hostOf(url) || domainName || guessDomain(c)
      const web = await createWeb.mutateAsync({
        clientId: c.id,
        name: c.company,
        status: 'DEVELOPMENT',
        technology: 'WORDPRESS',
        description: c.formData?.description ? `Solicitud original: ${c.formData.description}` : '',
        domainName: host,
        productionUrl: url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : `https://${host}`,
        stagingUrl: `https://staging.${host}`,
        repoUrl: '',
        mainBranch: 'main',
        hostingProvider: v.hostProvider,
        startDate: new Date().toISOString(),
        publishDate: null,
      })
      websiteId = web.id
    }
    if (hasDomain && existing.domain) {
      await updateDomain.mutateAsync({ id: existing.domain.id, patch: { name: domainName, websiteId: existing.domain.websiteId ?? websiteId } })
    } else if (hasDomain) {
      await createDomain.mutateAsync({
        clientId: c.id,
        websiteId,
        name: domainName,
        registrar: settings?.domainRegistrars[0] || '',
        registeredAt: new Date().toISOString(),
        renewsAt: inOneYear(),
        annualCost: 15,
        autoRenew: true,
        dns: '',
        nameservers: [],
        notes: '',
      })
    }
    if (hasHosting && existing.hosting) {
      await updateHosting.mutateAsync({ id: existing.hosting.id, patch: { provider: v.hostProvider, websiteId: existing.hosting.websiteId ?? websiteId } })
    } else if (hasHosting) {
      await createHosting.mutateAsync({
        clientId: c.id,
        websiteId,
        provider: v.hostProvider,
        plan: 'Básico',
        annualCost: 60,
        contractedAt: new Date().toISOString(),
        renewsAt: inOneYear(),
        active: true,
        notes: '',
      })
    }
  }

  const submit = form.handleSubmit(async (v) => {
    const { webUrl, domainName, hostProvider, packInterest, ...rest } = v
    const data = { ...rest, packInterest: (packInterest || null) as PackInterest | null }
    void webUrl, void domainName, void hostProvider
    let saved: Client
    if (client) saved = await update.mutateAsync({ id: client.id, patch: data })
    else saved = await create.mutateAsync({ ...data, archived: false, origin: 'MANUAL', sourceId: null, formData: null })
    await createExtras(saved, v)
    onDone(saved)
  })
  return { form, submit, submitting, extraValues, reset: (c?: Client) => form.reset(c ? toValues(c, extraValues) : empty) }
}

export function ClientFormFields({ form }: { form: UseFormReturn<ClientValues> }) {
  const { register, control, formState: { errors: e } } = form
  const { data: settings } = useSettings()
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
      <Field label="Pack de interés" hint="Lo rellena el formulario de la web; también puedes anotarlo a mano." htmlFor="c-pack" className="sm:col-span-2">
        <SelectField control={control} name="packInterest" id="c-pack" allowNone noneLabel="Sin indicar" options={PACK_INTERESTS.map((p) => ({ value: p, label: packInterestLabel(p) }))} />
      </Field>
      <Field label="Notas internas" hint="Solo las ves tú." htmlFor="c-notes" className="sm:col-span-2">
        <Textarea id="c-notes" rows={3} {...register('notes')} />
      </Field>

      <div className="sm:col-span-2">
        <p className="text-sm font-medium">Web, dominio y hosting (opcional)</p>
        <p className="text-muted-foreground text-xs">Si rellenas un apartado, se crea solo en su listado (la web se llamará como el negocio). El resto de datos (tecnología, registrador, renovación, costes…) se completan después desde Webs, Dominios y Hosting.</p>
      </div>
      <Field label="Web · dirección (URL)" htmlFor="c-weburl">
        <Input id="c-weburl" {...register('webUrl')} placeholder="https://midominio.com" />
      </Field>
      <Field label="Dominio" htmlFor="c-domname">
        <Input id="c-domname" {...register('domainName')} placeholder="midominio.com" />
      </Field>
      <Field label="Hosting · proveedor" htmlFor="c-hostprov">
        <SelectField control={control} name="hostProvider" id="c-hostprov" allowNone noneLabel="Sin hosting" options={(settings?.hostingProviders ?? []).map((p) => ({ value: p, label: p }))} />
      </Field>
    </>
  )
}

export function ClientFormDialog({ open, onOpenChange, client }: { open: boolean; onOpenChange: (o: boolean) => void; client?: Client }) {
  const { form, submit, submitting, reset, extraValues } = useClientForm(client, () => onOpenChange(false))
  useEffect(() => {
    if (open) reset(client)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id, extraValues])
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={client ? 'Editar cliente' : 'Nuevo cliente'} description={client ? client.company : 'Datos generales y servicios contratados.'} onSubmit={submit} submitting={submitting} submitLabel={client ? 'Guardar cambios' : 'Crear cliente'} wide>
      <ClientFormFields form={form} />
    </FormDialog>
  )
}
