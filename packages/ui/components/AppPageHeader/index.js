'use client';

/**
 * AppPageHeader — shared WorkspaceHeader wrapper used by every workspace app
 * (PM, CRM, Accounts, Books …).
 *
 * Each app passes its own `notificationService` and `renderGlobalSearchModal`
 * so the header stays generic while the data layer stays in the app.
 *
 * Props (all optional unless noted):
 *   title                  – page title string
 *   subtitle               – sub-heading string
 *   breadcrumb             – array of { label, href } items
 *   showSearch             – show search icon/input (default false)
 *   showActions            – show action buttons (default false)
 *   showProfile            – show profile avatar (default true)
 *   searchPlaceholder      – placeholder for the search input
 *   onSearchChange         – (value: string) => void
 *   onAddClick             – () => void
 *   onFilterClick          – () => void
 *   onImportClick          – () => void
 *   onExportClick          – () => void
 *   onShareImageClick      – () => void
 *   hasActiveFilters       – boolean
 *   actions                – ReactNode — extra action buttons
 *   children               – ReactNode — extra content below header
 *   showBack               – show a labeled Back control (default false)
 *   onBack                 – () => void — custom back handler (defaults to router.back())
 *   backLabel              – label for the back control (default "Back")
 *   notificationService    – (REQUIRED) app-specific notification service instance
 *   renderGlobalSearchModal – ({ isOpen, onClose, initialQuery }) => ReactNode
 *   searchInputClassName   – Tailwind class override for the search input
 *   titleClassName         – Tailwind class override for the page title
 */

import { WorkspaceHeader } from '../WorkspaceHeader';

const DEFAULT_SEARCH_INPUT_CLASS =
  'w-64 pl-10 pr-4 py-2.5 bg-white border border-orange-500/40 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 placeholder:text-gray-400 text-gray-800';

export function AppPageHeader({
  title,
  subtitle,
  breadcrumb = [],
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
  hasActiveFilters = false,
  actions,
  children,
  showBack = false,
  onBack,
  backLabel = 'Back',
  notificationService,
  renderGlobalSearchModal,
  searchInputClassName = DEFAULT_SEARCH_INPUT_CLASS,
  titleClassName,
}) {
  return (
    <WorkspaceHeader
      title={title}
      titleClassName={titleClassName}
      subtitle={subtitle}
      breadcrumb={breadcrumb}
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
      showBack={showBack}
      onBack={onBack}
      backLabel={backLabel}
      notificationService={notificationService}
      renderGlobalSearchModal={renderGlobalSearchModal}
      searchInputClassName={searchInputClassName}
    >
      {children}
    </WorkspaceHeader>
  );
}

export default AppPageHeader;
