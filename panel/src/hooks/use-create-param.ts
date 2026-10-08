'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

/** Abre un modal de creación cuando la URL trae `?nuevo=1` (enlaces del menú «Nuevo» de la cabecera). */
export function useCreateParam(param = 'nuevo') {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpenState] = useState(() => params.get(param) === '1')
  const setOpen = useCallback(
    (v: boolean) => {
      setOpenState(v)
      if (!v && params.get(param)) {
        const next = new URLSearchParams(params.toString())
        next.delete(param)
        router.replace(next.size ? `${pathname}?${next}` : pathname)
      }
    },
    [params, param, router, pathname],
  )
  return [open, setOpen] as const
}
