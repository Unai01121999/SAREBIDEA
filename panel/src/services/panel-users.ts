// Gestión de los usuarios del panel. Crear cuentas, cambiar contraseñas y borrarlas exige permisos de administración de
// Authentication, que no pueden estar en el navegador: lo hace la función `manage-panel-users` (solo acepta al propietario con
// doble factor) y el resultado queda reflejado en la tabla `panel_users`.
import { supabase } from '@/lib/supabase'
import type { AdminUser, UserRole } from '@/types/domain'

async function call<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { data, error } = await supabase.functions.invoke('manage-panel-users', { body })
  if (error) {
    let message = error.message
    try {
      const res = (error as { context?: Response }).context
      const payload = res ? await res.json() : null
      if (payload?.error) message = payload.error
    } catch {
      /* se deja el mensaje genérico */
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

export const createPanelUser = (v: { name: string; email: string; role: Exclude<UserRole, 'OWNER'>; password?: string }) =>
  call<{ user: AdminUser; tempPassword: string }>({ action: 'create', ...v })

export const updatePanelUser = (id: string, patch: { name?: string; role?: Exclude<UserRole, 'OWNER'>; active?: boolean }) => call<{ user: AdminUser }>({ action: 'update', id, ...patch })

export const resetPanelUserPassword = (id: string) => call<{ tempPassword: string }>({ action: 'reset_password', id })

export const deletePanelUser = (id: string) => call<{ ok: true }>({ action: 'delete', id })
