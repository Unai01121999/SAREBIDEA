'use client'

import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogoMark } from '@/components/layout/logo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isActive, NAV, type NavItem } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui-store'

/** Contenido de la navegación. Se reutiliza en la barra fija (escritorio) y en el cajón (móvil). */
export function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5 px-3 py-2">
      {NAV.map((item) => (
        <NavEntry key={item.href} item={item} pathname={pathname} collapsed={collapsed} expanded={open[item.href] ?? isActive(pathname, item.href)} onToggle={() => setOpen((o) => ({ ...o, [item.href]: !(o[item.href] ?? isActive(pathname, item.href)) }))} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}

function NavEntry({ item, pathname, collapsed, expanded, onToggle, onNavigate }: { item: NavItem; pathname: string; collapsed: boolean; expanded: boolean; onToggle: () => void; onNavigate?: () => void }) {
  const active = isActive(pathname, item.href)
  const Icon = item.icon
  const row = 'group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors'
  const state = active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'

  const content = (
    <>
      <Icon className={cn('size-[18px] shrink-0', active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground')} />
      {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
    </>
  )

  // Elementos con submenú: en modo colapsado enlazan directamente a la primera opción.
  if (item.children && !collapsed) {
    return (
      <div>
        <button type="button" aria-expanded={expanded} onClick={onToggle} className={cn(row, state, 'w-full')}>
          {content}
          <ChevronDown className={cn('size-3.5 shrink-0 opacity-60 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <ul className="mt-0.5 mb-1 ml-[1.15rem] flex flex-col gap-0.5 border-l pl-3">
            {item.children.map((c) => {
              const childActive = pathname === c.href
              return (
                <li key={c.href}>
                  <Link href={c.href} onClick={onNavigate} className={cn('flex h-8 items-center rounded-md px-2.5 text-[13px] transition-colors', childActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground')}>
                    {c.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  const link = (
    <Link href={item.children?.[0]?.href ?? item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn(row, state, collapsed && 'justify-center px-0')}>
      {content}
    </Link>
  )
  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  ) : (
    link
  )
}

/** Barra lateral fija y colapsable (solo escritorio). */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  return (
    <aside
      className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex', collapsed ? 'w-[68px]' : 'w-64')}
    >
      <div className={cn('flex h-14 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}>
        <LogoMark />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">SAREBIDEA</p>
            <p className="truncate text-[11.5px] text-muted-foreground">Panel de gestión</p>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex justify-center')}>
        <button type="button" onClick={toggle} aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} className="flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && 'Contraer menú'}
        </button>
      </div>
    </aside>
  )
}
