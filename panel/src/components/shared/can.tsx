'use client'

import { useCan } from '@/hooks/use-permissions'
import type { Module } from '@/lib/permissions'

/** Muestra su contenido solo si el rol de la persona permite esa acción en ese módulo. */
export function Can({ module, action = 'write', children }: { module: Module; action?: 'read' | 'write'; children: React.ReactNode }) {
  const can = useCan()
  return can(module, action) ? <>{children}</> : null
}
