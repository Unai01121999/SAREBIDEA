'use client'

import { Building2, CheckSquare, CreditCard, Globe, Search, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { clientsApi, domainsApi, invoicesApi, tasksApi, websitesApi } from '@/hooks/use-entities'
import { NAV } from '@/lib/nav'
import { useUiStore } from '@/store/ui-store'

/** Botón de la cabecera que parece un campo de búsqueda y abre la paleta de comandos (⌘K / Ctrl+K). */
export function SearchTrigger() {
  const setOpen = useUiStore((s) => s.setSearchOpen)
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-9 min-w-0 flex-1 max-w-md items-center gap-2.5 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent/60"
    >
      <Search className="size-4" />
      <span className="min-w-0 flex-1 truncate text-left"><span className="sm:hidden">Buscar…</span><span className="hidden sm:inline">Buscar clientes, webs, dominios…</span></span>
      <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] sm:inline">Ctrl K</kbd>
    </button>
  )
}

export function GlobalSearch() {
  const open = useUiStore((s) => s.searchOpen)
  const setOpen = useUiStore((s) => s.setSearchOpen)
  const router = useRouter()
  const { data: clients } = clientsApi.useList()
  const { data: websites } = websitesApi.useList()
  const { data: domains } = domainsApi.useList()
  const { data: invoices } = invoicesApi.useList()
  const { data: tasks } = tasksApi.useList()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!useUiStore.getState().searchOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }
  const clientName = (id: string) => clients?.find((c) => c.id === id)?.company ?? ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[18%] max-w-2xl translate-y-0 overflow-hidden rounded-2xl p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
        <DialogDescription className="sr-only">Busca clientes, webs, dominios, facturas y tareas</DialogDescription>
        <Command>
          <CommandInput placeholder="Buscar clientes, webs, dominios, facturas, tareas…" />
          <CommandList>
            <CommandEmpty>No hay resultados.</CommandEmpty>
            <CommandGroup heading="Ir a">
              {NAV.flatMap((n) => (n.children ? n.children.map((c) => ({ ...c, icon: n.icon })) : [{ label: n.label, href: n.href, icon: n.icon }])).map((n) => (
                <CommandItem key={n.href} value={`ir ${n.label}`} onSelect={() => go(n.href)}>
                  <n.icon /> {n.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <Group heading="Clientes">
              {clients?.slice(0, 200).map((c) => (
                <CommandItem key={c.id} value={`cliente ${c.company} ${c.contactName} ${c.email} ${c.taxId}`} onSelect={() => go(`/clientes/${c.id}`)}>
                  <Users /> <span className="truncate">{c.company}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{c.contactName}</span>
                </CommandItem>
              ))}
            </Group>
            <Group heading="Webs">
              {websites?.map((w) => (
                <CommandItem key={w.id} value={`web ${w.name} ${w.domainName}`} onSelect={() => go(`/webs/ficha/${w.id}`)}>
                  <Globe /> <span className="truncate">{w.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{w.domainName}</span>
                </CommandItem>
              ))}
            </Group>
            <Group heading="Dominios">
              {domains?.map((d) => (
                <CommandItem key={d.id} value={`dominio ${d.name} ${clientName(d.clientId)}`} onSelect={() => go(`/dominios/${d.id}`)}>
                  <Building2 /> <span className="truncate">{d.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{clientName(d.clientId)}</span>
                </CommandItem>
              ))}
            </Group>
            <Group heading="Facturas">
              {invoices?.slice(0, 120).map((i) => (
                <CommandItem key={i.id} value={`factura ${i.number} ${clientName(i.clientId)}`} onSelect={() => go(`/facturacion?q=${encodeURIComponent(i.number)}`)}>
                  <CreditCard /> <span className="truncate">{i.number}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{clientName(i.clientId)}</span>
                </CommandItem>
              ))}
            </Group>
            <Group heading="Tareas">
              {tasks?.map((t) => (
                <CommandItem key={t.id} value={`tarea ${t.title}`} onSelect={() => go(`/tareas?q=${encodeURIComponent(t.title.split(' · ')[0])}`)}>
                  <CheckSquare /> <span className="truncate">{t.title}</span>
                </CommandItem>
              ))}
            </Group>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function Group({ heading, children }: { heading: string; children: ReactNode }) {
  if (!children) return null
  return <CommandGroup heading={heading}>{children}</CommandGroup>
}
