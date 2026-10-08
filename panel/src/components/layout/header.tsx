'use client'

import { CheckSquare, ChevronDown, CreditCard, Globe, Menu, Plus, Server, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { SearchTrigger } from '@/components/layout/global-search'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useUiStore } from '@/store/ui-store'

const QUICK = [
  { label: 'Nuevo cliente', href: '/clientes/nuevo', icon: Users },
  { label: 'Nueva web', href: '/webs/produccion?nuevo=1', icon: Globe },
  { label: 'Nuevo dominio', href: '/dominios?nuevo=1', icon: Building2 },
  { label: 'Nuevo hosting', href: '/hosting?nuevo=1', icon: Server },
  { label: 'Nueva factura', href: '/facturacion?nuevo=1', icon: CreditCard },
  { label: 'Nueva tarea', href: '/tareas?nuevo=1', icon: CheckSquare },
]

export function Header() {
  const setMobileNav = useUiStore((s) => s.setMobileNav)
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir menú">
        <Menu />
      </Button>
      <SearchTrigger />
      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="brand" size="sm">
              <Plus /> <span className="hidden sm:inline">Nuevo</span> <ChevronDown className="hidden size-3.5 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Crear</DropdownMenuLabel>
            {QUICK.map((q) => (
              <DropdownMenuItem key={q.href} asChild>
                <Link href={q.href}>
                  <q.icon /> {q.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ml-1 rounded-full outline-none" aria-label="Cuenta">
              <Avatar name="Unai Padura" size={32} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block text-sm font-medium text-foreground">Unai Padura Larrea</span>
              <span className="block font-normal">sarebidea@sarebidea.com</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configuracion">Configuración</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
