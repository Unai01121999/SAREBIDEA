'use client'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TaskCard } from '@/components/tasks/task-card'
import { Button } from '@/components/ui/button'
import { taskStatusLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { TASK_STATUSES, type Task, type TaskStatus } from '@/types/domain'

type Columns = Record<TaskStatus, string[]>

const accent: Record<TaskStatus, string> = { TODO: 'bg-muted-foreground/50', IN_PROGRESS: 'bg-info', REVIEW: 'bg-warning', DONE: 'bg-success' }

const build = (tasks: Task[]): Columns => {
  const cols: Columns = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] }
  ;[...tasks].sort((a, b) => a.position - b.position).forEach((t) => cols[t.status].push(t.id))
  return cols
}

export interface TaskChange {
  id: string
  patch: Partial<Pick<Task, 'status' | 'position' | 'completedAt'>>
}

/** Tablero Kanban con arrastrar y soltar (ratón, táctil y teclado). */
export function KanbanBoard({ tasks, visibleIds, canDrag, saving, clientName, webName, onOpen, onAdd, onMove }: { tasks: Task[]; visibleIds: Set<string>; canDrag: boolean; saving: boolean; clientName: (t: Task) => string | undefined; webName: (t: Task) => string | undefined; onOpen: (t: Task) => void; onAdd: (status: TaskStatus) => void; onMove: (changes: TaskChange[]) => void }) {
  const [cols, setCols] = useState<Columns>(() => build(tasks))
  const [activeId, setActiveId] = useState<string | null>(null)
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  // Si cambian los datos (alta, edición, borrado) y no se está arrastrando ni guardando, se reconstruye el tablero.
  useEffect(() => {
    if (!activeId && !saving) setCols(build(tasks))
  }, [tasks, activeId, saving])

  // Detección de colisión para varias columnas: primero la que contiene el puntero y, dentro de ella, la tarjeta más cercana.
  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args)
    const collisions = pointer.length ? pointer : rectIntersection(args)
    let overId = getFirstCollision(collisions, 'id')
    if (overId == null) return []
    if (String(overId) in cols) {
      const items = cols[String(overId) as TaskStatus]
      if (items.length) {
        const nearest = closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => c.id !== overId && items.includes(String(c.id))) })
        overId = nearest[0]?.id ?? overId
      }
    }
    return [{ id: overId }]
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const containerOf = (id: string): TaskStatus | undefined => (id in cols ? (id as TaskStatus) : TASK_STATUSES.find((s) => cols[s].includes(id)))

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const from = containerOf(String(active.id))
    const to = containerOf(String(over.id))
    if (!from || !to || from === to) return
    setCols((prev) => {
      const overItems = prev[to]
      const overIndex = overItems.indexOf(String(over.id))
      const index = overIndex >= 0 ? overIndex : overItems.length
      return { ...prev, [from]: prev[from].filter((i) => i !== active.id), [to]: [...overItems.slice(0, index), String(active.id), ...overItems.slice(index)] }
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return setCols(build(tasks))
    const id = String(active.id)
    const col = containerOf(id)
    const overCol = containerOf(String(over.id))
    if (!col || !overCol) return
    let next = cols
    if (col === overCol) {
      const oldIndex = cols[col].indexOf(id)
      const newIndex = cols[col].indexOf(String(over.id))
      if (newIndex >= 0 && oldIndex !== newIndex) next = { ...cols, [col]: arrayMove(cols[col], oldIndex, newIndex) }
    }
    setCols(next)

    const changes: TaskChange[] = []
    for (const status of TASK_STATUSES) {
      next[status].forEach((tid, position) => {
        const t = byId.get(tid)
        if (!t) return
        if (t.status !== status || t.position !== position) {
          changes.push({ id: tid, patch: { status, position, ...(t.status !== status ? { completedAt: status === 'DONE' ? new Date().toISOString() : null } : {}) } })
        }
      })
    }
    if (changes.length) onMove(changes)
  }

  const active = activeId ? byId.get(activeId) : undefined

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => { setActiveId(null); setCols(build(tasks)) }}>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => {
          const ids = cols[status].filter((id) => visibleIds.has(id))
          return (
            <Column key={status} status={status} count={ids.length} onAdd={() => onAdd(status)}>
              <SortableContext items={cols[status]} strategy={verticalListSortingStrategy}>
                {cols[status].map((id) => {
                  const t = byId.get(id)
                  if (!t || !visibleIds.has(id)) return null
                  return <SortableTask key={id} task={t} disabled={!canDrag} clientName={clientName(t)} webName={webName(t)} onOpen={() => onOpen(t)} />
                })}
              </SortableContext>
              {ids.length === 0 && <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">Sin tareas</p>}
            </Column>
          )
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }}>{active ? <TaskCard task={active} clientName={clientName(active)} webName={webName(active)} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}

function Column({ status, count, onAdd, children }: { status: TaskStatus; count: number; onAdd: () => void; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section aria-label={taskStatusLabel[status]} className="flex w-[84vw] shrink-0 flex-col rounded-2xl bg-muted/50 p-2.5 sm:w-auto">
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
        <span className={cn('size-2 rounded-full', accent[status])} />
        <h2 className="text-[13px] font-semibold">{taskStatusLabel[status]}</h2>
        <span className="rounded-md bg-card px-1.5 text-xs text-muted-foreground tabular">{count}</span>
        <Button variant="ghost" size="icon-sm" className="ml-auto size-7" onClick={onAdd} aria-label={`Añadir tarea a ${taskStatusLabel[status]}`}>
          <Plus />
        </Button>
      </header>
      <div ref={setNodeRef} className={cn('flex min-h-24 flex-1 flex-col gap-2 rounded-xl transition-colors', isOver && 'bg-brand/5')}>
        {children}
      </div>
    </section>
  )
}

function SortableTask({ task, disabled, clientName, webName, onOpen }: { task: Task; disabled: boolean; clientName?: string; webName?: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-label={`Abrir tarea ${task.title}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen()
        else listeners?.onKeyDown?.(e)
      }}
      className={cn('touch-manipulation rounded-xl outline-offset-2', disabled ? 'cursor-pointer' : 'cursor-grab')}
    >
      <TaskCard task={task} clientName={clientName} webName={webName} dragging={isDragging} />
    </div>
  )
}
