'use client'

import { WorkspaceLayoutContent } from '@webfudge/ui'
import AccountsSidebar from './AccountsSidebar'

export default function LayoutContent({ children }) {
  return (
    <WorkspaceLayoutContent
      sidebar={AccountsSidebar}
      showPwa={false}
      canView={true}
    >
      {children}
    </WorkspaceLayoutContent>
  )
}
