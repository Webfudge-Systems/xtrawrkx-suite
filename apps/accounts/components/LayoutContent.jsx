'use client'

import { WorkspaceLayoutContent } from '@webfudge/ui'
import AccountsSidebar from './AccountsSidebar'
import { ACCOUNTS_SITE } from '../lib/site'

export default function LayoutContent({ children }) {
  return (
    <WorkspaceLayoutContent
      sidebar={AccountsSidebar}
      sidebarBehavior="hide"
      sidebarBranding={{
        logoPath: ACCOUNTS_SITE.logoPath,
        productName: ACCOUNTS_SITE.name,
        companyName: ACCOUNTS_SITE.brandName,
        homeHref: '/',
      }}
      showPwa={false}
      canView={true}
    >
      {children}
    </WorkspaceLayoutContent>
  )
}
