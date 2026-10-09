// Permisos por rol. Es la misma tabla que aplica la base de datos (función panel_can y políticas RLS):
// aquí solo sirve para mostrar u ocultar secciones y botones; la seguridad real está en Supabase.
import type { UserRole } from '@/types/domain'

export type Module = 'clients' | 'tasks' | 'billing' | 'settings'
export type Access = 'full' | 'read' | 'none'

export const ACCESS: Record<UserRole, Record<Module, Access>> = {
  OWNER: { clients: 'full', tasks: 'full', billing: 'full', settings: 'full' },
  ADMIN: { clients: 'full', tasks: 'full', billing: 'full', settings: 'read' },
  EDITOR: { clients: 'full', tasks: 'full', billing: 'read', settings: 'none' },
  VIEWER: { clients: 'read', tasks: 'read', billing: 'none', settings: 'none' },
}

export function can(role: UserRole | undefined, module: Module, action: 'read' | 'write' = 'read') {
  if (!role) return false
  const a = ACCESS[role][module]
  return action === 'read' ? a !== 'none' : a === 'full'
}

/** Módulo al que pertenece una ruta (`null` = abierta a cualquier usuario con acceso, como el dashboard). */
export function moduleOfPath(pathname: string): Module | null {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/') return null
  if (p.startsWith('/facturacion')) return 'billing'
  if (p.startsWith('/tareas')) return 'tasks'
  if (p.startsWith('/configuracion')) return 'settings'
  if (['/clientes', '/webs', '/dominios', '/hosting'].some((x) => p === x || p.startsWith(`${x}/`))) return 'clients'
  return null
}
