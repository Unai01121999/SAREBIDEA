'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WebsIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/webs/produccion')
  }, [router])
  return null
}
