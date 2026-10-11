'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// El listado de hosting ya no es una sección del menú: el hosting se gestiona desde la ficha de cada cliente.
export default function HostingIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/clientes')
  }, [router])
  return null
}
