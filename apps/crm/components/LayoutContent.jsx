'use client'

import { WorkspaceLayoutContent } from '@webfudge/ui'
import { usePathname } from 'next/navigation'
import CRMSidebar from './CRMSidebar'
import CRMQuickActionsFab from './CRMQuickActionsFab'
import { canReadCurrentCRMPath, crmModuleForPath } from '../lib/rbac'

const PUBLIC_PATHS = ['/login', '/unauthorized', '/coming-soon']

const MODULE_LABELS = {
  client_invoices:  'Client invoices',
  proposals:        'Proposals',
  client_accounts:  'Client accounts',
  deals:            'Deals',
}

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('auth-token'))
  const canView = isPublic || !hasToken || canReadCurrentCRMPath(pathname)
  const moduleKey = crmModuleForPath(pathname)
  const moduleLabel = MODULE_LABELS[moduleKey] || 'This CRM module'

  return (
    <WorkspaceLayoutContent
      sidebar={CRMSidebar}
      appName="Webfudge CRM"
      pwaStorageKey="crm"
      canView={canView}
      deniedTitle={`${moduleLabel} is not available for your role.`}
      deniedDescription="Your current permissions do not include read access for this area. Contact an admin or manager if you need this module enabled."
      deniedVariant="card"
      extras={<CRMQuickActionsFab />}
    >
      {children}
    </WorkspaceLayoutContent>
  )
}
