'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { WorkspaceHeader } from '@webfudge/ui'
import notificationService from '@/lib/notificationService'

type BreadcrumbItem = string | { label: string; href: string }

type BooksPageHeaderProps = {
  title: string
  subtitle: ReactNode
  breadcrumb?: BreadcrumbItem[]
  showBreadcrumb?: boolean
  showSearch?: boolean
  showActions?: boolean
  showProfile?: boolean
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
  onAddClick?: () => void
  onFilterClick?: () => void
  onImportClick?: () => void
  onExportClick?: () => void
  onShareImageClick?: () => void
  hasActiveFilters?: boolean
  actions?: any
  children?: ReactNode
  showBack?: boolean
  onBack?: () => void
  backLabel?: string
}

export default function BooksPageHeader({
  title,
  subtitle,
  breadcrumb = [],
  showBreadcrumb = true,
  showSearch = false,
  showActions = false,
  showProfile = true,
  searchPlaceholder,
  onSearchChange,
  onAddClick,
  onFilterClick,
  onImportClick,
  onExportClick,
  onShareImageClick,
  hasActiveFilters,
  actions,
  children,
  showBack,
  onBack,
  backLabel,
}: BooksPageHeaderProps) {
  const pathname = usePathname()
  const defaultShowBack = pathname !== '/home' && pathname !== '/'

  return (
    <WorkspaceHeader
      showBack={showBack ?? defaultShowBack}
      onBack={onBack}
      backLabel={backLabel}
      title={title}
      subtitle={subtitle}
      breadcrumb={breadcrumb}
      showBreadcrumb={showBreadcrumb}
      showSearch={showSearch}
      showActions={showActions}
      showProfile={showProfile}
      searchPlaceholder={searchPlaceholder}
      onSearchChange={onSearchChange}
      onAddClick={onAddClick}
      onFilterClick={onFilterClick}
      onImportClick={onImportClick}
      onExportClick={onExportClick}
      onShareImageClick={onShareImageClick}
      hasActiveFilters={hasActiveFilters}
      actions={actions}
      notificationService={notificationService}
    >
      {children}
    </WorkspaceHeader>
  )
}
