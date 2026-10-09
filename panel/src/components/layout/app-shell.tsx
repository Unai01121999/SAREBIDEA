'use client'

import { Suspense } from 'react'
import { GlobalSearch } from '@/components/layout/global-search'
import { Header } from '@/components/layout/header'
import { LogoMark } from '@/components/layout/logo'
import { Sidebar, SidebarNav } from '@/components/layout/sidebar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useUiStore } from '@/store/ui-store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileNav = useUiStore((s) => s.setMobileNav)
  return (
    <div className="flex min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="contenido" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted/50" />}>{children}</Suspense>
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
