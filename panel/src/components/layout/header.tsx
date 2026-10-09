'use client'

import { Building2, CheckSquare, ChevronDown, CreditCard, Globe, LogOut, Menu, Plus, Server, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SearchTrigger } from '@/components/layout/global-search'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCan, useMe } from '@/hooks/use-permissions'
import { roleLabel } from '@/lib/labels'
import type { Module } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { useUiStore } from '@/store/ui-store'

const QUICK: { label: string; href: string; icon: typeof Users; module: Module }[] = [
  { label: 'Nuevo cliente', href: '/clientes/nuevo', icon: Users, module: 'clients' },
  { label: 'Nueva web', href: '/webs/produccion?nuevo=1', icon: Globe, module: 'clients' },
  { label: 'Nuevo dominio', href: '/dominios?nuevo=1', icon: Building2, module: 'clients' },
  { label: 'Nuevo hosting', href: '/hosting?nuevo=1', icon: Server, module: 'clients' },
  { label: 'Nueva factura', href: '/facturacion?nuevo=1', icon: CreditCard, module: 'billing' },
  { label: 'Nueva tarea', href: '/tareas?nuevo=1', icon: CheckSquare, module: 'tasks' },
]

export function Header() {
  const setMobileNav = useUiStore((s) => s.setMobileNav)
  const me = useMe().data
  const can = useCan()
  const quick = QUICK.filter((q) => can(q.module, 'write'))
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir menú">
        <Menu />
      </Button>
      <SearchTrigger />
      <div className="ml-auto flex items-center gap-1.5">
        {quick.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="brand" size="sm">
              <Plus /> <span className="hidden sm:inline">Nuevo</span> <ChevronDown className="hidden size-3.5 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Crear</DropdownMenuLabel>
            {quick.map((q) => (
              <DropdownMenuItem key={q.href} asChild>
                <Link href={q.href}>
                  <q.icon /> {q.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        )}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 rounded-full outline-none" aria-label="Cuenta">
              <Avatar name={me?.name ?? 'Usuario'} size={32} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium text-foreground">{me?.name ?? '…'}</span>
              <span className="block font-normal">{me?.email}</span>
              {me && <span className="block font-normal">{roleLabel[me.role]}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {can('settings', 'read') && (
              <DropdownMenuItem asChild>
                <Link href="/configuracion">Configuración</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a href="/">
                <ArrowLeft /> Volver a la web
              </a>
            </DropdownMenuItem>
            {supabase && (
              <DropdownMenuItem onSelect={() => supabase?.auth.signOut().then(() => window.location.reload())}>
                <LogOut /> Cerrar sesión
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
