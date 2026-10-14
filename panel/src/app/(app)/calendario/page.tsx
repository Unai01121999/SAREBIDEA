'use client'

import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { clientsApi, domainsApi, hostingsApi, invoicesApi, tasksApi, websitesApi } from '@/hooks/use-entities'
import { useCan } from '@/hooks/use-permissions'
import { buildEvents, CATEGORIES, dayKey, type CalendarCategory, type CalendarEvent } from '@/lib/calendar'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const cat = (k: CalendarCategory) => CATEGORIES.find((c) => c.key === k)!
const longDay = (key: string) => format(parseISO(key), "EEEE d 'de' MMMM", { locale: es })

function EventRow({ e }: { e: CalendarEvent }) {
  const c = cat(e.category)
  return (
    <li className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
      <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${c.dot} ${e.planned ? 'opacity-50' : ''}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{e.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{c.label}</span>
          {e.detail && <span>· {e.detail}</span>}
          {e.planned && <Badge tone="neutral" dot={false}>Prevista</Badge>}
        </p>
      </div>
      {e.href && (
        <Link href={e.href} className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground" aria-label={`Abrir: ${e.title}`}>
          <ExternalLink className="size-4" />
        </Link>
      )}
    </li>
  )
}

export default function CalendarPage() {
  const can = useCan()
  const showInvoices = can('billing', 'read')
  const clients = clientsApi.useList()
  const websites = websitesApi.useList()
  const domains = domainsApi.useList()
  const hostings = hostingsApi.useList()
  const invoices = invoicesApi.useList()
  const tasks = tasksApi.useList()
  const loading = [clients, websites, domains, hostings, tasks].some((q) => q.isLoading)

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => dayKey(new Date()))
  const [hidden, setHidden] = useState<Set<CalendarCategory>>(new Set())

  const gridStart = startOfWeek(month, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart.getTime(), gridEnd.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps

  const data = useMemo(
    () => ({ clients: clients.data ?? [], websites: websites.data ?? [], domains: domains.data ?? [], hostings: hostings.data ?? [], invoices: invoices.data ?? [], tasks: tasks.data ?? [], showInvoices }),
    [clients.data, websites.data, domains.data, hostings.data, invoices.data, tasks.data, showInvoices],
  )
  const all = useMemo(() => buildEvents(data, gridStart, gridEnd), [data, gridStart.getTime(), gridEnd.getTime()]) // eslint-disable-line react-hooks/exhaustive-deps
  const events = useMemo(() => all.filter((e) => !hidden.has(e.category)), [all, hidden])
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>()
    for (const e of events) m.set(e.day, [...(m.get(e.day) ?? []), e])
    return m
  }, [events])
  const counts = useMemo(() => {
    const m = new Map<CalendarCategory, number>()
    for (const e of all) if (e.day >= dayKey(month) && e.day <= dayKey(endOfMonth(month))) m.set(e.category, (m.get(e.category) ?? 0) + 1)
    return m
  }, [all, month])
  // Próximas acciones desde hoy (60 días), aparte del mes que se esté viendo.
  const upcoming = useMemo(() => buildEvents(data, new Date(), addDays(new Date(), 60)).filter((e) => !hidden.has(e.category) && e.planned).slice(0, 8), [data, hidden])

  const toggle = (k: CalendarCategory) => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n })
  const goTo = (m: Date) => { setMonth(m); setSelected(dayKey(isSameMonth(m, new Date()) ? new Date() : m)) }
  const selectedEvents = byDay.get(selected) ?? []

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Calendario"
        description="Altas de webs y dominios, renovaciones, facturas y tareas. Lo previsto aparece con trazo discontinuo."
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => goTo(addMonths(month, -1))} aria-label="Mes anterior">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={() => goTo(startOfMonth(new Date()))}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={() => goTo(addMonths(month, 1))} aria-label="Mes siguiente">
              <ChevronRight />
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Tipos de acción">
        {CATEGORIES.filter((c) => showInvoices || (c.key !== 'invoice' && c.key !== 'maintenance')).map((c) => {
          const off = hidden.has(c.key)
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={!off}
              onClick={() => toggle(c.key)}
              className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] transition-colors ${off ? 'border-border text-muted-foreground line-through opacity-60' : 'border-border bg-card hover:bg-muted'}`}
            >
              <span className={`size-2.5 rounded-full ${c.dot}`} aria-hidden="true" />
              {c.label}
              <span className="text-xs text-muted-foreground tabular-nums">{counts.get(c.key) ?? 0}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <Skeleton className="h-[560px] w-full" />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 first-letter:uppercase">
                <CalendarDays className="size-5 text-muted-foreground" />
                <span className="first-letter:uppercase">{format(month, 'LLLL yyyy', { locale: es })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 border-y border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((d) => {
                  const key = dayKey(d)
                  const list = byDay.get(key) ?? []
                  const inMonth = isSameMonth(d, month)
                  const isSel = key === selected
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      aria-label={`${longDay(key)}: ${list.length ? `${list.length} acciones` : 'sin acciones'}`}
                      aria-pressed={isSel}
                      className={`relative flex min-h-[64px] flex-col items-stretch gap-1 border-b border-r border-border/70 p-1.5 text-left transition-colors last:border-r-0 sm:min-h-[104px] ${inMonth ? '' : 'bg-muted/30 text-muted-foreground/70'} ${isSel ? 'bg-brand/5 ring-2 ring-inset ring-brand' : 'hover:bg-muted/50'}`}
                    >
                      <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${isToday(d) ? 'bg-brand font-semibold text-white' : ''}`}>{format(d, 'd')}</span>
                      {/* Móvil: puntos. Pantallas mayores: etiquetas con el título. */}
                      <span className="flex flex-wrap gap-1 sm:hidden">
                        {list.slice(0, 4).map((e) => (
                          <span key={e.id} className={`size-2 rounded-full ${cat(e.category).dot} ${e.planned ? 'opacity-50' : ''}`} />
                        ))}
                      </span>
                      <span className="hidden min-w-0 flex-col gap-0.5 sm:flex">
                        {list.slice(0, 3).map((e) => (
                          <span key={e.id} className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight ${cat(e.category).chip} ${e.planned ? 'border border-dashed border-current/40' : ''}`}>
                            {e.title}
                          </span>
                        ))}
                        {list.length > 3 && <span className="px-1.5 text-[11px] text-muted-foreground">+{list.length - 3} más</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base first-letter:uppercase">{longDay(selected)}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvents.length ? (
                  <ul className="space-y-2">
                    {selectedEvents.map((e) => (
                      <EventRow key={e.id} e={e} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay acciones este día.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Próximas acciones (60 días)</CardTitle>
              </CardHeader>
              <CardContent>
                {upcoming.length ? (
                  <ul className="space-y-2">
                    {upcoming.map((e) => (
                      <li key={e.id}>
                        <button type="button" onClick={() => { setMonth(startOfMonth(parseISO(e.day))); setSelected(e.day) }} className="flex w-full items-start gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted">
                          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${cat(e.category).dot}`} aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block leading-snug">{e.title}</span>
                            <span className="text-xs text-muted-foreground">{format(parseISO(e.day), 'd MMM', { locale: es })}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay acciones previstas.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
