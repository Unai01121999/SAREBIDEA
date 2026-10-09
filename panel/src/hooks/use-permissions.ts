'use client'

import { useQuery } from '@tanstack/react-query'
import { can, type Module } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/domain'

export interface Me {
  name: string
  email: string
  role: UserRole
}

const DEMO: Me = { name: 'Unai Padura Larrea', email: 'sarebidea@sarebidea.com', role: 'OWNER' }

/** Persona que ha iniciado sesión: nombre, correo y rol (de la tabla panel_users). Sin Supabase (demo) es el propietario. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Me | null> => {
      if (!supabase) return DEMO
      const { data, error } = await supabase.rpc('panel_me')
      if (error) throw error
      return (data as Me | null) ?? null
    },
  })
}

/** `can('billing', 'write')`: ¿puede esta persona hacerlo? Mientras carga el rol, responde que no. */
export function useCan() {
  const role = useMe().data?.role
  return (module: Module, action: 'read' | 'write' = 'read') => can(role, module, action)
}
