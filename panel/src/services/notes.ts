// Notas del calendario. Con Supabase se guardan en la tabla `notas_calendario` (protegida por RLS con el permiso de tareas);
// en modo demostración, en el navegador (localStorage).
import { supabase } from '@/lib/supabase'
import { uid } from '@/lib/utils'
import type { CalendarNote } from '@/types/domain'

const LS_KEY = 'sarebidea.panel.notas-calendario'

interface Row {
  id: string
  dia: string
  texto: string
  hecha: boolean
  autor: string
  creado_el: string
}

const fromRow = (r: Row): CalendarNote => ({ id: r.id, day: r.dia, text: r.texto, done: r.hecha, author: r.autor, createdAt: r.creado_el })

function readLocal(): CalendarNote[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as CalendarNote[]
  } catch {
    return []
  }
}
const writeLocal = (list: CalendarNote[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* sin almacenamiento: las notas no se conservan */
  }
}

export const notesService = {
  async list(): Promise<CalendarNote[]> {
    if (!supabase) return readLocal()
    const { data, error } = await supabase.from('notas_calendario').select('*').order('creado_el', { ascending: true })
    if (error) throw error
    return (data as Row[]).map(fromRow)
  },
  async create(input: { day: string; text: string; author: string }): Promise<CalendarNote> {
    const note: CalendarNote = { id: uid('nota'), day: input.day, text: input.text.trim(), done: false, author: input.author, createdAt: new Date().toISOString() }
    if (!supabase) {
      writeLocal([...readLocal(), note])
      return note
    }
    const { error } = await supabase.from('notas_calendario').insert({ id: note.id, dia: note.day, texto: note.text, hecha: false, autor: note.author })
    if (error) throw error
    return note
  },
  async update(id: string, patch: { text?: string; done?: boolean }): Promise<void> {
    if (!supabase) {
      writeLocal(readLocal().map((n) => (n.id === id ? { ...n, ...(patch.text !== undefined && { text: patch.text.trim() }), ...(patch.done !== undefined && { done: patch.done }) } : n)))
      return
    }
    const row: Record<string, unknown> = { actualizado_el: new Date().toISOString() }
    if (patch.text !== undefined) row.texto = patch.text.trim()
    if (patch.done !== undefined) row.hecha = patch.done
    const { error } = await supabase.from('notas_calendario').update(row).eq('id', id)
    if (error) throw error
  },
  async remove(id: string): Promise<void> {
    if (!supabase) {
      writeLocal(readLocal().filter((n) => n.id !== id))
      return
    }
    const { error } = await supabase.from('notas_calendario').delete().eq('id', id)
    if (error) throw error
  },
}
