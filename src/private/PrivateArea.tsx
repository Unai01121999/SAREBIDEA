import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { easeOut } from '../lib/motion'
import {
  canSeePrivate,
  daysUntil,
  euros,
  isHosted,
  paymentLabels,
  statusLabels,
  updateLead,
  watchLeads,
  type Lead,
  type LeadStatus,
  type PaymentStatus,
} from '../lib/leads'
import { Icon, type IconName } from '../components/ui/Icon'
import { Logo } from '../components/ui/Logo'
import { supabase } from '../lib/supabase'
import { AuthGate } from './AuthGate'
import { lock, PreviewLock } from './PreviewLock'
import { ExpiryBadge, LeadDrawer, PaymentBadge, StatusBadge, withProtocol } from './LeadDrawer'
import { Avatar, CARD, Code, IconChip, Kpi, Panel, Segmented, StackBar, type Tone } from './ui'

declare const __DEMO__: boolean

type Access = 'checking' | 'locked' | 'allowed' | 'denied'
type Tab = 'resumen' | 'clientes' | 'cuentas' | 'webs'
type StatusFilter = 'todos' | LeadStatus
type PayFilter = 'todos' | PaymentStatus

const tabs: { key: Tab; label: string; icon: IconName; title: string; lede: string }[] = [
  { key: 'resumen', label: 'Resumen', icon: 'grid', title: 'Resumen', lede: 'Lo importante de hoy: qué requiere tu atención y cómo va el negocio.' },
  { key: 'clientes', label: 'Clientes', icon: 'user', title: 'Clientes', lede: 'Solicitudes del formulario y clientes dados de alta a mano. Pulsa una fila para ver la ficha.' },
  { key: 'cuentas', label: 'Cuentas', icon: 'wallet', title: 'Cuentas', lede: 'Cuánto paga cada cliente y en qué estado está el cobro.' },
  { key: 'webs', label: 'Webs en producción', icon: 'globe', title: 'Webs en producción', lede: 'Webs y dominios de tus clientes, con sus vencimientos. Lo más urgente, primero.' },
]

const TAB_KEY = 'sarebidea-private-tab'
const readTab = (): Tab => {
  try {
    const t = localStorage.getItem(TAB_KEY)
    return t === 'clientes' || t === 'cuentas' || t === 'webs' ? t : 'resumen'
  } catch {
    return 'resumen'
  }
}

