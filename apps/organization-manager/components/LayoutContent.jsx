'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import { AppShell } from '@webfudge/ui'
import PlatformSidebar from './PlatformSidebar'
import { ORG_MANAGER_SITE } from '../lib/site'

const PUBLIC_PATHS = ['/login', '/unauthorized']

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, loading, isPlatformAdmin } = useAuth()

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (loading) return
    if (pathname === '/') {
      router.replace(isAuthenticated && isPlatformAdmin() ? '/organizations' : '/login')
    }
  }, [loading, isAuthenticated, pathname, router, isPlatformAdmin])

  useEffect(() => {
    if (loading || isPublic) return
    if (isAuthenticated && !isPlatformAdmin()) {
      router.replace('/unauthorized')
    }
  }, [loading, isAuthenticated, isPublic, isPlatformAdmin, router])

  if (pathname === '/') {
    return null
  }

  return (
    <AppShell
      sidebar={PlatformSidebar}
      loginPath="/login"
      unauthorizedPath="/unauthorized"
      mobileNav
      mobileNavTitle={ORG_MANAGER_SITE.shortName}
    >
      {children}
    </AppShell>
  )
}
