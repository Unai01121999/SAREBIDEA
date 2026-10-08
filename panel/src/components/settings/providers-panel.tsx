'use client'

import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettings, useUpdateSettings } from '@/hooks/use-entities'

function EditableList({ title, description, items, onChange }: { title: string; description: string; items: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v && !items.some((i) => i.toLowerCase() === v.toLowerCase())) onChange([...items, v])
    setDraft('')
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pr-1.5 pl-3 text-sm">
              {i}
              <button type="button" onClick={() => onChange(items.filter((x) => x !== i))} aria-label={`Quitar ${i}`} className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive">
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Añadir proveedor…" aria-label={`Añadir a ${title}`} />
          <Button type="submit" variant="outline" disabled={!draft.trim()}>
            <Plus /> Añadir
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ProvidersPanel() {
  const { data } = useSettings()
  const save = useUpdateSettings()
  if (!data) return <Skeleton className="h-64" />
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <EditableList title="Proveedores de hosting" description="Aparecen al crear webs y hosting." items={data.hostingProviders} onChange={(hostingProviders) => save.mutate({ hostingProviders })} />
      <EditableList title="Registradores de dominios" description="Aparecen al crear dominios." items={data.domainRegistrars} onChange={(domainRegistrars) => save.mutate({ domainRegistrars })} />
    </div>
  )
}