const dateFmt = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? `Hoy, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}
const shortDate = (ymd?: string) => (ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '')

const matches = (l: Lead, term: string) =>
  !term || [l.code, l.name, l.email, l.phone, l.businessType, l.description, l.domain, l.website].some((f) => f?.toLowerCase().includes(term))

/** Días hasta el vencimiento más próximo (dominio o web). */
const nearestExpiry = (l: Lead) => {
  const ds = [daysUntil(l.domainExpiry), daysUntil(l.webExpiry)].filter((d): d is number => d !== null)
  return ds.length ? Math.min(...ds) : null
}

type Alert = { key: string; lead: Lead; tone: Tone; icon: IconName; title: string; detail: string; weight: number }

/** Lo que requiere atención, ordenado por urgencia. */
function buildAlerts(all: Lead[]): Alert[] {
  const out: Alert[] = []
  for (const l of all) {
    if (l.paymentStatus === 'atrasado')
      out.push({ key: `p-${l.id}`, lead: l, tone: 'red', icon: 'wallet', title: `Pago atrasado · ${l.name}`, detail: `Pendiente de cobrar ${euros(l.amount)}`, weight: 0 })
    for (const [what, date] of [['Dominio', l.domainExpiry], ['Web', l.webExpiry]] as const) {
      const d = daysUntil(date)
      if (d === null || d > 30) continue
      out.push(
        d < 0
          ? { key: `e-${what}-${l.id}`, lead: l, tone: 'red', icon: 'calendar', title: `${what} vencido · ${l.name}`, detail: `Venció el ${shortDate(date)} (hace ${-d} ${-d === 1 ? 'día' : 'días'})`, weight: 1 }
          : { key: `e-${what}-${l.id}`, lead: l, tone: 'amber', icon: 'calendar', title: `${what} por vencer · ${l.name}`, detail: d === 0 ? 'Vence hoy' : `Vence el ${shortDate(date)} (en ${d} ${d === 1 ? 'día' : 'días'})`, weight: 2 + d / 100 },
      )
    }
    if (l.status === 'nuevo')
      out.push({ key: `n-${l.id}`, lead: l, tone: 'blue', icon: 'mail', title: `Solicitud nueva · ${l.name}`, detail: `${l.businessType || 'Sin tipo de negocio'} · ${dateFmt(l.createdAt)}`, weight: 3 })
  }
  return out.sort((a, b) => a.weight - b.weight)
}

export function PrivateArea({ onClose }: { onClose: () => void }) {
  const [access, setAccess] = useState<Access>('checking')
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState('')
  const [tab, setTabState] = useState<Tab>(readTab)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [payFilter, setPayFilter] = useState<PayFilter>('todos')
  const [q, setQ] = useState('')
  const [drawer, setDrawer] = useState<{ mode: 'new' } | { mode: 'view'; id: string } | null>(null)

  const grant = useCallback(() => setAccess('allowed'), [])

  const setTab = (t: Tab) => {
    setTabState(t)
    setQ('')
    try {
      localStorage.setItem(TAB_KEY, t)
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (supabase) return // en producción da paso AuthGate
    // Vista previa de diseño (solo con VITE_DEMO): entra directo, con datos de ejemplo
    if (__DEMO__) {
      import('./demo').then((m) => m.seedDemo()).then(() => setAccess('allowed'))
      return
    }
    let alive = true
    canSeePrivate().then((ok) => alive && setAccess(ok ? 'locked' : 'denied'))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (access !== 'allowed') return
    return watchLeads(setLeads, () => setError('No se han podido cargar los datos. Recarga la página para reintentarlo.'))
  }, [access])

  const term = q.trim().toLowerCase()
  const all = useMemo(() => leads ?? [], [leads])

  // Clientes
  const statusCounts = useMemo(() => {
    const c: Record<StatusFilter, number> = { todos: 0, nuevo: 0, contactado: 0, cliente: 0, descartado: 0 }
    for (const l of all) {
      c.todos++
      c[l.status] = (c[l.status] ?? 0) + 1
    }
    return c
  }, [all])
  const clientes = all.filter((l) => (statusFilter === 'todos' || l.status === statusFilter) && matches(l, term))

  // Cuentas: clientes confirmados o con una cantidad apuntada
  const cuentasBase = all.filter((l) => l.status === 'cliente' || typeof l.amount === 'number')
  const totals = useMemo(() => {
    const t = { pendiente: 0, pagado: 0, atrasado: 0 }
    for (const l of cuentasBase) t[l.paymentStatus ?? 'pendiente'] += l.amount ?? 0
    return t
  }, [cuentasBase])
  const cuentas = cuentasBase.filter((l) => (payFilter === 'todos' || (l.paymentStatus ?? 'pendiente') === payFilter) && matches(l, term))

  // Webs: clientes confirmados o con web/dominio; primero lo que vence antes
  const websBase = all
    .filter((l) => l.status === 'cliente' || l.website || l.domain)
    .sort((a, b) => (nearestExpiry(a) ?? Infinity) - (nearestExpiry(b) ?? Infinity))
  const webStats = {
    published: websBase.filter((l) => l.website).length,
    soon: websBase.filter((l) => {
      const d = nearestExpiry(l)
      return d !== null && d >= 0 && d <= 30
    }).length,
    expired: websBase.filter((l) => {
      const d = nearestExpiry(l)
      return d !== null && d < 0
    }).length,
  }
  const webs = websBase.filter((l) => matches(l, term))

  const alerts = useMemo(() => buildAlerts(all), [all])

  const current = drawer?.mode === 'view' ? leads?.find((l) => l.id === drawer.id) : undefined
  const closeDrawer = useCallback(() => setDrawer(null), [])
  const open = (id: string) => setDrawer({ mode: 'view', id })

  // Escape cierra el área solo si no hay un panel abierto encima
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !drawer && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer, onClose])

  const signOut = async () => {
    setDrawer(null)
    setLeads(null)
    if (supabase) {
      await supabase.auth.signOut()
      setAccess('checking')
    } else {
      lock()
      setAccess('locked')
    }
  }

  const meta = tabs.find((t) => t.key === tab)!
  const tabCount: Record<Tab, number | null> = { resumen: alerts.length || null, clientes: all.length, cuentas: cuentasBase.length, webs: websBase.length }
  const frame = 'fixed inset-0 z-[70] overflow-y-auto bg-[#f4f5f8] text-slate-900'
  const motionProps = {
    initial: { opacity: 0, transform: 'translate3d(0,16px,0)' },
    animate: { opacity: 1, transform: 'translate3d(0,0,0)' },
    exit: { opacity: 0, transform: 'translate3d(0,16px,0)' },
    transition: { duration: 0.35, ease: easeOut },
  }

  // --- Pantallas de acceso (candado, verificación, sin permiso) ---
  if (access !== 'allowed')
    return (
      <motion.div data-lenis-prevent className={frame} {...motionProps} role="region" aria-label="Área privada">
        <header className="border-b border-slate-900/[0.07] bg-white">
          <div className="container-x flex h-16 items-center justify-between">
            <Logo />
            <button type="button" onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[0.94rem] ring-1 ring-slate-900/10 transition-colors hover:bg-slate-50">
              <Icon name="arrow" size={16} className="rotate-180" /> Volver a la web
            </button>
          </div>
        </header>
        <main className="container-x pt-8 pb-24 sm:pt-12">
          {access === 'checking' && supabase && <AuthGate onReady={grant} />}
          {access === 'locked' && <PreviewLock onReady={grant} />}
          {access === 'checking' && !supabase && <p className="py-20 text-center text-slate-500">Comprobando acceso…</p>}
          {access === 'denied' && (
            <div className="mx-auto max-w-md py-24 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Icon name="lock" size={24} />
              </span>
              <h1 className="mt-6 font-display text-[2rem] font-semibold tracking-[-0.03em]">Acceso restringido</h1>
              <p className="mt-3 text-slate-500">Esta zona es solo para el equipo de SAREBIDEA. Si formas parte de él, pide acceso de edición al propietario.</p>
            </div>
          )}
        </main>
      </motion.div>
    )

  // --- Panel de gestión ---
  const searchBox = tab !== 'resumen' && (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">Buscar</span>
      <Icon name="search" size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
      <input
        id="lead-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por ID, nombre, dominio…"
        className="h-11 w-full rounded-xl bg-white pr-3 pl-10 text-[0.94rem] ring-1 ring-slate-900/10 placeholder:text-slate-400 focus:ring-2 focus:ring-cobalt focus:outline-none"
      />
    </label>
  )

  return (
    <motion.div data-lenis-prevent className={`${frame} lg:overflow-hidden`} {...motionProps} role="region" aria-label="Área privada">
      <div className="flex min-h-full lg:h-full">
        {/* Menú lateral (escritorio) */}
        <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-slate-900/[0.07] bg-white lg:flex">
          <div className="flex h-16 items-center px-6">
            <Logo />
          </div>
          <div className="px-4">
            <button
              type="button"
              onClick={() => setDrawer({ mode: 'new' })}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[0.94rem] font-medium text-white shadow-sm transition-[background-color,scale] duration-150 hover:bg-slate-800 active:scale-[0.98]"
            >
              <Icon name="plus" size={17} /> Dar de alta cliente
            </button>
          </div>
          <nav aria-label="Apartados" role="tablist" aria-orientation="vertical" className="mt-6 flex flex-1 flex-col gap-1 px-3">
            <span className="px-3 pb-1 text-[11.5px] font-medium tracking-wide text-slate-400 uppercase">Gestión</span>
            {tabs.map((t) => {
              const active = tab === t.key
              const n = tabCount[t.key]
              return (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls="private-panel"
                  onClick={() => setTab(t.key)}
                  className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-[0.94rem] font-medium transition-colors duration-150 ${
                    active ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon name={t.icon} size={19} className={active ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="flex-1 truncate text-left">{t.label}</span>
                  {leads && n !== null && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[12px] tabular ${t.key === 'resumen' ? 'bg-rose-100 text-rose-700' : active ? 'bg-white/80 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>{n}</span>
                  )}
                </button>
              )
            })}
          </nav>
          <div className="space-y-1 border-t border-slate-900/[0.07] p-3">
            {!isHosted() && <p className="px-3 pb-2 text-[12px] leading-snug text-slate-400">Modo local: los datos se guardan solo en este navegador.</p>}
            <button type="button" onClick={onClose} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[0.9rem] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <Icon name="arrow" size={17} className="rotate-180 text-slate-400" /> Volver a la web
            </button>
            <button type="button" onClick={signOut} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[0.9rem] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <Icon name="logout" size={17} className="text-slate-400" /> Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto" data-lenis-prevent>
          {/* Barra superior en móvil */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-900/[0.07] bg-white/90 px-4 backdrop-blur-xl lg:hidden">
            <Logo size={18} />
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => setDrawer({ mode: 'new' })} aria-label="Dar de alta cliente" className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Icon name="plus" size={18} />
              </button>
              <button type="button" onClick={signOut} aria-label="Cerrar sesión" className="flex size-10 items-center justify-center rounded-xl ring-1 ring-slate-900/10">
                <Icon name="logout" size={17} />
              </button>
              <button type="button" onClick={onClose} aria-label="Volver a la web" className="flex size-10 items-center justify-center rounded-xl ring-1 ring-slate-900/10">
                <Icon name="close" size={17} />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[72rem] px-4 pt-6 pb-28 sm:px-8 sm:pt-9 lg:pb-16">
            <div id="private-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-display text-[1.9rem] leading-none font-semibold tracking-[-0.03em] sm:text-[2.3rem]">{meta.title}</h1>
                  <p className="mt-2 max-w-xl text-[0.95rem] text-slate-500">{meta.lede}</p>
                </div>
                {searchBox}
              </div>

              {error && <p role="alert" className="mt-6 rounded-2xl bg-rose-50 p-4 text-rose-700">{error}</p>}
              {leads === null && !error && <p className="py-20 text-center text-slate-500">Cargando…</p>}

              {leads && tab === 'resumen' && (
                <Overview all={all} alerts={alerts} totals={totals} webStats={webStats} statusCounts={statusCounts} go={setTab} onOpen={open} onNew={() => setDrawer({ mode: 'new' })} />
              )}

              {leads && tab === 'clientes' && (
                <>
                  <div className="mt-6">
                    <Segmented
                      label="Filtrar por estado"
                      options={(['todos', 'nuevo', 'contactado', 'cliente', 'descartado'] as StatusFilter[]).map((f) => ({
                        key: f,
                        label: f === 'todos' ? 'Todos' : statusLabels[f],
                        count: statusCounts[f],
                      }))}
                      value={statusFilter}
                      onChange={setStatusFilter}
                    />
                  </div>
                  <List
                    rows={clientes}
                    empty={all.length === 0}
                    emptyTitle="Aún no hay clientes"
                    emptyText="Cuando alguien rellene el formulario de la web aparecerá aquí al momento. Si te contacta un cliente por otra vía, dalo de alta con el botón «Dar de alta cliente»."
                    onOpen={open}
                    columns={[
                      {
                        head: 'Cliente',
                        cell: (l) => (
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar name={l.name} />
                            <div className="min-w-0 max-w-[260px]">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-medium text-slate-900">{l.name}</span>
                                <Code code={l.code} />
                              </span>
                              {l.description && <p className="mt-0.5 truncate text-[13px] text-slate-500">{l.description}</p>}
                            </div>
                          </div>
                        ),
                      },
                      {
                        head: 'Contacto',
                        cell: (l) => (
                          <>
                            <span className="block text-slate-700 tabular">{l.phone || '—'}</span>
                            <span className="block max-w-[220px] truncate text-[13px] text-slate-500">{l.email}</span>
                          </>
                        ),
                      },
                      { head: 'Negocio', hide: 'lg', cell: (l) => <span className="text-slate-700">{l.businessType || '—'}</span> },
                      { head: 'Estado', cell: (l) => <StatusBadge status={l.status} /> },
                      { head: 'Alta', align: 'right', cell: (l) => <span className="whitespace-nowrap text-slate-500 tabular">{dateFmt(l.createdAt)}</span> },
                    ]}
                    card={(l) => (
                      <>
                        <CardTop l={l} right={<StatusBadge status={l.status} />} sub={l.businessType} />
                        {l.description && <span className="mt-3 line-clamp-2 block text-[14px] text-slate-600">{l.description}</span>}
                        <span className="mt-3 flex items-center justify-between text-[13px] text-slate-500">
                          <span className="tabular">{l.phone || l.email}</span>
                          <span className="tabular">{dateFmt(l.createdAt)}</span>
                        </span>
                      </>
                    )}
                  />
                </>
              )}

              {leads && tab === 'cuentas' && (
                <>
                  <div className={`${CARD} mt-6 p-5`}>
                    <StackBar
                      parts={[
                        { label: 'Cobrado', value: totals.pagado, color: 'bg-emerald-500', text: 'text-emerald-700' },
                        { label: 'Pendiente de cobro', value: totals.pendiente, color: 'bg-amber-400', text: 'text-amber-700' },
                        { label: 'Atrasado', value: totals.atrasado, color: 'bg-rose-500', text: 'text-rose-700' },
                      ]}
                    />
                  </div>
                  <div className="mt-6">
                    <Segmented
                      label="Filtrar por pago"
                      options={(['todos', 'pendiente', 'atrasado', 'pagado'] as PayFilter[]).map((f) => ({
                        key: f,
                        label: f === 'todos' ? 'Todas' : paymentLabels[f],
                        count: f === 'todos' ? cuentasBase.length : cuentasBase.filter((l) => (l.paymentStatus ?? 'pendiente') === f).length,
                      }))}
                      value={payFilter}
                      onChange={setPayFilter}
                    />
                  </div>
                  <List
                    rows={cuentas}
                    empty={cuentasBase.length === 0}
                    emptyTitle="Aún no hay cuentas"
                    emptyText="Marca un cliente como «Cliente» o apunta en su ficha la cantidad a pagar y aparecerá aquí."
                    onOpen={open}
                    columns={[
                      {
                        head: 'Cliente',
                        cell: (l) => (
                          <div className="flex items-center gap-3">
                            <Avatar name={l.name} />
                            <div className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-medium text-slate-900">{l.name}</span>
                                <Code code={l.code} />
                              </span>
                              <span className="block max-w-[220px] truncate text-[13px] text-slate-500">{l.email || l.phone}</span>
                            </div>
                          </div>
                        ),
                      },
                      { head: 'Negocio', hide: 'xl', cell: (l) => <span className="text-slate-700">{l.businessType || '—'}</span> },
                      { head: 'Cantidad', align: 'right', cell: (l) => <span className="font-medium text-slate-900 tabular">{euros(l.amount)}</span> },
                      { head: 'Estado del pago', cell: (l) => <PaySelect lead={l} onError={setError} /> },
                    ]}
                    card={(l) => (
                      <>
                        <CardTop l={l} right={<PaymentBadge status={l.paymentStatus} />} sub={l.email || l.phone} />
                        <span className="mt-3 flex items-baseline justify-between">
                          <span className="text-[13px] text-slate-500">Cantidad a pagar</span>
                          <span className="font-display text-[1.3rem] font-semibold tabular">{euros(l.amount)}</span>
                        </span>
                      </>
                    )}
                  />
                </>
              )}

              {leads && tab === 'webs' && (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Kpi icon="globe" tone="blue" label="Webs publicadas" value={String(webStats.published)} hint="En producción ahora mismo" />
                    <Kpi icon="calendar" tone="amber" label="Vencen en 30 días o menos" value={String(webStats.soon)} hint="Conviene renovarlas ya" />
                    <Kpi icon="alert" tone="red" label="Ya vencidos" value={String(webStats.expired)} hint="Dominio o web caducados" />
                  </div>
                  <List
                    rows={webs}
                    empty={websBase.length === 0}
                    emptyTitle="Aún no hay webs"
                    emptyText="Abre la ficha de un cliente, pulsa «Editar ficha» y añade su web, su dominio y las fechas de vencimiento."
                    onOpen={open}
                    columns={[
                      {
                        head: 'Cliente',
                        cell: (l) => (
                          <div className="flex items-center gap-3">
                            <Avatar name={l.name} />
                            <div className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-medium text-slate-900">{l.name}</span>
                                <Code code={l.code} />
                              </span>
                              <span className="block text-[13px] text-slate-500">{l.domain || 'Sin dominio'}</span>
                            </div>
                          </div>
                        ),
                      },
                      { head: 'Web', cell: (l) => <WebLink url={l.website} /> },
                      { head: 'Vence el dominio', cell: (l) => <ExpiryBadge date={l.domainExpiry} /> },
                      { head: 'Vence la web', cell: (l) => <ExpiryBadge date={l.webExpiry} /> },
                    ]}
                    card={(l) => (
                      <>
                        <CardTop l={l} sub={l.domain || 'Sin dominio'} />
                        <span className="mt-2 block">
                          <WebLink url={l.website} />
                        </span>
                        <span className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-900/[0.07] pt-3 text-[13px]">
                          <span>
                            <span className="block text-slate-500">Dominio</span>
                            <ExpiryBadge date={l.domainExpiry} />
                          </span>
                          <span>
                            <span className="block text-slate-500">Web</span>
                            <ExpiryBadge date={l.webExpiry} />
                          </span>
                        </span>
                      </>
                    )}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Navegación inferior (móvil) */}
      <nav aria-label="Apartados" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-slate-900/[0.07] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setTab(t.key)}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11.5px] font-medium transition-colors ${active ? 'text-sky-700' : 'text-slate-500'}`}
            >
              <span className="relative">
                <Icon name={t.icon} size={21} />
                {t.key === 'resumen' && alerts.length > 0 && <span className="absolute -top-1 -right-1.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-white" />}
              </span>
              {t.key === 'webs' ? 'Webs' : t.label}
            </button>
          )
        })}
      </nav>

      <AnimatePresence>
        {drawer?.mode === 'new' && <LeadDrawer key="new" mode="new" onClose={closeDrawer} />}
        {drawer?.mode === 'view' && current && <LeadDrawer key={current.id} mode="view" lead={current} onClose={closeDrawer} />}
      </AnimatePresence>
    </motion.div>
  )
}

