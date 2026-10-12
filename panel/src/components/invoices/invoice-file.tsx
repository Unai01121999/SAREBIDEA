'use client'

import { Eye, Paperclip, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { invoicesApi } from '@/hooks/use-entities'
import { useCan } from '@/hooks/use-permissions'
import { checkInvoiceFile, INVOICE_FILE_ACCEPT, openInvoiceFile, removeInvoiceFile, uploadInvoiceFile } from '@/lib/invoice-files'
import type { Invoice } from '@/types/domain'

/**
 * Archivo de la factura real: «Ver» lo abre en otra pestaña (sin descargarlo); «Adjuntar / Cambiar / Quitar» solo con permiso de edición.
 * Se usa en el listado de Facturación y en la pestaña Facturación de la ficha del cliente.
 */
export function InvoiceFile({ invoice, compact = false }: { invoice: Invoice; compact?: boolean }) {
  const canWrite = useCan()('billing', 'write')
  const update = invoicesApi.useUpdate(true)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const has = !!invoice.attachmentPath

  const view = async () => {
    try {
      await openInvoiceFile(invoice)
    } catch {
      toast.error('No se ha podido abrir el archivo')
    }
  }
  const pick = async (file?: File) => {
    if (!file) return
    const problem = checkInvoiceFile(file)
    if (problem) return void toast.error(problem)
    setBusy(true)
    try {
      const info = await uploadInvoiceFile(invoice.id, file)
      await update.mutateAsync({ id: invoice.id, patch: info })
      if (invoice.attachmentPath) void removeInvoiceFile(invoice.attachmentPath)
      toast.success('Archivo de la factura guardado')
    } catch {
      toast.error('No se ha podido adjuntar el archivo')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const remove = async () => {
    setBusy(true)
    try {
      await update.mutateAsync({ id: invoice.id, patch: { attachmentPath: null, attachmentName: null, attachmentType: null } })
      void removeInvoiceFile(invoice.attachmentPath)
      toast.success('Archivo quitado')
    } catch {
      toast.error('No se ha podido quitar el archivo')
    } finally {
      setBusy(false)
    }
  }

  if (!has && !canWrite) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {has && (
        <Button type="button" variant="outline" size="sm" onClick={view} title={`Ver ${invoice.attachmentName ?? 'archivo'} en otra pestaña`} aria-label={`Ver el archivo de la factura ${invoice.number} en otra pestaña`}>
          <Eye /> {compact ? '' : 'Ver'}
        </Button>
      )}
      {canWrite && (
        <>
          <input ref={input} type="file" accept={INVOICE_FILE_ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void pick(e.target.files?.[0])} />
          <Button type="button" variant={has ? 'ghost' : 'outline'} size="sm" disabled={busy} onClick={() => input.current?.click()} title="Adjuntar JPG, PNG, WEBP o PDF" aria-label={`${has ? 'Cambiar' : 'Adjuntar'} el archivo de la factura ${invoice.number}`}>
            <Paperclip /> {has ? (compact ? '' : 'Cambiar') : 'Adjuntar'}
          </Button>
          {has && (
            <Button type="button" variant="ghost" size="icon-sm" disabled={busy} onClick={remove} aria-label={`Quitar el archivo de la factura ${invoice.number}`} title="Quitar archivo">
              <X />
            </Button>
          )}
        </>
      )}
    </div>
  )
}
