'use client'

import { CheckCircle2, CreditCard, Globe, Building2, Server, Settings, UserCog, UserPlus, Activity } from 'lucide-react'
import Link from 'next/link'
import { ExpiryBadge } from '@/components/shared/badges'
import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, timeAgo } from '@/lib/format'
import type { Renewal } from '@/lib/metrics'
import type { ActivityEntry, Client, Task } from '@/types/domain'
import { routes } from '@/lib/routes'

const entityIcon = { client: UserPlus, website: Globe, domain: Building2, hosting: Server, invoice: CreditCard, task: CheckCircle2, user: UserCog, settings: Settings }

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
}

export function ActivityFeed({ items, loading }: { items?: ActivityEntry[]; loading?: boolean }) {
  if (loading) return <ListSkeleton />
  if (!items?.length) return <EmptyLine>Todavía no hay actividad.</EmptyLine>
  return (
    <ol className="relative space-y-4">
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-4 w-px bg-border" />
      {items.slice(0, 7).map((a) => {
        const Icon = entityIcon[a.entity] ?? Activity
        return (
          <li key={a.id} className="relative flex gap-3">
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="truncate text-sm">{a.message}</p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(a.createdAt)} · {a.actor}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function RenewalList({ items, clients, loading, href, empty }: { items?: Renewal[]; clients?: Client[]; loading?: boolean; href: (id: string) => string; empty: string }) {
  if (loading) return <ListSkeleton />
  if (!items?.length) return <EmptyLine>{empty}</EmptyLine>
  return (
    <ul className="-my-2 divide-y">
      {items.slice(0, 6).map((r) => (
        <li key={r.id}>
          <Link href={href(r.id)} className="flex items-center gap-3 rounded-lg py-2.5 transition-colors hover:bg-muted/40">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {clients?.find((c) => c.id === r.clientId)?.company ?? '—'} · {formatDate(r.renewsAt)} · {formatCurrency(r.cost)}
              </p>
            </div>
            <ExpiryBadge renewsAt={r.renewsAt} />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function CompletedTasks({ tasks, clients, loading }: { tasks?: Task[]; clients?: Client[]; loading?: boolean }) {
  if (loading) return <ListSkeleton />
  if (!tasks?.length) return <EmptyLine>Aún no hay tareas completadas.</EmptyLine>
  return (
    <ul className="-my-2 divide-y">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-2.5">
          <CheckCircle2 className="size-4 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{t.title}</p>
            <p className="truncate text-xs text-muted-foreground">{clients?.find((c) => c.id === t.clientId)?.company ?? 'Sin cliente'}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{t.completedAt ? timeAgo(t.completedAt) : ''}</span>
        </li>
      ))}
    </ul>
  )
}

export function LatestClients({ clients, loading }: { clients?: Client[]; loading?: boolean }) {
  if (loading) return <ListSkeleton />
  if (!clients?.length) return <EmptyLine>Aún no hay clientes.</EmptyLine>
  return (
    <ul className="-my-2 divide-y">
      {clients.map((c) => (
        <li key={c.id}>
          <Link href={routes.client(c.id)} className="flex items-center gap-3 rounded-lg py-2.5 transition-colors hover:bg-muted/40">
            <Avatar name={c.company} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.company}</p>
              <p className="truncate text-xs text-muted-foreground">{c.contactName}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