/** Pantalla de inicio: indicadores, lo que requiere atención, cobros y últimas solicitudes. */
function Overview({
  all,
  alerts,
  totals,
  webStats,
  statusCounts,
  go,
  onOpen,
  onNew,
}: {
  all: Lead[]
  alerts: Alert[]
  totals: { pendiente: number; pagado: number; atrasado: number }
  webStats: { published: number; soon: number; expired: number }
  statusCounts: Record<StatusFilter, number>
  go: (t: Tab) => void
  onOpen: (id: string) => void
  onNew: () => void
}) {
  const recent = all.slice(0, 5)
  const toCollect = totals.pendiente + totals.atrasado
  if (all.length === 0)
    return (
      <div className={`${CARD} mt-8 px-6 py-16 text-center`}>
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Icon name="user" size={22} />
        </span>
        <h2 className="mt-5 font-display text-[1.5rem] font-semibold tracking-[-0.02em]">Todo listo para empezar</h2>
        <p className="mx-auto mt-2 max-w-sm text-slate-500">Cuando alguien rellene el formulario de la web, aparecerá aquí al momento. También puedes dar de alta a un cliente a mano.</p>
        <button type="button" onClick={onNew} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 font-medium text-white">
          <Icon name="plus" size={17} /> Dar de alta cliente
        </button>
      </div>
    )

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon="mail" tone="blue" label="Solicitudes nuevas" value={String(statusCounts.nuevo)} hint="Sin contactar todavía" onClick={() => go('clientes')} />
        <Kpi icon="user" tone="green" label="Clientes" value={String(statusCounts.cliente)} hint={`${statusCounts.todos} contactos en total`} onClick={() => go('clientes')} />
        <Kpi icon="globe" tone="slate" label="Webs en producción" value={String(webStats.published)} hint={webStats.soon + webStats.expired ? `${webStats.soon + webStats.expired} requieren renovación` : 'Todo al día'} onClick={() => go('webs')} />
        <Kpi icon="wallet" tone={totals.atrasado ? 'red' : 'amber'} label="Por cobrar" value={euros(toCollect)} hint={totals.atrasado ? `${euros(totals.atrasado)} atrasado` : 'Nada atrasado'} onClick={() => go('cuentas')} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Requiere tu atención"
          subtitle={alerts.length ? `${alerts.length} ${alerts.length === 1 ? 'asunto' : 'asuntos'} por resolver` : undefined}
        >
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
              <IconChip icon="check" tone="green" />
              <div>
                <p className="font-medium">Todo al día</p>
                <p className="text-[13px] text-emerald-700">No hay cobros atrasados, vencimientos próximos ni solicitudes sin atender.</p>
              </div>
            </div>
          ) : (
            <ul className="-my-1 divide-y divide-slate-900/[0.06]">
              {alerts.slice(0, 8).map((a) => (
                <li key={a.key}>
                  <button type="button" onClick={() => onOpen(a.lead.id)} className="group flex w-full items-center gap-3 py-3 text-left">
                    <IconChip icon={a.icon} tone={a.tone} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{a.title}</span>
                      <span className="block truncate text-[13px] text-slate-500">{a.detail}</span>
                    </span>
                    <Icon name="arrow" size={17} className="shrink-0 text-slate-300 transition-[translate,color] duration-150 group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </button>
                </li>
              ))}
              {alerts.length > 8 && <li className="pt-3 text-[13px] text-slate-500">…y {alerts.length - 8} más.</li>}
            </ul>
          )}
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel title="Cobros" subtitle="Lo cobrado y lo que falta">
            <StackBar
              parts={[
                { label: 'Cobrado', value: totals.pagado, color: 'bg-emerald-500', text: 'text-emerald-700' },
                { label: 'Pendiente', value: totals.pendiente, color: 'bg-amber-400', text: 'text-amber-700' },
                { label: 'Atrasado', value: totals.atrasado, color: 'bg-rose-500', text: 'text-rose-700' },
              ]}
            />
          </Panel>
          <Panel
            title="Últimas solicitudes"
            action={
              <button type="button" onClick={() => go('clientes')} className="text-[13px] font-medium text-sky-700 hover:underline">
                Ver todas
              </button>
            }
          >
            <ul className="-my-1 divide-y divide-slate-900/[0.06]">
              {recent.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => onOpen(l.id)} className="flex w-full items-center gap-3 py-2.5 text-left">
                    <Avatar name={l.name} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">{l.name}</span>
                      <span className="block truncate text-[12.5px] text-slate-500">{l.businessType || 'Sin tipo de negocio'} · {dateFmt(l.createdAt)}</span>
                    </span>
                    <StatusBadge status={l.status} />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}

