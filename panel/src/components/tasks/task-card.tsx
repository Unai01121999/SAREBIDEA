'use client'

import { CalendarDays, GripVertical, MessageSquare } from 'lucide-react'
import { PriorityBadge } from '@/components/shared/badges'
import { daysUntil, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/domain'

const priorityBar: Record<Task['priority'], string> = { LOW: 'bg-muted-foreground/30', MEDIUM: 'bg-info', HIGH: 'bg-warning', URGENT: 'bg-destructive' }

export function TaskCard({ task, clientName, webName, dragging, overlay }: { task: Task; clientName?: string; webName?: string; dragging?: boolean; overlay?: boolean }) {
  const days = task.status === 'DONE' ? null : daysUntil(task.dueAt)
  const dueTone = days === null ? 'text-muted-foreground' : days < 0 ? 'text-destructive' : days <= 2 ? 'text-warning' : 'text-muted-foreground'
  return (
    <div className={cn('group relative overflow-hidden rounded-xl border bg-card p-3.5 pl-4 text-left shadow-xs transition-[box-shadow,opacity,border-color] duration-150', dragging && 'opacity-40', overlay && 'rotate-1 cursor-grabbing shadow-xl', !overlay && 'hover:border-foreground/20 hover:shadow-sm')}>
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', priorityBar[task.priority])} />
      <div className="flex items-start gap-2">
        <p className={cn('flex-1 text-sm leading-snug font-medium', task.status === 'DONE' && 'text-muted-foreground line-through decoration-muted-foreground/40')}>{task.title}</p>
        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" aria-hidden="true" />
      </div>
      {(clientName || webName) && (
        <p className="mt-1.5 truncate text-xs text-muted-foreground">
          {clientName}
          {clientName && webName ? ' · ' : ''}
          {webName}
        </p>
      )}
      {task.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span key={l} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <PriorityBadge priority={task.priority} />
        {task.dueAt && (
          <span className={cn('inline-flex items-center gap-1', dueTone)}>
            <CalendarDays className="size-3.5" />
            {formatDate(task.dueAt, 'd MMM')}
          </span>
        )}
        {task.comments.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="size-3.5" />
            {task.comments.length}
          </span>
        )}
      </div>
    </div>
  )
}
