'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dataSource } from '@/services'
import type { AppSettings, EntityMap, EntityName, NewEntity } from '@/types/domain'

const NOUN: Record<EntityName, string> = { clients: 'Cliente', websites: 'Web', domains: 'Dominio', hostings: 'Hosting', invoices: 'Factura', tasks: 'Tarea', users: 'Usuario' }

/** Hooks de TanStack Query para una entidad: listado, detalle y mutaciones con invalidación de caché. */
function createEntityHooks<K extends EntityName>(name: K) {
  type T = EntityMap[K]
  const repo = () => dataSource.repo(name)

  function useList() {
    return useQuery({ queryKey: [name], queryFn: () => repo().list() })
  }
  function useOne(id: string | undefined) {
    return useQuery({ queryKey: [name, id], queryFn: () => repo().get(id!), enabled: !!id })
  }
  function useInvalidate() {
    const qc = useQueryClient()
    // Un cambio puede afectar a otras entidades (cascadas) y a la actividad reciente.
    return () => qc.invalidateQueries()
  }
  function useCreate() {
    const done = useInvalidate()
    return useMutation({
      mutationFn: (input: NewEntity<T>) => repo().create(input),
      onSuccess: () => {
        done()
        toast.success(`${NOUN[name]} creado`)
      },
      onError: () => toast.error('No se ha podido crear'),
    })
  }
  function useUpdate(silent = false) {
    const done = useInvalidate()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<NewEntity<T>> }) => repo().update(id, patch),
      onSuccess: () => {
        done()
        if (!silent) toast.success('Cambios guardados')
      },
      onError: () => toast.error('No se han podido guardar los cambios'),
    })
  }
  function useRemove() {
    const done = useInvalidate()
    return useMutation({
      mutationFn: (id: string) => repo().remove(id),
      onSuccess: () => {
        done()
        toast.success(`${NOUN[name]} eliminado`)
      },
      onError: () => toast.error('No se ha podido eliminar'),
    })
  }
  return { useList, useOne, useCreate, useUpdate, useRemove }
}

export const clientsApi = createEntityHooks('clients')
export const websitesApi = createEntityHooks('websites')
export const domainsApi = createEntityHooks('domains')
export const hostingsApi = createEntityHooks('hostings')
export const invoicesApi = createEntityHooks('invoices')
export const tasksApi = createEntityHooks('tasks')
export const usersApi = createEntityHooks('users')

export const useActivity = () => useQuery({ queryKey: ['activity'], queryFn: () => dataSource.activity.list() })

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: () => dataSource.settings.get() })
export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<AppSettings>) => dataSource.settings.update(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Ajustes guardados')
    },
  })
}
export function useResetData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => dataSource.reset?.(),
    onSuccess: () => {
      qc.invalidateQueries()
      toast.success('Datos de ejemplo restablecidos')
    },
  })
}
