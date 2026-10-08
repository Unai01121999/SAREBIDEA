'use client'

import { Link2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { clientsApi, domainsApi, hostingsApi, useSettings, websitesApi } from '@/hooks/use-entities'
import { fullAddress, type PrefillContext } from '@/lib/prefill'
import { routes } from '@/lib/routes'
import type { Client } from '@/types/domain'

/** Datos relacionados (clientes, webs, dominios, hosting) para proponer valores en los formularios. */
export function usePrefillData() {
  const clients = clientsApi.useList().data
  const websites = websitesApi.useList().data
  const domains = domainsApi.useList().data
  const hostings = hostingsApi.useList().data
  const settings = useSettings().data
  const ctx: PrefillContext = useMemo(() => ({ websites: websites ?? [], domains: domains ?? [], hostings: hostings ?? [] }), [websites, domains, hostings])
  const ready = !!(clients && websites && domains && hostings)
  return { clients: clients ?? [], ctx, settings, ready, clientById: (id?: string) => clients?.find((c) => c.id === id) }
}

/**
 * Rellena SOLO los campos que la persona todavía no ha tocado (no pisa lo que ya escribió).
 * Los valores indefinidos o vacíos se ignoran.
 */
export function applyDefaults<T extends FieldValues>(form: UseFormReturn<T>, defaults: Partial<Record<Path<T>, unknown>>) {
  const dirty = form.formState.dirtyFields as Record<string, unknown>
  for (const [key, value] of Object.entries(defaults)) {
    if (value === undefined || value === null || value === '') continue
    if (dirty[key]) continue
    form.setValue(key as Path<T>, value as never, { shouldDirty: false, shouldValidate: false })
  }
}

/** Resumen del cliente elegido, con enlace a su ficha: confirma de dónde salen los datos precargados. */
export function ClientContext({ client, note, showFiscal }: { client?: Client; note?: string; showFiscal?: boolean }) {
  if (!client) return null
  return (
    <div className="flex items-start gap-3 rounded-lg border border-brand/25 bg-brand/5 px-3.5 py-2.5 text-sm sm:col-span-2">
      <Link2 className="mt-0.5 size-4 shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {client.company}
          <span className="font-normal text-muted-foreground"> · {client.contactName}</span>
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {client.email}
          {client.phone ? ` · ${client.phone}` : ''}
          {showFiscal && ` · ${client.taxId || 'Sin CIF/NIF'} · ${fullAddress(client) || 'Sin dirección'}`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{note ?? 'Datos tomados de la ficha del cliente. Los campos se rellenan solos y puedes cambiarlos.'}</p>
      </div>
      <Link href={routes.client(client.id)} className="shrink-0 text-xs font-medium text-brand hover:underline">
        Ver ficha
      </Link>
    </div>
  )
}
