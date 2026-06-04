'use client'

import type { ChangeEvent, ReactNode } from 'react'
import { Filter } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, WorkspaceSearchInput } from '@webfudge/ui'
import { booksToolbarFilterButtonClassName, booksToolbarSearchInputClassName } from '../tables/booksToolbarStyles'

export type BooksHubToolbarProps = {
  title: string
  subtitle?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showFilter?: boolean
  filterLabel?: string
  onFilterClick?: () => void
  trailing?: ReactNode
  className?: string
}

/**
 * Books home hub pages — heading left, CRM workspace search + filter right (Zoho Books activity-style).
 */
export function BooksHubToolbar({
  title,
  subtitle,
  searchPlaceholder = 'Search anything...',
  searchValue = '',
  onSearchChange,
  showFilter = true,
  filterLabel = 'Filter',
  onFilterClick,
  trailing,
  className,
}: BooksHubToolbarProps) {
  return (
    <div
      className={clsx(
        'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] p-5 md:p-6',
        className
      )}
    >
      <div className="min-w-0 pr-2">
        <h2 className="text-base font-semibold text-[var(--books-text-primary,#111827)]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {trailing}
        <WorkspaceSearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange?.(e.target.value)}
          className={booksToolbarSearchInputClassName}
        />
        {showFilter ? (
          <Button
            type="button"
            variant="muted"
            size="sm"
            rounded="pill"
            className={booksToolbarFilterButtonClassName}
            onClick={onFilterClick}
          >
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            {filterLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
