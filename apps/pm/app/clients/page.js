'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** PM Clients hub — same entry as CRM client accounts list. */
export default function ClientsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/clients/accounts')
  }, [router])
  return null
}
