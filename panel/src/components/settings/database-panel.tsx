'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CloudUpload, Database, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { discardLocalData, importLocalData, localCounts, readLocalData } from '@/services/import-local'

/** Pestaña «Datos» cuando el panel está conectado a Supabase. */
export function DatabasePanel() {
  const qc = useQueryClient()
  const [local, setLocal] = useState(() => localCounts(readLocalData()))
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<'upload' | 'discard' | null>(null)
  const total = Object.values(local).reduce((a, b) => a + b, 0)

  const upload = async () => {
    setBusy(true)
    try {
      const n = await importLocalData()
      discardLocalData()
      setLocal(localCounts(null))
      qc.invalidateQueries()
      toast.success(`${n} registros subidos a Supabase`)
      setConfirm(null)
    } catch (e) {
      toast.error(`No se ha podido subir: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }
  const discard = () => {
    discardLocalData()
    setLocal(localCounts(null))
    setConfirm(null)
    toast.success('Datos de este navegador eliminados')
  }

  return (
    <div className="grid max-w-2xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" /> Base de datos Supabase
          </CardTitle>
          <CardDescription>Conectada. Clientes, webs, dominios, hosting, facturas, tareas, usuarios, ajustes y actividad se guardan en Supabase, y las solicitudes del formulario crean su cliente automáticamente. Solo tu cuenta con doble factor puede acceder.</CardDescription>
        </CardHeader>
      </Card>
      {total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="size-4 text-muted-foreground" /> Datos guardados solo en este navegador
            </CardTitle>
            <CardDescription>
              Se encontraron {local.clients} clientes, {local.websites} webs, {local.domains} dominios, {local.hostings} hostings, {local.invoices} facturas y {local.tasks} tareas de antes de conectar la base de datos. Si son de ejemplo, no los subas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => setConfirm('upload')}>
              <CloudUpload /> Subir a Supabase
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirm('discard')}>
              <Trash2 /> Descartarlos
            </Button>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog open={confirm === 'upload'} onOpenChange={(o) => !o && setConfirm(null)} title="Subir los datos de este navegador" description="Se copiarán a Supabase (lo que ya exista no se sobrescribe) y se borrarán de este navegador. Si los datos son de ejemplo, también se subirán." confirmLabel="Subir" loading={busy} onConfirm={upload} />
      <ConfirmDialog open={confirm === 'discard'} onOpenChange={(o) => !o && setConfirm(null)} title="Descartar los datos de este navegador" description="Se borrarán de este navegador y no se subirán a Supabase. No afecta a lo que ya está en la base de datos." confirmLabel="Descartar" onConfirm={discard} />
    </div>
  )
}
