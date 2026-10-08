'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { X } from 'lucide-react'
import { z } from 'zod'
import { ClientSelectField, Field, SelectField, WebsiteSelectField } from '@/components/forms/fields'
import { FormDialog } from '@/components/forms/form-dialog'
import { Input, Textarea } from '@/components/ui/input'
import { tasksApi } from '@/hooks/use-entities'
import { fromDateInput, toDateInput } from '@/lib/format'
import { priorityLabel, taskStatusLabel } from '@/lib/labels'
import { TASK_PRIORITIES, TASK_STATUSES, type Task, type TaskStatus } from '@/types/domain'

const schema = z.object({
  title: z.string().trim().min(3, 'Escribe un título'),
  description: z.string(),
  clientId: z.string(),
  websiteId: z.string(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueAt: z.string(),
})
type Values = z.infer<typeof schema>

const blank = (status: TaskStatus = 'TODO'): Values => ({ title: '', description: '', clientId: '', websiteId: '', priority: 'MEDIUM', status, dueAt: '' })
const toValues = (t: Task): Values => ({ title: t.title, description: t.description, clientId: t.clientId ?? '', websiteId: t.websiteId ?? '', priority: t.priority, status: t.status, dueAt: toDateInput(t.dueAt) })

export function TaskFormDialog({ open, onOpenChange, task, defaultStatus, nextPosition = 0 }: { open: boolean; onOpenChange: (o: boolean) => void; task?: Task; defaultStatus?: TaskStatus; nextPosition?: number }) {
  const create = tasksApi.useCreate()
  const update = tasksApi.useUpdate()
  const [labels, setLabels] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const { register, control, handleSubmit, reset, formState: { errors: e } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: blank(defaultStatus) })
  const clientId = useWatch({ control, name: 'clientId' })
  useEffect(() => {
    if (!open) return
    reset(task ? toValues(task) : blank(defaultStatus))
    setLabels(task?.labels ?? [])
    setDraft('')
  }, [open, task, defaultStatus, reset])

  const addLabel = () => {
    const l = draft.trim()
    if (l && !labels.includes(l)) setLabels([...labels, l])
    setDraft('')
  }

  const submit = handleSubmit(async (v) => {
    const done = v.status === 'DONE'
    const payload = { ...v, clientId: v.clientId || null, websiteId: v.websiteId || null, dueAt: v.dueAt ? fromDateInput(v.dueAt) : null, labels }
    if (task) await update.mutateAsync({ id: task.id, patch: { ...payload, completedAt: done ? (task.completedAt ?? new Date().toISOString()) : null } })
    else await create.mutateAsync({ ...payload, comments: [], position: nextPosition, completedAt: done ? new Date().toISOString() : null })
    onOpenChange(false)
  })

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={task ? 'Editar tarea' : 'Nueva tarea'} onSubmit={submit} submitting={create.isPending || update.isPending} submitLabel={task ? 'Guardar cambios' : 'Crear tarea'} wide>
      <Field label="Título" required error={e.title?.message} htmlFor="t-title" className="sm:col-span-2">
        <Input id="t-title" {...register('title')} aria-invalid={!!e.title} />
      </Field>
      <Field label="Descripción" htmlFor="t-desc" className="sm:col-span-2">
        <Textarea id="t-desc" rows={3} {...register('description')} />
      </Field>
      <Field label="Cliente" htmlFor="t-client">
        <ClientSelectField control={control} name="clientId" id="t-client" />
      </Field>
      <Field label="Web asociada" htmlFor="t-web">
        <WebsiteSelectField control={control} name="websiteId" clientId={clientId} id="t-web" />
      </Field>
      <Field label="Prioridad" htmlFor="t-prio">
        <SelectField control={control} name="priority" id="t-prio" options={TASK_PRIORITIES.map((p) => ({ value: p, label: priorityLabel[p] }))} />
      </Field>
      <Field label="Estado" htmlFor="t-status">
        <SelectField control={control} name="status" id="t-status" options={TASK_STATUSES.map((s) => ({ value: s, label: taskStatusLabel[s] }))} />
      </Field>
      <Field label="Fecha límite" htmlFor="t-due">
        <Input id="t-due" type="date" {...register('dueAt')} />
      </Field>
      <Field label="Etiquetas" hint="Escribe y pulsa Enter." htmlFor="t-label">
        <Input
          id="t-label"
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault()
              addLabel()
            }
          }}
          onBlur={addLabel}
          placeholder="SEO, Bug, Diseño…"
        />
      </Field>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:col-span-2">
          {labels.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
              {l}
              <button type="button" onClick={() => setLabels(labels.filter((x) => x !== l))} aria-label={`Quitar ${l}`} className="rounded-full text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </FormDialog>
  )
}
