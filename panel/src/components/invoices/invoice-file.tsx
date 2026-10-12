'use client'

import { Eye, FileText, ImageIcon, Paperclip, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { invoicesApi } from '@/hooks/use-entities'
import { useCan } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/format'
import { checkInvoiceFile, INVOICE_FILE_ACCEPT, openInvoiceFile, removeInvoiceFile, uploadInvoiceFile } from '@/lib/invoice-files'
import { routes } from '@/lib/routes'
import type { Invoice, InvoiceFileItem } from '@/types/domain'

const sizeLabel = (n: number) => (n <= 0 ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)

const view = async (f: InvoiceFileItem) => {
  try {
    await openInvoiceFile(f)
  } catch {
    toast.error('No se ha podido abrir el archivo')
  }
}

/** Alta y baja de archivos de una factura (puede tener varios). */
function useInvoiceFiles(invoice: Invoice) {
  const update = invoicesApi.useUpdate(true)
  const [busy, setBusy] = useState(false)
  const files = invoice.files ?? []

  const add = async (list: FileList | File[] | null | undefined) => {
    const picked = Array.from(list ?? [])
    if (!picked.length) return
    const bad = picked.map((f) => ({ f, problem: checkInvoiceFile(f) })).find((x) => x.problem)
    if (bad) return void toast.error(`${bad.f.name}: ${bad.problem}`)
    setBusy(true)
    const done: InvoiceFileItem[] = []
    try {
      for (const f of picked) done.push(await uploadInvoiceFile(invoice.id, f))
      await update.mutateAsync({ id: invoice.id, patch: { files: [...files, ...done] } })
      toast.success(done.length === 1 ? 'Archivo adjuntado' : `${done.length} archivos adjuntados`)
    } catch {
      for (const d of done) void removeInvoiceFile(d.path)
      toast.error('No se han podido adjuntar los archivos')
    } finally {
      setBusy(false)
    }
  }
  const remove = async (f: InvoiceFileItem) => {
    setBusy(true)
    try {
      await update.mutateAsync({ id: invoice.id, patch: { files: files.filter((x) => x.path !== f.path) } })
      void removeInvoiceFile(f.path)
      toast.success('Archivo quitado')
    } catch {
      toast.error('No se ha podido quitar el archivo')
    } finally {
      setBusy(false)
    }
  }
  return { files, busy, add, remove }
}

/** Control compacto para las tablas: «Ver» (con menú si hay varios archivos) y «Adjuntar». La gestión completa está en la ficha de la factura. */
export function InvoiceFile({ invoice }: { invoice: Invoice }) {
  const canWrite = useCan()('billing', 'write')
  const { files, busy, add } = useInvoiceFiles(invoice)
  const input = useRef<HTMLInputElement>(null)
  if (!files.length && !canWrite) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {files.length === 1 && (
        <Button type="button" variant="outline" size="sm" onClick={() => view(files[0])} title={`Ver ${files[0].name} en otra pestaña`} aria-label={`Ver el archivo de la factura ${invoice.number} en otra pestaña`}>
          <Eye /> Ver
        </Button>
      )}
      {files.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" aria-label={`Ver los ${files.length} archivos de la factura ${invoice.number}`}>
              <Eye /> Ver ({files.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {files.map((f) => (
              <DropdownMenuItem key={f.path} onSelect={() => void view(f)}>
                <FileIcon type={f.type} /> <span className="max-w-[220px] truncate">{f.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canWrite && (
        <>
          <input ref={input} type="file" multiple accept={INVOICE_FILE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void add(e.target.files); e.target.value = '' }} />
          <Button type="button" variant={files.length ? 'ghost' : 'outline'} size={files.length ? 'icon-sm' : 'sm'} disabled={busy} onClick={() => input.current?.click()} title="Adjuntar JPG, PNG, WEBP o PDF" aria-label={`Adjuntar archivos a la factura ${invoice.number}`}>
            <Paperclip /> {files.length ? '' : 'Adjuntar'}
          </Button>
        </>
      )}
    </div>
  )
}

function FileIcon({ type }: { type: string }) {
  return type === 'application/pdf' ? <FileText className="size-4 shrink-0 text-muted-foreground" /> : <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
}

/** Tarjeta «Archivos adjuntos» de la ficha de la factura: lista, «Ver» en otra pestaña, quitar y adjuntar varios. */
export function InvoiceFilesPanel({ invoice }: { invoice: Invoice }) {
  const canWrite = useCan()('billing', 'write')
  const { files, busy, add, remove } = useInvoiceFiles(invoice)
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle>Archivos adjuntos</CardTitle>
          <p className="text-[13px] text-muted-foreground">{files.length ? `${files.length} ${files.length === 1 ? 'archivo' : 'archivos'}` : 'La factura real (JPG, PNG, WEBP o PDF, máx. 10 MB cada uno).'}</p>
        </div>
        {canWrite && (
          <>
            <input ref={input} type="file" multiple accept={INVOICE_FILE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="invoice-files-input" onChange={(e) => { void add(e.target.files); e.target.value = '' }} />
            <Button size="sm" disabled={busy} onClick={() => input.current?.click()}>
              <Paperclip /> Adjuntar archivos
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent>
        {files.length > 0 ? (
          <ul className="divide-y">
            {files.map((f) => (
              <li key={f.path} className="flex items-center gap-3 py-2.5 text-sm">
                <FileIcon type={f.type} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{f.name}</span>
                  <span className="block text-xs text-muted-foreground">{[sizeLabel(f.size), `añadido el ${formatDate(f.addedAt)}`].filter(Boolean).join(' · ')}</span>
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => view(f)} aria-label={`Ver ${f.name} en otra pestaña`}>
                  <Eye /> Ver
                </Button>
                {canWrite && (
                  <Button type="button" variant="ghost" size="icon-sm" disabled={busy} onClick={() => remove(f)} aria-label={`Quitar ${f.name}`} title="Quitar archivo">
                    <Trash2 />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div
            onDragOver={(e) => canWrite && (e.preventDefault(), setDrag(true))}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { if (!canWrite) return; e.preventDefault(); setDrag(false); void add(e.dataTransfer.files) }}
            className={`rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground ${drag ? 'border-primary bg-primary/5' : ''}`}
          >
            Todavía no hay archivos.{canWrite ? ' Pulsa «Adjuntar archivos» o arrástralos aquí.' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Enlace al detalle de la factura. */
export function InvoiceLink({ invoice, className }: { invoice: Pick<Invoice, 'id' | 'number'>; className?: string }) {
  return (
    <Link href={routes.invoice(invoice.id)} onClick={(e) => e.stopPropagation()} className={className ?? 'font-medium tabular hover:text-brand hover:underline'}>
      {invoice.number}
    </Link>
  )
}
