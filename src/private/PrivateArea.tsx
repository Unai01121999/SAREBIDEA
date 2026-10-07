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

type Access = 'checking' | 'locked' | 'allowed' | 'denied'
type Tab = 'clientes' | 'cuentas' | 'webs'
type StatusFilter = 'todos' | LeadStatus
type PayFilter = 'todos' | PaymentStatus

const tabs: { key: Tab; label: string; icon: IconName; title: string; lede: string }[] = [
  {
    key: 'clientes',
    label: 'Clientes',
    icon: 'user',
    title: 'Clientes',
    lede: 'Lo que escriben en el formulario de la web y los clientes que das de alta a mano. Cada uno tiene su ID.',
  },
  {
    key: 'cuentas',
    label: 'Cuentas',
    icon: 'star',
    title: 'Cuentas',
    lede: 'Cuánto paga cada cliente y en qué estado está el pago. Aparecen los clientes confirmados y cualquiera con una cantidad.',
  },
  {
    key: 'webs',
    label: 'Webs',
    icon: 'search',
    title: 'Webs',
    lede: 'La web y el dominio de cada cliente, con sus fechas de vencimiento. Se rellenan desde la ficha del cliente.',
  },
]

const TAB_KEY = 'sarebidea-private-tab'
const readTab = (): Tab => {
  try {
    const t = localStorage.getItem(TAB_KEY)
    return t === 'cuentas' || t === 'webs' ? t : 'clientes'
  } catch {
    return 'clientes'
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

const matches = (l: Lead, term: string) =>
  !term || [l.code, l.name, l.email, l.phone, l.businessType, l.description, l.domain, l.website].some((f) => f?.toLowerCase().includes(term))

/** Días hasta el vencimiento más próximo (dominio o web). */
const nearestExpiry = (l: Lead) => {
  const ds = [daysUntil(l.domainExpiry), daysUntil(l.webExpiry)].filter((d): d is number => d !== null)
  return ds.length ? Math.min(...ds) : null
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

  const current = drawer?.mode === 'view' ? leads?.find((l) => l.id === drawer.id) : undefined
  const closeDrawer = useCallback(() => setDrawer(null), [])
  const open = (id: string) => setDrawer({ mode: 'view', id })

  // Escape cierra el área solo si no hay un panel abierto encima
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !drawer && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer, onClose])

  const meta = tabs.find((t) => t.key === tab)!
  const tabCount: Record<Tab, number> = { clientes: all.length, cuentas: cuentasBase.length, webs: websBase.length }

  return (
    <motion.div
      data-lenis-prevent
      className="fixed inset-0 z-[70] overflow-y-auto bg-paper"
      initial={{ opacity: 0, transform: 'translate3d(0,16px,0)' }}
      animate={{ opacity: 1, transform: 'translate3d(0,0,0)' }}
      exit={{ opacity: 0, transform: 'translate3d(0,16px,0)' }}
      transition={{ duration: 0.35, ease: easeOut }}
      role="region"
      aria-label="Área privada"
    >
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <span className="hidden rounded-full bg-ink/[0.06] px-2.5 py-1 text-[12.5px] font-medium text-ink-2 sm:inline-flex sm:items-center sm:gap-1.5">
              <Icon name="lock" size={13} /> Área privada
            </span>
          </div>
          <div className="flex items-center gap-2">
          {access === 'allowed' && (
            <button
              type="button"
              onClick={async () => {
                setDrawer(null)
                setLeads(null)
                if (supabase) {
                  await supabase.auth.signOut()
                  setAccess('checking')
                } else {
                  lock()
                  setAccess('locked')
                }
              }}
              className="inline-flex h-10 items-center rounded-full px-3.5 text-[0.94rem] text-ink-2 ring-1 ring-line transition-colors hover:bg-ink/[0.05] hover:text-ink sm:px-4"
            >
              <Icon name="lock" size={15} className="mr-1.5" /> <span className="hidden sm:inline">Cerrar sesión</span>
              <span className="sm:hidden">Salir</span>
            </button>
          )}
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.94rem] ring-1 ring-line transition-colors hover:bg-ink/[0.05]">
            <Icon name="arrow" size={16} className="rotate-180" /> <span className="hidden sm:inline">Volver a la web</span>
            <span className="sm:hidden">Volver</span>
          </button>
          </div>
        </div>
      </header>

      <main className="container-x pt-8 pb-24 sm:pt-12">
        {access === 'checking' && supabase && <AuthGate onReady={grant} />}
        {access === 'locked' && <PreviewLock onReady={grant} />}
        {access === 'checking' && !supabase && <p className="py-20 text-center text-mute">Comprobando acceso…</p>}

        {access === 'denied' && (
          <div className="mx-auto max-w-md py-24 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-ink text-paper">
              <Icon name="lock" size={24} />
            </span>
            <h1 className="mt-6 font-display text-[2rem] font-semibold tracking-[-0.03em]">Acceso restringido</h1>
            <p className="mt-3 text-mute">Esta zona es solo para el equipo de SAREBIDEA. Si formas parte de él, pide acceso de edición al propietario.</p>
          </div>
        )}

        {access === 'allowed' && (
          <>
            {/* Apartados */}
            <div role="tablist" aria-label="Apartados" className="inline-flex w-full gap-1 rounded-full bg-ink/[0.05] p-1 sm:w-auto">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  id={`tab-${t.key}`}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.key}
                  aria-controls="private-panel"
                  onClick={() => setTab(t.key)}
                  className={`relative inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[0.95rem] font-medium transition-colors duration-150 sm:flex-none sm:px-5 ${
                    tab === t.key ? 'text-ink' : 'text-mute hover:text-ink'
                  }`}
                >
                  {tab === t.key && (
                    <motion.span layoutId="private-tab" className="absolute inset-0 rounded-full bg-white shadow-[0_1px_2px_rgb(13_14_18/0.08)] ring-1 ring-line" transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }} />
                  )}
                  <span className="relative">{t.label}</span>
                  <span className="relative text-[12.5px] text-mute tabular">{leads ? tabCount[t.key] : ''}</span>
                </button>
              ))}
            </div>

            <div id="private-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
              <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-display text-[clamp(2.2rem,1.6rem+2.4vw,3.4rem)] leading-none font-semibold tracking-[-0.035em]">{meta.title}</h1>
                  <p className="mt-3 max-w-xl text-mute">
                    {meta.lede}
                    {!isHosted() && ' Modo local: los datos se guardan solo en este navegador.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawer({ mode: 'new' })}
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium text-paper shadow-[0_10px_24px_-10px_rgb(13_14_18/0.55)] transition-[scale] duration-150 active:scale-[0.97]"
                >
                  <Icon name="plus" size={18} /> Dar de alta cliente
                </button>
              </div>

              {tab === 'cuentas' && leads && (
                <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                  <Stat label="Pendiente de cobro" value={euros(totals.pendiente)} tone="amber" />
                  <Stat label="Atrasado" value={euros(totals.atrasado)} tone="red" />
                  <Stat label="Cobrado" value={euros(totals.pagado)} tone="green" />
                </div>
              )}
              {tab === 'webs' && leads && (
                <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                  <Stat label="Webs publicadas" value={String(webStats.published)} />
                  <Stat label="Vencen en 30 días o menos" value={String(webStats.soon)} tone="amber" />
                  <Stat label="Ya vencidos" value={String(webStats.expired)} tone="red" />
                </div>
              )}

              {/* Filtros + búsqueda */}
              <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {tab === 'clientes' && (
                  <Chips
                    label="Filtrar por estado"
                    options={(['todos', 'nuevo', 'contactado', 'cliente', 'descartado'] as StatusFilter[]).map((f) => ({
                      key: f,
                      label: f === 'todos' ? 'Todos' : statusLabels[f],
                      count: statusCounts[f],
                    }))}
                    value={statusFilter}
                    onChange={setStatusFilter}
                  />
                )}
                {tab === 'cuentas' && (
                  <Chips
                    label="Filtrar por pago"
                    options={(['todos', 'pendiente', 'atrasado', 'pagado'] as PayFilter[]).map((f) => ({
                      key: f,
                      label: f === 'todos' ? 'Todas' : paymentLabels[f],
                      count: f === 'todos' ? cuentasBase.length : cuentasBase.filter((l) => (l.paymentStatus ?? 'pendiente') === f).length,
                    }))}
                    value={payFilter}
                    onChange={setPayFilter}
                  />
                )}
                {tab === 'webs' && <span />}
                <label className="relative block lg:w-80">
                  <span className="sr-only">Buscar</span>
                  <Icon name="search" size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-mute" />
                  <input
                    id="lead-search"
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por ID, nombre, dominio…"
                    className="h-11 w-full rounded-full bg-white pr-4 pl-10 text-[0.95rem] ring-1 ring-line focus:ring-2 focus:ring-cobalt focus:outline-none"
                  />
                </label>
              </div>

              {error && <p role="alert" className="mt-8 rounded-2xl bg-[#e5484d]/[0.08] p-4 text-[#c23237]">{error}</p>}
              {leads === null && !error && <p className="py-20 text-center text-mute">Cargando…</p>}

              {leads && tab === 'clientes' && (
                <List
                  rows={clientes}
                  empty={all.length === 0}
                  emptyTitle="Aún no hay clientes"
                  emptyText="Cuando alguien rellene el formulario de la web aparecerá aquí al momento. Si te llama un cliente, dalo de alta con el botón de arriba."
                  onOpen={open}
                  columns={[
                    { head: 'ID', cell: (l) => <Code code={l.code} /> },
                    {
                      head: 'Nombre',
                      cell: (l) => (
                        <div className="max-w-[260px]">
                          <span className="font-medium text-ink">{l.name}</span>
                          {l.description && <p className="mt-0.5 truncate text-[13px] text-mute">{l.description}</p>}
                        </div>
                      ),
                    },
                    {
                      head: 'Contacto',
                      cell: (l) => (
                        <>
                          <span className="block text-ink-2 tabular">{l.phone || '—'}</span>
                          <span className="block max-w-[220px] truncate text-[13px] text-mute">{l.email}</span>
                        </>
                      ),
                    },
                    { head: 'Negocio', hide: 'lg', cell: (l) => <span className="text-ink-2">{l.businessType || '—'}</span> },
                    { head: 'Dominio', hide: 'xl', cell: (l) => <span className="text-ink-2">{l.domain || '—'}</span> },
                    { head: 'Estado', cell: (l) => <StatusBadge status={l.status} /> },
                    { head: 'Alta', align: 'right', cell: (l) => <span className="whitespace-nowrap text-mute tabular">{dateFmt(l.createdAt)}</span> },
                  ]}
                  card={(l) => (
                    <>
                      <CardTop l={l} right={<StatusBadge status={l.status} />} sub={l.businessType} />
                      {l.description && <span className="mt-3 line-clamp-2 block text-[14px] text-ink-2">{l.description}</span>}
                      <span className="mt-3 flex items-center justify-between text-[13px] text-mute">
                        <span className="tabular">{l.phone || l.email}</span>
                        <span className="tabular">{dateFmt(l.createdAt)}</span>
                      </span>
                    </>
                  )}
                />
              )}

              {leads && tab === 'cuentas' && (
                <List
                  rows={cuentas}
                  empty={cuentasBase.length === 0}
                  emptyTitle="Aún no hay cuentas"
                  emptyText="Marca un cliente como «Cliente» o apunta en su ficha la cantidad a pagar y aparecerá aquí."
                  onOpen={open}
                  columns={[
                    { head: 'ID', cell: (l) => <Code code={l.code} /> },
                    { head: 'Cliente', cell: (l) => <span className="font-medium text-ink">{l.name}</span> },
                    {
                      head: 'Contacto',
                      hide: 'lg',
                      cell: (l) => (
                        <>
                          <span className="block text-ink-2 tabular">{l.phone || '—'}</span>
                          <span className="block max-w-[220px] truncate text-[13px] text-mute">{l.email}</span>
                        </>
                      ),
                    },
                    { head: 'Negocio', hide: 'xl', cell: (l) => <span className="text-ink-2">{l.businessType || '—'}</span> },
                    { head: 'Cantidad', align: 'right', cell: (l) => <span className="font-medium text-ink tabular">{euros(l.amount)}</span> },
                    { head: 'Estado del pago', cell: (l) => <PaySelect lead={l} onError={setError} /> },
                  ]}
                  card={(l) => (
                    <>
                      <CardTop l={l} right={<PaymentBadge status={l.paymentStatus} />} sub={l.phone || l.email} />
                      <span className="mt-3 flex items-baseline justify-between">
                        <span className="text-[13px] text-mute">Cantidad a pagar</span>
                        <span className="font-display text-[1.3rem] font-semibold tabular">{euros(l.amount)}</span>
                      </span>
                    </>
                  )}
                />
              )}

              {leads && tab === 'webs' && (
                <List
                  rows={webs}
                  empty={websBase.length === 0}
                  emptyTitle="Aún no hay webs"
                  emptyText="Abre la ficha de un cliente, pulsa «Editar ficha» y añade su web, su dominio y las fechas de vencimiento."
                  onOpen={open}
                  columns={[
                    { head: 'ID', cell: (l) => <Code code={l.code} /> },
                    { head: 'Cliente', cell: (l) => <span className="font-medium text-ink">{l.name}</span> },
                    { head: 'Web', cell: (l) => <WebLink url={l.website} /> },
                    { head: 'Dominio', hide: 'lg', cell: (l) => <span className="text-ink-2">{l.domain || '—'}</span> },
                    { head: 'Vence el dominio', cell: (l) => <ExpiryBadge date={l.domainExpiry} /> },
                    { head: 'Vence la web', cell: (l) => <ExpiryBadge date={l.webExpiry} /> },
                  ]}
                  card={(l) => (
                    <>
                      <CardTop l={l} sub={l.domain || 'Sin dominio'} />
                      <span className="mt-2 block">
                        <WebLink url={l.website} />
                      </span>
                      <span className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[13px]">
                        <span>
                          <span className="block text-mute">Dominio</span>
                          <ExpiryBadge date={l.domainExpiry} />
                        </span>
                        <span>
                          <span className="block text-mute">Web</span>
                          <ExpiryBadge date={l.webExpiry} />
                        </span>
                      </span>
                    </>
                  )}
                />
              )}
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {drawer?.mode === 'new' && <LeadDrawer key="new" mode="new" onClose={closeDrawer} />}
        {drawer?.mode === 'view' && current && <LeadDrawer key={current.id} mode="view" lead={current} onClose={closeDrawer} />}
      </AnimatePresence>
    </motion.div>
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
      <div className="mt-8 rounded-[28px] border border-dashed border-ink/15 px-6 py-16 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-cobalt/10 text-cobalt">
          <Icon name="user" size={22} />
        </span>
        <h2 className="mt-5 font-display text-[1.5rem] font-semibold tracking-[-0.02em]">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-sm text-mute">{emptyText}</p>
      </div>
    )
  if (!rows.length) return <p className="py-16 text-center text-mute">Nada coincide con la búsqueda o el filtro.</p>

  return (
    <>
      <div className="mt-6 hidden overflow-hidden rounded-[24px] bg-white ring-1 ring-line md:block">
        <table className="w-full text-left text-[0.94rem]">
          <thead className="border-b border-line text-[13px] text-mute">
            <tr>
              {columns.map((c) => (
                <th key={c.head} className={`px-5 py-3.5 font-normal ${c.hide ? hideCls[c.hide] : ''} ${c.align === 'right' ? 'text-right' : ''}`}>
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
                className="cursor-pointer border-b border-line align-middle transition-colors duration-150 last:border-0 hover:bg-paper/70 focus-visible:bg-paper/70 focus-visible:outline-none"
                onClick={() => onOpen(l.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), onOpen(l.id))}
              >
                {columns.map((c) => (
                  <td key={c.head} className={`px-5 py-4 ${c.hide ? hideCls[c.hide] : ''} ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.cell(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 flex flex-col gap-3 md:hidden">
        {rows.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onOpen(l.id)} className="block w-full rounded-[20px] bg-white p-4 text-left ring-1 ring-line active:scale-[0.99]">
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
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <Code code={l.code} />
          <span className="truncate font-medium text-ink">{l.name}</span>
        </span>
        {sub && <span className="mt-0.5 block truncate text-[13px] text-mute">{sub}</span>}
      </span>
      {right}
    </span>
  )
}

function Code({ code }: { code?: string }) {
  return <span className="inline-block shrink-0 whitespace-nowrap rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[12px] font-medium text-ink-2 tabular">{code ?? '…'}</span>
}

function WebLink({ url }: { url?: string }) {
  if (!url) return <span className="text-mute">Sin publicar</span>
  return (
    <a
      href={withProtocol(url)}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-[240px] items-center gap-1 truncate text-cobalt underline-offset-2 hover:underline"
    >
      <span className="truncate">{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
      <Icon name="arrowUpRight" size={14} className="shrink-0" />
    </a>
  )
}

function PaySelect({ lead, onError }: { lead: Lead; onError: (m: string) => void }) {
  const value = lead.paymentStatus ?? 'pendiente'
  const tone = { pendiente: 'text-[#8a5a00] bg-[#f5a524]/15', pagado: 'text-emerald-700 bg-emerald-500/12', atrasado: 'text-[#c23237] bg-[#e5484d]/10' }[value]
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'amber' | 'red' | 'green' }) {
  const dot = tone === 'amber' ? 'bg-[#f5a524]' : tone === 'red' ? 'bg-[#e5484d]' : tone === 'green' ? 'bg-emerald-500' : 'bg-cobalt'
  return (
    <div className="min-w-0 rounded-[20px] bg-white p-3.5 ring-1 ring-line sm:p-5">
      <span className="flex items-start gap-2 text-[12px] leading-tight text-mute sm:text-[13.5px]">
        <span className={`mt-1 size-2 shrink-0 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="mt-2 block truncate font-display text-[1.3rem] leading-none sm:text-[1.9rem] font-semibold tracking-[-0.03em] tabular">{value}</span>
    </div>
  )
}

function Chips<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { key: K; label: string; count: number }[]
  value: K
  onChange: (k: K) => void
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] ring-1 transition-colors duration-150 ${
            value === o.key ? 'bg-ink text-paper ring-ink' : 'bg-white/60 ring-line hover:bg-white'
          }`}
        >
          {o.label}
          <span className={`tabular text-[12.5px] ${value === o.key ? 'text-paper/60' : 'text-mute'}`}>{o.count}</span>
        </button>
      ))}
    </div>
  )
}
