'use client'

import { useEffect, useMemo, useState } from 'react'
import { Field } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientsApi, invoicesApi, useSettings, websitesApi } from '@/hooks/use-entities'
import { formatCurrency } from '@/lib/format'
import { PACKS } from '@/lib/packs'
import { guessDomain } from '@/lib/prefill'
import { cn } from '@/lib/utils'
import { PACK_TYPES, type PackType } from '@/types/domain'

/** Alta de una web vendida como pack: crea la web y, si se quiere, la factura del pack y la del primer mes de mantenimiento. */
export function PackDialog({ open, onOpenChange, clientId }: { open: boolean; onOpenChange: (o: boolean) => void; clientId?: string }) {
  const { data: clients } = clientsApi.useList()
  const { data: invoices } = invoicesApi.useList()
  const { data: settings } = useSettings()
  const createWeb = websitesApi.useCreate()
  const createInvoice = invoicesApi.useCreate()
  const [client, setClient] = useState('')
  const [pack, setPack] = useState<PackType>('STARTER')
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [billPack, setBillPack] = useState(true)
  const [billMaint, setBillMaint] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setClient(clientId ?? '')
      setPack('STARTER')
      setName('')
      setDomain('')
      setBillPack(true)
      setBillMaint(true)
      setError('')
    }
  }, [open, clientId])

  const selected = clients?.find((c) => c.id === client)
  const vat = settings?.taxes.vat ?? 21
  const p = PACKS[pack]
  const numbers = useMemo(() => {
    const year = new Date().getFullYear()
    const max = (invoices ?? []).filter((i) => i.number.startsWith(`F-${year}-`)).reduce((m, i) => Math.max(m, Number(i.number.split('-')[2]) || 0), 0)
    return (n: number) => `F-${year}-${String(max + n).padStart(3, '0')}`
  }, [invoices])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return setError('Elige un cliente')
    setError('')
    const host = (domain.trim() || guessDomain(selected)).replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()
    const now = new Date()
    const web = await createWeb.mutateAsync({
      clientId: selected.id,
      name: name.trim() || `${p.label} · ${selected.company}`,
      status: 'DEVELOPMENT',
      technology: 'WORDPRESS',
      description: `${p.label}: ${formatCurrency(p.price)} + IVA y mantenimiento de ${formatCurrency(p.maintenance)}/mes.`,
      domainName: host,
      productionUrl: `https://${host}`,
      stagingUrl: `https://staging.${host}`,
      repoUrl: '',
      mainBranch: 'main',
      hostingProvider: '',
      pack,
      startDate: now.toISOString(),
      publishDate: null,
    })
    const due = new Date(now.getTime() + 30 * 864e5).toISOString()
    let n = 1
    const base = { clientId: selected.id, issuedAt: now.toISOString(), dueAt: due, taxRate: vat, status: 'PENDING' as const, websiteId: web.id, domainId: null, hostingId: null }
    if (billPack) await createInvoice.mutateAsync({ ...base, number: numbers(n++), concept: 'WEB_DEVELOPMENT', description: `${p.label} · diseño y desarrollo web`, subtotal: p.price, recurring: false })
    if (billMaint) await createInvoice.mutateAsync({ ...base, number: numbers(n++), concept: 'MAINTENANCE', description: `Mantenimiento mensual ${p.label} (${p.maintenance} €/mes)`, subtotal: p.maintenance, recurring: true })
    onOpenChange(false)
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Añadir pack" description="Crea la web del cliente con el pack elegido y sus facturas." onSubmit={submit} submitting={createWeb.isPending || createInvoice.isPending} submitLabel="Añadir pack" wide>
      <Field label="Cliente" required error={error} htmlFor="pk-client" className="sm:col-span-2">
        <Select value={client} onValueChange={setClient}>
          <SelectTrigger id="pk-client"><SelectValue placeholder="Elige un cliente" /></SelectTrigger>
          <SelectContent>
            {(clients ?? []).filter((c) => !c.archived).map((c) => <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3" role="radiogroup" aria-label="Pack">
        {PACK_TYPES.map((k) => (
          <button key={k} type="button" role="radio" aria-checked={pack === k} onClick={() => setPack(k)} className={cn('rounded-lg border p-3 text-left transition-colors', pack === k ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted')}>
            <p className="text-sm font-semibold">{PACKS[k].label}</p>
            <p className="tabular text-lg font-semibold">{PACKS[k].price} € <span className="text-xs font-normal text-muted-foreground">+ IVA</span></p>
            <p className="text-xs text-muted-foreground">Mantenimiento {PACKS[k].maintenance} €/mes</p>
          </button>
        ))}
      </div>
      <Field label="Nombre de la web" hint="Vacío = «Pack · empresa»." htmlFor="pk-name">
        <Input id="pk-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Dominio" hint="Vacío = se deduce del cliente." htmlFor="pk-domain">
        <Input id="pk-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="midominio.com" />
      </Field>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="mt-1" checked={billPack} onChange={(e) => setBillPack(e.target.checked)} />
        <span>Crear factura del pack: {formatCurrency(p.price)} + {vat} % IVA = {formatCurrency(p.price * (1 + vat / 100))}</span>
      </label>
      <label className="flex items-start gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="mt-1" checked={billMaint} onChange={(e) => setBillMaint(e.target.checked)} />
        <span>Crear factura recurrente del primer mes de mantenimiento: {formatCurrency(p.maintenance)} + IVA</span>
      </label>
    </FormDialog>
  )
}
