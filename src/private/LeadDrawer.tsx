import { motion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { businessTypes } from '../data/site'
import { easeOut } from '../lib/motion'
import {
  createLead,
  daysUntil,
  deleteLead,
  euros,
  paymentLabels,
  sourceLabels,
  statusLabels,
  updateLead,
  validateLead,
  type Lead,
  type LeadFormErrors,
  type LeadSource,
  type LeadStatus,
  type PaymentStatus,
} from '../lib/leads'
import { Icon, type IconName } from '../components/ui/Icon'
import { Avatar, CARD } from './ui'

const input =
  'w-full rounded-xl bg-white px-3.5 py-3 text-[0.96rem] text-slate-900 ring-1 ring-slate-900/10 transition-shadow duration-150 placeholder:text-slate-400 focus:ring-2 focus:ring-cobalt focus:outline-none aria-[invalid=true]:ring-rose-500'

type Props =
  | { mode: 'new'; lead?: undefined; onClose: () => void }
  | { mode: 'view'; lead: Lead; onClose: () => void }

export const dateLong = (ymd?: string) =>
  ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

/** "midominio.com" a partir de lo que se escriba (con o sin https://, www, barra final). */
const cleanDomain = (v: string) => v.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
export const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** Panel lateral: alta manual de cliente o ficha de una solicitud. */
export function LeadDrawer(props: Props) {
  const { mode, lead, onClose } = props
  const isNew = mode === 'new'
  const [editing, setEditing] = useState(isNew)
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    panel.current?.querySelector<HTMLElement>('input, button')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, editing])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    const v = {
      name: String(d.get('name') ?? '').trim(),
      phone: String(d.get('phone') ?? '').trim(),
      email: String(d.get('email') ?? '').trim(),
      businessType: String(d.get('businessType') ?? ''),
      description: String(d.get('description') ?? '').trim(),
      source: String(d.get('source') ?? 'telefono') as LeadSource,
      status: String(d.get('status') ?? 'nuevo') as LeadStatus,
      notes: String(d.get('notes') ?? '').trim(),
      website: String(d.get('website') ?? '').trim(),
      domain: cleanDomain(String(d.get('domain') ?? '')),
      domainExpiry: String(d.get('domainExpiry') ?? ''),
      webExpiry: String(d.get('webExpiry') ?? ''),
      amount: String(d.get('amount') ?? '').trim() === '' ? null : Number(String(d.get('amount')).replace(',', '.')),
      paymentStatus: String(d.get('paymentStatus') ?? 'pendiente') as PaymentStatus,
    }
    const errs = validateLead(v, { requireAll: false })
    if (v.amount !== null && (!Number.isFinite(v.amount) || v.amount < 0)) errs.amount = 'Escribe una cantidad válida, por ejemplo 450 o 450,50.'
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) {
      ;(form.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    setSaving(true)
    setFailed('')
    try {
      if (isNew) await createLead(v)
      else await updateLead(lead.id, v)
      if (isNew) onClose()
      else setEditing(false)
    } catch {
      setFailed('No se ha podido guardar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!lead) return
    setSaving(true)
    try {
      await deleteLead(lead.id)
      onClose()
    } catch {
      setFailed('No se ha podido eliminar. Inténtalo de nuevo.')
      setSaving(false)
    }
  }

  const err = (k: keyof LeadFormErrors) => (errors[k] ? <p id={`d-${k}-err`} className="mt-1 text-[13px] text-rose-700">{errors[k]}</p> : null)
  const aria = (k: keyof LeadFormErrors) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `d-${k}-err` : undefined })

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <motion.button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        ref={panel}
        data-lenis-prevent
        className="relative flex h-full w-full max-w-[540px] flex-col overflow-y-auto bg-[#f4f5f8] text-slate-900 shadow-[-20px_0_60px_-20px_rgb(15_23_42/0.35)]"
        initial={{ transform: 'translate3d(100%,0,0)' }}
        animate={{ transform: 'translate3d(0,0,0)' }}
        exit={{ transform: 'translate3d(100%,0,0)' }}
        transition={{ duration: 0.4, ease: easeOut }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-900/[0.07] bg-white/95 px-5 py-4 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            {lead && !editing && <Avatar name={lead.name} size={40} />}
            <div className="min-w-0">
              <h2 id="drawer-title" className="truncate font-display text-[1.25rem] font-semibold tracking-[-0.02em]">
                {isNew ? 'Dar de alta cliente' : editing ? 'Editar ficha' : lead?.name}
              </h2>
              {lead && !editing && (
                <p className="mt-0.5 flex items-center gap-2 text-[12.5px] text-slate-500">
                  {lead.code && <span className="font-medium text-slate-700 tabular">{lead.code}</span>}
                  <span>{sourceLabels[lead.source] ?? lead.source}</span>
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-slate-900/10 hover:bg-slate-50" aria-label="Cerrar panel">
            <Icon name="close" size={18} />
          </button>
        </div>

        {editing || !lead ? (
          <form onSubmit={onSubmit} noValidate className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-7">
            <Field label="Nombre completo" id="d-name" className="sm:col-span-2">
              <input id="d-name" name="name" defaultValue={lead?.name} autoComplete="off" className={input} {...aria('name')} />
              {err('name')}
            </Field>
            <Field label="Teléfono" id="d-phone">
              <input id="d-phone" name="phone" type="tel" inputMode="tel" defaultValue={lead?.phone} className={input} {...aria('phone')} />
              {err('phone')}
            </Field>
            <Field label="Correo electrónico" id="d-email">
              <input id="d-email" name="email" type="email" inputMode="email" defaultValue={lead?.email} className={input} {...aria('email')} />
              {err('email')}
            </Field>
            <Field label="Tipo de negocio" id="d-type" className="sm:col-span-2">
              <select id="d-type" name="businessType" defaultValue={lead?.businessType ?? ''} className={input}>
                <option value="">Sin especificar</option>
                {businessTypes.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Breve descripción" id="d-desc" className="sm:col-span-2">
              <textarea id="d-desc" name="description" rows={3} defaultValue={lead?.description} placeholder="Qué necesita, qué os contó por teléfono…" className={`${input} resize-none`} />
            </Field>
            <Field label="Cómo contactó" id="d-source">
              <select id="d-source" name="source" defaultValue={lead?.source ?? 'telefono'} className={input}>
                {(Object.keys(sourceLabels) as LeadSource[]).map((k) => (
                  <option key={k} value={k}>
                    {sourceLabels[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado" id="d-status">
              <select id="d-status" name="status" defaultValue={lead?.status ?? 'nuevo'} className={input}>
                {(Object.keys(statusLabels) as LeadStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {statusLabels[k]}
                  </option>
                ))}
              </select>
            </Field>
            <h3 className="mt-3 border-t border-slate-900/[0.08] pt-5 font-display text-[1.05rem] font-semibold sm:col-span-2">Web y dominio</h3>
            <Field label="Web publicada" id="d-website" className="sm:col-span-2">
              <input id="d-website" name="website" type="url" inputMode="url" defaultValue={lead?.website} placeholder="https://www.sunegocio.com" className={input} />
            </Field>
            <Field label="Dominio" id="d-domain" className="sm:col-span-2">
              <input id="d-domain" name="domain" defaultValue={lead?.domain} placeholder="sunegocio.com" autoCapitalize="off" className={input} />
            </Field>
            <Field label="Vencimiento del dominio" id="d-domainExpiry">
              <input id="d-domainExpiry" name="domainExpiry" type="date" defaultValue={lead?.domainExpiry} className={input} />
            </Field>
            <Field label="Vencimiento de la web" id="d-webExpiry">
              <input id="d-webExpiry" name="webExpiry" type="date" defaultValue={lead?.webExpiry} className={input} />
            </Field>
            <h3 className="mt-3 border-t border-slate-900/[0.08] pt-5 font-display text-[1.05rem] font-semibold sm:col-span-2">Cuenta</h3>
            <Field label="Cantidad a pagar (€)" id="d-amount">
              <input
                id="d-amount"
                name="amount"
                inputMode="decimal"
                defaultValue={typeof lead?.amount === 'number' ? String(lead.amount).replace('.', ',') : ''}
                placeholder="0"
                className={`${input} tabular`}
                {...aria('amount')}
              />
              {err('amount')}
            </Field>
            <Field label="Estado del pago" id="d-paymentStatus">
              <select id="d-paymentStatus" name="paymentStatus" defaultValue={lead?.paymentStatus ?? 'pendiente'} className={input}>
                {(Object.keys(paymentLabels) as PaymentStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {paymentLabels[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notas internas" id="d-notes" className="sm:col-span-2 mt-3 border-t border-slate-900/[0.08] pt-5">
              <textarea id="d-notes" name="notes" rows={3} defaultValue={lead?.notes} placeholder="Solo las ves tú." className={`${input} resize-none`} />
            </Field>
            {failed && <p role="alert" className="text-sm text-rose-700 sm:col-span-2">{failed}</p>}
            <div className="flex gap-3 pt-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 font-medium text-white transition-[scale,opacity] duration-150 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? 'Guardando…' : isNew ? 'Dar de alta' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={isNew ? onClose : () => setEditing(false)} className="h-12 rounded-xl bg-white px-5 ring-1 ring-slate-900/10 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-5 px-5 py-6 sm:px-7">
            {/* Estado y acciones rápidas */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <PaymentBadge status={lead.paymentStatus} />
              <span className="text-[13px] text-slate-500">Alta: {fmt(lead.createdAt)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Action icon="phone" label="Llamar" href={lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, '')}` : undefined} />
              <Action icon="mail" label="Escribir" href={lead.email ? `mailto:${lead.email}` : undefined} />
              <Action icon="globe" label="Ver web" href={lead.website ? withProtocol(lead.website) : undefined} external />
            </div>

            <Section title="Contacto">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label="Teléfono" value={lead.phone} />
                <Info label="Correo electrónico" value={lead.email} />
                <Info label="Tipo de negocio" value={lead.businessType} className="sm:col-span-2" />
              </dl>
            </Section>

            <Section title="Web y dominio">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[13px] text-slate-500">Web publicada</dt>
                  <dd className="mt-0.5 break-words">
                    {lead.website ? (
                      <a href={withProtocol(lead.website)} target="_blank" rel="noreferrer" className="text-sky-700 underline-offset-2 hover:underline">
                        {lead.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <Info label="Dominio" value={lead.domain ?? ''} className="sm:col-span-2" />
                <div>
                  <dt className="text-[13px] text-slate-500">Vence el dominio</dt>
                  <dd className="mt-1">
                    <ExpiryBadge date={lead.domainExpiry} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-slate-500">Vence la web</dt>
                  <dd className="mt-1">
                    <ExpiryBadge date={lead.webExpiry} />
                  </dd>
                </div>
              </dl>
            </Section>

            <Section title="Cuenta">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-display text-[1.8rem] leading-none font-semibold tracking-[-0.02em] tabular">{euros(lead.amount)}</span>
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Estado del pago">
                  {(Object.keys(paymentLabels) as PaymentStatus[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={(lead.paymentStatus ?? 'pendiente') === k}
                      onClick={() => updateLead(lead.id, { paymentStatus: k }).catch(() => setFailed('No se ha podido cambiar el estado del pago.'))}
                      className={`rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors duration-150 ${(lead.paymentStatus ?? 'pendiente') === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      {paymentLabels[k]}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Lo que nos contó">
              <p className="leading-relaxed whitespace-pre-wrap text-slate-800">{lead.description || '—'}</p>
            </Section>
            {lead.notes && (
              <Section title="Notas internas">
                <p className="leading-relaxed whitespace-pre-wrap text-slate-800">{lead.notes}</p>
              </Section>
            )}

            <Section title="Cambiar estado">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(statusLabels) as LeadStatus[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={lead.status === k}
                    onClick={() => lead.status !== k && updateLead(lead.id, { status: k }).catch(() => setFailed('No se ha podido cambiar el estado.'))}
                    className={`rounded-lg px-3.5 py-2 text-[14px] font-medium ring-1 transition-colors duration-150 ${lead.status === k ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-900/10 hover:bg-slate-50'}`}
                  >
                    {statusLabels[k]}
                  </button>
                ))}
              </div>
            </Section>

            {failed && <p role="alert" className="text-sm text-rose-700">{failed}</p>}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-900/[0.08] pt-5">
              <button type="button" onClick={() => setEditing(true)} className="inline-flex h-11 items-center rounded-xl bg-slate-900 px-5 font-medium text-white active:scale-[0.98]">
                Editar ficha
              </button>
              {confirmDelete ? (
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  ¿Eliminar definitivamente?
                  <button type="button" onClick={remove} disabled={saving} className="h-11 rounded-xl bg-rose-600 px-4 font-medium text-white">
                    Sí, eliminar
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="h-11 rounded-xl bg-white px-4 ring-1 ring-slate-900/10">
                    No
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-rose-700 hover:bg-rose-50">
                  <Icon name="trash" size={17} /> Eliminar
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-medium tracking-wide text-slate-500 uppercase">{title}</h3>
      <div className={`${CARD} p-5`}>{children}</div>
    </section>
  )
}

function Action({ icon, label, href, external }: { icon: IconName; label: string; href?: string; external?: boolean }) {
  const base = 'flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[12.5px] font-medium ring-1 transition-colors duration-150'
  if (!href)
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed bg-slate-50 text-slate-300 ring-slate-900/[0.06]`}>
        <Icon name={icon} size={18} />
        {label}
      </span>
    )
  return (
    <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} className={`${base} bg-white text-slate-700 ring-slate-900/10 hover:bg-sky-50 hover:text-sky-700`}>
      <Icon name={icon} size={18} />
      {label}
    </a>
  )
}

function Field({ label, id, className = '', children }: { label: string; id: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}

function Info({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[13px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-900 select-all">{value || '—'}</dd>
    </div>
  )
}

const payBadge: Record<PaymentStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-700',
  pagado: 'bg-emerald-50 text-emerald-700',
  atrasado: 'bg-rose-50 text-rose-700',
}

export function PaymentBadge({ status = 'pendiente' }: { status?: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${payBadge[status] ?? payBadge.pendiente}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {paymentLabels[status] ?? status}
    </span>
  )
}

/** Fecha de vencimiento con aviso: rojo si ya venció, ámbar si quedan 30 días o menos. */
export function ExpiryBadge({ date }: { date?: string }) {
  const days = daysUntil(date)
  if (days === null) return <span className="text-slate-400">Sin fecha</span>
  const tone = days < 0 ? 'text-rose-700' : days <= 30 ? 'text-amber-700' : 'text-slate-500'
  const hint = days < 0 ? `Vencido hace ${-days} ${-days === 1 ? 'día' : 'días'}` : days === 0 ? 'Vence hoy' : `Quedan ${days} ${days === 1 ? 'día' : 'días'}`
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="text-slate-900 tabular">{dateLong(date)}</span>
      <span className={`text-[12.5px] ${tone}`}>
        {days <= 30 && <span className="mr-1 inline-block size-1.5 rounded-full bg-current align-middle" />}
        {hint}
      </span>
    </span>
  )
}

const badge: Record<LeadStatus, string> = {
  nuevo: 'bg-sky-50 text-sky-700',
  contactado: 'bg-amber-50 text-amber-700',
  cliente: 'bg-emerald-50 text-emerald-700',
  descartado: 'bg-slate-100 text-slate-500',
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${badge[status] ?? badge.nuevo}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status] ?? status}
    </span>
  )
}