type Column = { head: string; cell: (l: Lead) => ReactNode; hide?: 'lg' | 'xl'; align?: 'right' }

const hideCls = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }

/** Tabla en escritorio y tarjetas en móvil. Cada fila abre la ficha del cliente. */
function List({
  rows,
  columns,
  card,
  onOpen,
  empty,
  emptyTitle,
  emptyText,
}: {
  rows: Lead[]
  columns: Column[]
  card: (l: Lead) => ReactNode
  onOpen: (id: string) => void
  empty: boolean
  emptyTitle: string
  emptyText: string
}) {
  if (empty)
    return (
      <div className={`${CARD} mt-6 px-6 py-16 text-center`}>
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Icon name="user" size={22} />
        </span>
        <h2 className="mt-5 font-display text-[1.4rem] font-semibold tracking-[-0.02em]">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm text-slate-500">{emptyText}</p>
      </div>
    )
  if (!rows.length) return <p className="py-16 text-center text-slate-500">Nada coincide con la búsqueda o el filtro.</p>

  return (
    <>
      <div className={`${CARD} mt-5 hidden overflow-hidden md:block`}>
        <table className="w-full text-left text-[0.92rem]">
          <thead className="border-b border-slate-900/[0.07] bg-slate-50/70 text-[12px] font-medium tracking-wide text-slate-500 uppercase">
            <tr>
              {columns.map((c) => (
                <th key={c.head} className={`px-5 py-3 font-medium ${c.hide ? hideCls[c.hide] : ''} ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr
                key={l.id}
                tabIndex={0}
                aria-label={`Abrir ficha de ${l.name}`}
                className="cursor-pointer border-b border-slate-900/[0.06] align-middle transition-colors duration-150 last:border-0 hover:bg-sky-50/40 focus-visible:bg-sky-50/60 focus-visible:outline-none"
                onClick={() => onOpen(l.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), onOpen(l.id))}
              >
                {columns.map((c) => (
                  <td key={c.head} className={`px-5 py-3.5 ${c.hide ? hideCls[c.hide] : ''} ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.cell(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-slate-900/[0.06] bg-slate-50/50 px-5 py-2.5 text-[12.5px] text-slate-500">
          {rows.length} {rows.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      <ul className="mt-5 flex flex-col gap-3 md:hidden">
        {rows.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onOpen(l.id)} className={`${CARD} block w-full p-4 text-left active:scale-[0.99]`}>
              {card(l)}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function CardTop({ l, right, sub }: { l: Lead; right?: ReactNode; sub?: string }) {
  return (
    <span className="flex items-start justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={l.name} />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-slate-900">{l.name}</span>
            <Code code={l.code} />
          </span>
          {sub && <span className="mt-0.5 block truncate text-[13px] text-slate-500">{sub}</span>}
        </span>
      </span>
      {right}
    </span>
  )
}

function WebLink({ url }: { url?: string }) {
  if (!url) return <span className="text-slate-400">Sin publicar</span>
  return (
    <a
      href={withProtocol(url)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-[240px] items-center gap-1 truncate text-sky-700 underline-offset-2 hover:underline"
    >
      <span className="truncate">{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
      <Icon name="arrowUpRight" size={14} className="shrink-0" />
    </a>
  )
}

function PaySelect({ lead, onError }: { lead: Lead; onError: (m: string) => void }) {
  const value = lead.paymentStatus ?? 'pendiente'
  const tone = { pendiente: 'text-amber-700 bg-amber-50', pagado: 'text-emerald-700 bg-emerald-50', atrasado: 'text-rose-700 bg-rose-50' }[value]
  return (
    <label className="relative inline-flex" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <span className="sr-only">Estado del pago de {lead.name}</span>
      <select
        value={value}
        onChange={(e) => updateLead(lead.id, { paymentStatus: e.target.value as PaymentStatus }).catch(() => onError('No se ha podido cambiar el estado del pago.'))}
        className={`h-8 cursor-pointer appearance-none rounded-full pr-7 pl-3 text-[13px] font-medium focus:ring-2 focus:ring-cobalt focus:outline-none ${tone}`}
      >
        {(Object.keys(paymentLabels) as PaymentStatus[]).map((k) => (
          <option key={k} value={k}>
            {paymentLabels[k]}
          </option>
        ))}
      </select>
      <Icon name="chevron" size={14} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 opacity-70" />
    </label>
  )
}
