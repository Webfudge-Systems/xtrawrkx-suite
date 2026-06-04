'use client'

import { WorkspaceLayoutContent } from '@webfudge/ui'
import { usePathname } from 'next/navigation'
import PMSidebar from './PMSidebar'
import PMQuickActionsFab from './PMQuickActionsFab'
import { canReadCurrentPMPath } from '../lib/rbac'

const PUBLIC_PATHS = ['/login', '/unauthorized', '/coming-soon']

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth-token'))
  const canView = isPublic || !hasToken || canReadCurrentPMPath(pathname)

  return (
    <WorkspaceLayoutContent
      sidebar={PMSidebar}
      appName="Webfudge PM"
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
