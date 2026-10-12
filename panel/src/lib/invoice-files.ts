// Archivo de la factura real. Con Supabase se guarda en el bucket privado «facturas» y se abre con una URL firmada de 5 minutos
// (el navegador la muestra en otra pestaña, sin descargarla). En modo demostración se guarda en el navegador como data URL.
import { supabase } from '@/lib/supabase'
import type { Invoice } from '@/types/domain'

export const INVOICE_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const INVOICE_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf'
const BUCKET = 'facturas'
const MAX = supabase ? 10 * 1024 * 1024 : 1.5 * 1024 * 1024

export type InvoiceFileInfo = { attachmentPath: string; attachmentName: string; attachmentType: string }

const safe = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80)
const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })

export function checkInvoiceFile(file: File): string | null {
  if (!INVOICE_FILE_TYPES.includes(file.type)) return 'Formato no válido: usa JPG, PNG, WEBP o PDF.'
  if (file.size > MAX) return `El archivo pesa demasiado (máximo ${supabase ? '10 MB' : '1,5 MB en modo demostración'}).`
  return null
}

export async function uploadInvoiceFile(invoiceId: string, file: File): Promise<InvoiceFileInfo> {
  if (!supabase) return { attachmentPath: await toDataUrl(file), attachmentName: file.name, attachmentType: file.type }
  const path = `${invoiceId}/${Date.now()}-${safe(file.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return { attachmentPath: path, attachmentName: file.name, attachmentType: file.type }
}

export async function removeInvoiceFile(path: string | null | undefined) {
  if (!path || path.startsWith('data:') || !supabase) return
  await supabase.storage.from(BUCKET).remove([path])
}

/** Abre el archivo en otra pestaña del navegador (sin descargarlo). */
export async function openInvoiceFile(inv: Pick<Invoice, 'attachmentPath' | 'attachmentType'>) {
  if (!inv.attachmentPath) return
  const tab = window.open('', '_blank') // se abre ya, dentro del clic, para que el navegador no bloquee la ventana
  try {
    let url: string
    if (inv.attachmentPath.startsWith('data:')) {
      const blob = await (await fetch(inv.attachmentPath)).blob()
      url = URL.createObjectURL(blob)
    } else {
      if (!supabase) throw new Error('Supabase no está configurado')
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(inv.attachmentPath, 300)
      if (error || !data) throw error ?? new Error('Sin URL')
      url = data.signedUrl
    }
    if (tab) tab.location.href = url
    else window.location.href = url
  } catch (e) {
    tab?.close()
    throw e
  }
}
