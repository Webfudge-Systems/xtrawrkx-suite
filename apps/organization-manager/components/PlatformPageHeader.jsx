'use client'

import { PAGE_HEADER_SEARCH_INPUT_CLASS, WorkspaceHeader } from '@webfudge/ui'

/**
 * Organization Manager page header — WorkspaceHeader without workspace notifications.
 */
export default function PlatformPageHeader({ searchInputClassName, ...props }) {
  return (
    <WorkspaceHeader
      showProfile
      showNotifications={false}
      searchInputClassName={searchInputClassName ?? PAGE_HEADER_SEARCH_INPUT_CLASS}
      {...props}
    />
  )
}
