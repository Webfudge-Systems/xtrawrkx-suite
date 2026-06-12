'use client'

import { usePathname } from 'next/navigation'
import { workspaceSearchInputClassName, WorkspaceHeader } from '@webfudge/ui'

/**
 * Organization Manager page header — WorkspaceHeader without workspace notifications.
 */
export default function PlatformPageHeader({ showBack, searchInputClassName, ...props }) {
  const pathname = usePathname()
  const defaultShowBack = pathname !== '/organizations'

  return (
    <WorkspaceHeader
      showProfile
      showBack={showBack ?? defaultShowBack}
      searchInputClassName={searchInputClassName ?? workspaceSearchInputClassName}
      {...props}
    />
  )
}
