'use client'

import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useCan, useMe } from '@/hooks/use-permissions'
import { moduleOfPath } from '@/lib/permissions'
import { GlobalSearch } from '@/components/layout/global-search'
import { Header } from '@/components/layout/header'
import { LogoMark } from '@/components/layout/logo'
import { Sidebar, SidebarNav } from '@/components/layout/sidebar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useUiStore } from '@/store/ui-store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileNav = useUiStore((s) => s.setMobileNav)
  const me = useMe()
  const can = useCan()
  const pathname = usePathname()
  const needed = moduleOfPath(pathname)
  const forbidden = !!me.data && ((!!needed && !can(needed, 'read')) || (pathname.replace(/\/+$/, '') === '/clientes/nuevo' && !can('clients', 'write')))
  return (
    <div className="flex min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="contenido" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {me.isLoading ? (
            <div className="h-96 animate-pulse rounded-xl bg-muted/50" />
          ) : forbidden ? (
            <div className="mx-auto mt-16 max-w-md rounded-xl border bg-card p-8 text-center">
              <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
              <h1 className="mt-3 text-lg font-semibold">No tienes acceso a esta sección</h1>
              <p className="mt-1 text-sm text-muted-foreground">Tu rol no incluye este apartado. Si lo necesitas, pídeselo a la persona propietaria del panel.</p>
              <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/50" />}>{children}</Suspense>
          )}
        </main>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileNav}>
        <DialogContent side="left" className="bg-sidebar p-0">
          <DialogTitle className="sr-only">Menú</DialogTitle>
          <DialogDescription className="sr-only">Navegación principal</DialogDescription>
          <div className="flex h-14 items-center gap-2.5 px-4">
            <LogoMark />
            <p className="text-sm font-semibold tracking-tight">SAREBIDEA</p>
          </div>
          <SidebarNav onNavigate={() => setMobileNav(false)} />
        </DialogContent>
      </Dialog>
      <GlobalSearch />
    </div>
  )
}
