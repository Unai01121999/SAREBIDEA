'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { notesService } from '@/services/notes'

const KEY = ['notas-calendario']

export function useNotes() {
  return useQuery({ queryKey: KEY, queryFn: () => notesService.list() })
}

export function useNoteActions() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: KEY })
  const fail = (msg: string) => () => toast.error(msg)
  return {
    create: useMutation({ mutationFn: notesService.create, onSuccess: refresh, onError: fail('No se ha podido guardar la nota') }),
    update: useMutation({ mutationFn: (v: { id: string; text?: string; done?: boolean }) => notesService.update(v.id, v), onSuccess: refresh, onError: fail('No se ha podido guardar la nota') }),
    remove: useMutation({ mutationFn: notesService.remove, onSuccess: refresh, onError: fail('No se ha podido borrar la nota') }),
  }
}
