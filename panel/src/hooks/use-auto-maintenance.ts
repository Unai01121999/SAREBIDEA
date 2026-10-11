'use client'

import { addMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useRef } from 'react'
import { invoicesApi, useSettings } from '@/hooks/use-entities'
import { useCan } from '@/hooks/use-permissions'
import { PACKS } from '@/lib/packs'
import { supabase } from '@/lib/supabase'

/**
 * Facturación del mantenimiento: la primera factura de un pack lleva pack + primer mes; a partir del mes siguiente se genera
 * una factura independiente solo de mantenimiento, una por mes, con la misma fecha de emisión (día del mes) que la primera.
 * Solo para el modo demostración (sin Supabase). Con Supabase las genera la propia base de datos cada día a las 04:05 UTC
 * (función `generar_facturas_mantenimiento`, tarea `facturas-mantenimiento-mensual` de pg_cron), aunque nadie abra el panel.
 */
export function useAutoMaintenance() {
  const can = useCan()
  const { data: invoices } = invoicesApi.useList()
  const { data: settings } = useSettings()
  const create = invoicesApi.useCreate(true)
  const running = useRef(false)
  // Lo creado en esta sesión: la lista puede llegar desactualizada tras cada alta, y así nunca se repite un mes ni un número.
  const created = useRef({ keys: new Set<string>(), max: 0 })

  useEffect(() => {
    if (supabase || !invoices || !settings || !can('billing', 'write') || running.current) return
    const now = new Date()
    const exists = new Set(invoices.filter((i) => i.originId).map((i) => `${i.originId}|${new Date(i.issuedAt).toISOString()}`))
    const year = now.getFullYear()
    let max = Math.max(created.current.max, invoices.filter((i) => i.number.startsWith(`F-${year}-`)).reduce((m, i) => Math.max(m, Number(i.number.split('-')[2]) || 0), 0))
    const todo: Parameters<typeof create.mutateAsync>[0][] = []
    for (const first of invoices) {
      if (!first.pack || !first.maintenance || first.originId || first.concept !== 'WEB_DEVELOPMENT' || first.status === 'CANCELLED') continue
      for (let k = 1; k <= 36; k++) {
        const issued = addMonths(new Date(first.issuedAt), k)
        if (issued > now) break
        const key = `${first.id}|${issued.toISOString()}`
        if (exists.has(key) || created.current.keys.has(key)) continue
        created.current.keys.add(key)
        max += 1
        created.current.max = max
        const due = new Date(issued.getTime() + 30 * 864e5)
        todo.push({
          number: `F-${year}-${String(max).padStart(3, '0')}`,
          clientId: first.clientId,
          concept: 'MAINTENANCE',
          description: `Mantenimiento mensual ${PACKS[first.pack].label} · ${format(issued, 'LLLL yyyy', { locale: es })}`,
          issuedAt: issued.toISOString(),
          dueAt: due.toISOString(),
          subtotal: 0,
          pack: first.pack,
          maintenance: first.maintenance,
          originId: first.id,
          taxRate: first.taxRate,
          status: 'PENDING',
          recurring: true,
          websiteId: first.websiteId,
          domainId: null,
          hostingId: null,
        })
      }
    }
    if (!todo.length) return
    running.current = true
    void (async () => {
      for (const t of todo) {
        try {
          await create.mutateAsync(t)
        } catch {
          /* ya existía (índice único) o sin permiso: se ignora */
        }
      }
      running.current = false
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, settings])
}
