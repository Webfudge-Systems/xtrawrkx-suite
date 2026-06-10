'use client'

import { usePathname } from 'next/navigation'
import { PAGE_HEADER_SEARCH_INPUT_CLASS, WorkspaceHeader } from '@webfudge/ui'

/**
 * Organization Manager page header — WorkspaceHeader without workspace notifications.
 */
export default function PlatformPageHeader({ showBack, searchInputClassName, ...props }) {
  const pathname = usePathname()
  const defaultShowBack = pathname !== '/organizations'

  return (
    <WorkspaceHeader
      showProfile
      showNotifications={false}
      showBack={showBack ?? defaultShowBack}
      searchInputClassName={searchInputClassName ?? PAGE_HEADER_SEARCH_INPUT_CLASS}
      {...props}
    />
  )
}
