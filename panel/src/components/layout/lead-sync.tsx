'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { syncFormLeads } from '@/services/leads-sync'

/** Trae al panel las solicitudes del formulario al abrirlo y cada pocos minutos. No pinta nada. */
export function LeadSync() {
  const qc = useQueryClient()
  useEffect(() => {
    let alive = true
    const run = async (announce: boolean) => {
      const n = await syncFormLeads().catch(() => 0)
      if (!alive || !n) return
      qc.invalidateQueries()
      if (announce) toast.info(n === 1 ? 'Nueva solicitud del formulario web' : `${n} solicitudes nuevas del formulario web`)
    }
    run(true)
    const t = setInterval(() => run(true), 3 * 60_000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [qc])
  return null
}
