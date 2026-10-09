'use client'

import { Pencil, Send, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PriorityBadge } from '@/components/shared/badges'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { useCan } from '@/hooks/use-permissions'
import { tasksApi } from '@/hooks/use-entities'
import { formatDate, timeAgo } from '@/lib/format'
import { taskStatusLabel } from '@/lib/labels'
import { uid } from '@/lib/utils'
import type { Task } from '@/types/domain'
import { routes } from '@/lib/routes'

/** Detalle de una tarea con comentarios internos. */
export function TaskDetailDialog({ task, clientName, webName, onClose, onEdit, onDelete }: { task?: Task; clientName?: string; webName?: string; onClose: () => void; onEdit: (t: Task) => void; onDelete: (t: Task) => void }) {
  const update = tasksApi.useUpdate(true)
  const canWrite = useCan()('tasks', 'write')
  const [text, setText] = useState('')

  const addComment = () => {
    const t = text.trim()
    if (!task || !t) return
    update.mutate({ id: task.id, patch: { comments: [...task.comments, { id: uid('cmt'), author: 'Unai', text: t, createdAt: new Date().toISOString() }] } })
    setText('')
  }

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {task && (
          <>
            <DialogHeader>
              <DialogTitle>{task.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
                <PriorityBadge priority={task.priority} />
                <span>{taskStatusLabel[task.status]}</span>
                {task.dueAt && <span>· Límite {formatDate(task.dueAt)}</span>}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{task.description || 'Sin descripción.'}</p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {task.clientId && clientName && (
                  <Link href={routes.client(task.clientId)} className="hover:text-brand hover:underline">
                    Cliente: <span className="font-medium">{clientName}</span>
                  </Link>
                )}
                {task.websiteId && webName && (
                  <Link href={routes.website(task.websiteId)} className="hover:text-brand hover:underline">
                    Web: <span className="font-medium">{webName}</span>
                  </Link>
                )}
                {task.labels.map((l) => (
                  <span key={l} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                    {l}
                  </span>
                ))}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium">Comentarios internos ({task.comments.length})</h3>
                <ul className="space-y-3">
                  {task.comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar name={c.author} size={28} />
                      <div className="min-w-0 flex-1 rounded-lg bg-muted/60 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.author}</span> · {timeAgo(c.createdAt)}
                        </p>
                        <p className="mt-0.5 text-sm whitespace-pre-wrap">{c.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {canWrite && (
                <div className="mt-3 flex gap-2">
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => (e.key === 'Enter' && (e.metaKey || e.ctrlKey) ? addComment() : undefined)} rows={2} placeholder="Escribe un comentario… (Ctrl+Enter para enviar)" aria-label="Nuevo comentario" />
                  <Button size="icon" onClick={addComment} disabled={!text.trim()} aria-label="Enviar comentario" className="shrink-0 self-end">
                    <Send />
                  </Button>
                </div>
                )}
              </div>
            </div>
            {canWrite && (
            <div className="flex justify-between border-t px-6 py-4">
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(task)}>
                <Trash2 /> Eliminar
              </Button>
              <Button variant="outline" onClick={() => onEdit(task)}>
                <Pencil /> Editar
              </Button>
            </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
