// Archivo de la factura real. Con Supabase se guarda en el bucket privado «facturas» y se abre con una URL firmada de 5 minutos
// (el navegador la muestra en otra pestaña, sin descargarla). En modo demostración se guarda en el navegador como data URL.
import { supabase } from '@/lib/supabase'
import type { InvoiceFileItem } from '@/types/domain'

export const INVOICE_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
export const INVOICE_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf'
const BUCKET = 'facturas'
/** Ruta de un adjunto en el almacenamiento: «<id de factura>/<marca de tiempo>-<nombre saneado>». La base de datos exige lo mismo. */
const STORAGE_PATH = /^[A-Za-z0-9_-]+\/[0-9]+-[A-Za-z0-9._-]+$/
const MAX = supabase ? 10 * 1024 * 1024 : 1.5 * 1024 * 1024

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

export async function uploadInvoiceFile(invoiceId: string, file: File): Promise<InvoiceFileItem> {
  const base = { name: file.name, type: file.type, size: file.size, addedAt: new Date().toISOString() }
  if (!supabase) return { ...base, path: await toDataUrl(file) }
  const path = `${invoiceId}/${Date.now()}-${safe(file.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error
  return { ...base, path }
}

export async function removeInvoiceFile(path: string | null | undefined) {
  if (!path || path.startsWith('data:') || !supabase) return
  await supabase.storage.from(BUCKET).remove([path])
}

/** Abre el archivo en otra pestaña del navegador (sin descargarlo). */
export async function openInvoiceFile(file: Pick<InvoiceFileItem, 'path'>) {
  const tab = window.open('', '_blank') // se abre ya, dentro del clic, para que el navegador no bloquee la ventana
  try {
    let url: string
    if (!supabase) {
      // Modo demostración: el archivo está en el navegador como data URL. Solo PDF o imagen, y se abre con su tipo forzado
      // (nunca como HTML: un «data:text/html» guardado a mano no podría ejecutar nada en el panel).
      const m = /^data:([a-z/+.-]+)(;base64)?,/i.exec(file.path)
      const type = m?.[1].toLowerCase()
      if (!type || !INVOICE_FILE_TYPES.includes(type)) throw new Error('Archivo no válido')
      const bytes = Uint8Array.from(atob(file.path.slice(m![0].length)), (c) => c.charCodeAt(0))
      url = URL.createObjectURL(new Blob([bytes], { type }))
    } else {
      // Con Supabase solo se abren rutas del almacenamiento privado con el formato que crea uploadInvoiceFile.
      if (!STORAGE_PATH.test(file.path)) throw new Error('Archivo no válido')
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 300)
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
