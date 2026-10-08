'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { KanbanBoard, type TaskChange } from '@/components/tasks/kanban-board'
import { TaskDetailDialog } from '@/components/tasks/task-detail'
import { TaskFormDialog } from '@/components/tasks/task-form'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { clientsApi, tasksApi, websitesApi } from '@/hooks/use-entities'
import { useCreateParam } from '@/hooks/use-create-param'
import { priorityLabel } from '@/lib/labels'
import { dataSource } from '@/services'
import { TASK_PRIORITIES, type Task, type TaskPriority, type TaskStatus } from '@/types/domain'

export default function TasksPage() {
  const params = useSearchParams()
  const qc = useQueryClient()
  const { data: tasks, isLoading } = tasksApi.useList()
  const { data: clients } = clientsApi.useList()
  const { data: websites } = websitesApi.useList()
  const remove = tasksApi.useRemove()

  const [q, setQ] = useState(params.get('q') ?? '')
  const [priority, setPriority] = useState<'ALL' | TaskPriority>('ALL')
  const [clientId, setClientId] = useState('ALL')
  const [label, setLabel] = useState('ALL')
  const [createOpen, setCreateOpen] = useCreateParam()
  const [createStatus, setCreateStatus] = useState<TaskStatus>('TODO')
  const [openTask, setOpenTask] = useState<string | undefined>()
  const [editing, setEditing] = useState<Task | undefined>()
  const [toDelete, setToDelete] = useState<Task | undefined>()

  const move = useMutation({
    mutationFn: async (changes: TaskChange[]) => {
      await Promise.all(changes.map((c) => dataSource.repo('tasks').update(c.id, c.patch)))
    },
    // Se devuelve la promesa: la mutación no termina hasta que los datos se han vuelto a cargar (evita parpadeos).
    onSuccess: () => qc.invalidateQueries(),
  })

  const clientName = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c.company])), [clients])
  const webName = useMemo(() => new Map((websites ?? []).map((w) => [w.id, w.domainName || w.name])), [websites])
  const allLabels = useMemo(() => [...new Set((tasks ?? []).flatMap((t) => t.labels))].sort(), [tasks])
  const filtersActive = !!q.trim() || priority !== 'ALL' || clientId !== 'ALL' || label !== 'ALL'

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    return new Set(
      (tasks ?? [])
        .filter((t) => (priority === 'ALL' || t.priority === priority) && (clientId === 'ALL' || t.clientId === clientId) && (label === 'ALL' || t.labels.includes(label)) && (!term || `${t.title} ${t.description} ${t.labels.join(' ')} ${clientName.get(t.clientId ?? '') ?? ''}`.toLowerCase().includes(term)))
        .map((t) => t.id),
    )
  }, [tasks, q, priority, clientId, label, clientName])

  const detail = tasks?.find((t) => t.id === openTask)
  const nextPosition = (status: TaskStatus) => (tasks ?? []).filter((t) => t.status === status).length

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tareas"
        description="Tablero Kanban: arrastra las tarjetas entre columnas para cambiar su estado."
        crumbs={[{ label: 'Tareas' }]}
        actions={
          <Button
            onClick={() => {
              setCreateStatus('TODO')
              setCreateOpen(true)
            }}
          >
            <Plus /> Nueva tarea
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar tareas…" aria-label="Buscar tareas" className="sm:max-w-xs" />
        <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar por prioridad">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toda prioridad</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {priorityLabel[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por cliente">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los clientes</SelectItem>
            {(clients ?? []).filter((c) => !c.archived).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={label} onValueChange={setLabel}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por etiqueta">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las etiquetas</SelectItem>
            {allLabels.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(''); setPriority('ALL'); setClientId('ALL'); setLabel('ALL') }}>
            <X /> Quitar filtros
          </Button>
        )}
      </div>
      {filtersActive && <p className="mb-3 text-xs text-muted-foreground">Con filtros activos no se puede reordenar. Quítalos para arrastrar tarjetas.</p>}

      {isLoading || !tasks ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          visibleIds={visible}
          canDrag={!filtersActive}
          saving={move.isPending}
          clientName={(t) => (t.clientId ? clientName.get(t.clientId) : undefined)}
          webName={(t) => (t.websiteId ? webName.get(t.websiteId) : undefined)}
          onOpen={(t) => setOpenTask(t.id)}
          onAdd={(s) => {
            setCreateStatus(s)
            setCreateOpen(true)
          }}
          onMove={(c) => move.mutate(c)}
        />
      )}

      <TaskDetailDialog
        task={detail}
        clientName={detail?.clientId ? clientName.get(detail.clientId) : undefined}
        webName={detail?.websiteId ? webName.get(detail.websiteId) : undefined}
        onClose={() => setOpenTask(undefined)}
        onEdit={(t) => {
          setOpenTask(undefined)
          setEditing(t)
        }}
        onDelete={(t) => {
          setOpenTask(undefined)
          setToDelete(t)
        }}
      />
      <TaskFormDialog open={createOpen} onOpenChange={setCreateOpen} defaultStatus={createStatus} nextPosition={nextPosition(createStatus)} />
      <TaskFormDialog open={!!editing} onOpenChange={(o) => !o && setEditing(undefined)} task={editing} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(undefined)} title="Eliminar tarea" description={`«${toDelete?.title ?? ''}» se eliminará definitivamente.`} loading={remove.isPending} onConfirm={() => toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })} />
    </div>
  )
}
