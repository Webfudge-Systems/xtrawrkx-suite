'use client'

import { WorkspaceLayoutContent } from '@webfudge/ui'
import { usePathname } from 'next/navigation'
import PMSidebar from './PMSidebar'
import PMQuickActionsFab from './PMQuickActionsFab'
import { canReadCurrentPMPath } from '../lib/rbac'
import { PM_SITE } from '../lib/site'

const PUBLIC_PATHS = ['/login', '/unauthorized', '/coming-soon']

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth-token'))
  const canView = isPublic || !hasToken || canReadCurrentPMPath(pathname)

  return (
    <WorkspaceLayoutContent
      sidebar={PMSidebar}
      sidebarBehavior="hide"
      sidebarBranding={{
        logoPath: PM_SITE.logoPath,
        productName: PM_SITE.name,
        companyName: PM_SITE.brandName,
        homeHref: '/',
      }}
      appName={PM_SITE.name}
      pwaStorageKey="pm"
      canView={canView}
      deniedTitle="Access denied"
      deniedDescription="Your current role does not have access to this Project Management module."
      extras={<PMQuickActionsFab />}
    >
      {children}
    </WorkspaceLayoutContent>
  )
}
