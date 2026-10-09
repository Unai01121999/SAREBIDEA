'use client'

import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCan } from '@/hooks/use-permissions'
import type { Module } from '@/lib/permissions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export interface RowAction {
  label: string
  icon?: React.ReactNode
  onSelect: () => void
  destructive?: boolean
  separatorBefore?: boolean
}

/** Menú «⋯» al final de cada fila. Detiene la propagación para no abrir la ficha de la fila. */
export function RowActions({ actions, label = 'Acciones', module = 'clients' }: { actions: RowAction[]; label?: string; module?: Module }) {
  const can = useCan()
  if (!can(module, 'write')) return null // rol de solo lectura: sin editar ni borrar
  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={label}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((a) => (
            <div key={a.label}>
              {a.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem destructive={a.destructive} onSelect={a.onSelect}>
                {a.icon} {a.label}
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
