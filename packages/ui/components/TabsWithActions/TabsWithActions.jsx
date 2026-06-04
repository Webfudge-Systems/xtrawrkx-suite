'use client'

import { clsx } from 'clsx'
import { Search, Plus, List, LayoutGrid, CalendarDays, Eye, Filter, ListChecks, ArrowUpDown } from 'lucide-react'
import { booksPillTrackClassName, booksPillTrackHugClassName } from '../../themes/booksSurface'

/**
 * Advanced Tabs component with integrated actions, search, and view toggles
 * Perfect for CRM-style list/board views with filtering and actions
 *
 * Variants:
 * - glass | modern | default — toolbar + tabs (list pages)
 * - pill — white pill-shaped track, evenly spaced tabs; active = solid orange pill, inactive = text only (detail pages)
 */
export function TabsWithActions({
  tabs,
  activeTab,
  onTabChange,

  // Search props
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',

  // Actions props
  showAdd = false,
  onAddClick,
  addTitle = 'Add New',

  showFilter = false,
  onFilterClick,
  filterTitle = 'Filter',

  showBulkEdit = false,
  onBulkEditClick,
  bulkEditActive = false,
  bulkEditTitle = 'Bulk edit',

  showColumnVisibility = false,
  onColumnVisibilityClick,
  columnVisibilityTitle = 'Column Visibility',

  showSort = false,
  onSortClick,
  sortTitle = 'Sort',
  hasActiveSort = false,

  // View toggle props
  showViewToggle = false,
  activeView = 'list',
  onViewChange,
  viewOptions = ['list', 'board'],
  listViewTitle = 'List view',
  boardViewTitle = 'Board view',
  calendarViewTitle = 'Calendar view',

  /** Rendered immediately after the tab buttons (e.g. list/table/kanban icons), still left of search/actions */
  afterTabs = null,

  // Styling
  className,
  variant = 'glass',
  /** For `pill` variant: `light` (CRM default) or `books` (uses `--books-*` tokens). `booksModern` always uses books pill track. */
  pillTheme = 'light',
  /** `stretch` — track grows, tabs share width (list toolbars). `hug` — track fits tabs with even inner padding (header sub-nav). */
  pillTrack = 'stretch',
  /** When set, overrides default search input classes (Books dark toolbar). */
  searchInputClassName,
  ...props
}) {
  const handleTabClick = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId)
    }
  }

  const hasRightPanel =
    showSearch ||
    (showAdd && onAddClick) ||
    (showFilter && onFilterClick) ||
    (showBulkEdit && onBulkEditClick) ||
    (showColumnVisibility && onColumnVisibilityClick) ||
    (showSort && onSortClick) ||
    showViewToggle

  const hasAfterTabs = Boolean(afterTabs)

  const isPill = variant === 'pill'
  const isBooksModern = variant === 'booksModern'
  const useBooksPill = isBooksModern || (isPill && pillTheme === 'books')
  const pillHug = isPill && pillTrack === 'hug'

  const containerClasses = {
    glass:
      'flex items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-lg shadow-xl p-3',
    modern:
      'flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg shadow-lg p-3',
    booksModern:
      'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.08))] bg-[var(--books-bg-card,#1e2128)] p-2 shadow-[var(--books-shell-shadow,0_4px_28px_rgba(0,0,0,0.55))] md:flex-nowrap',
    default: 'flex items-center justify-between gap-3 bg-white border-b border-gray-200 pb-3',
  }

  /** Light pill track — same as CRM/PM detail pages (white bar, orange active tab). */
  const lightPillTrackShell =
    'flex min-h-[48px] items-center gap-1 overflow-x-auto rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-[0_2px_12px_rgba(15,23,42,0.09),0_1px_3px_rgba(15,23,42,0.05)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
  const lightPillTrackStretchClass = `${lightPillTrackShell} min-w-0 flex-1`
  const lightPillTrackHugClass = `${lightPillTrackShell} w-fit max-w-full shrink-0`

  const pillTabButtonClass = (tabId, { flexGrow = false } = {}) => {
    const active = activeTab === tabId
    if (useBooksPill) {
      return clsx(
        flexGrow
          ? 'flex min-w-[5rem] flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-sm transition-all duration-200'
          : 'flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-all duration-200',
        active
          ? 'bg-[var(--books-brand,#ea580c)] font-semibold text-white shadow-sm'
          : 'bg-transparent font-normal text-[var(--books-text-secondary,#9ca3af)] hover:bg-[var(--books-surface-muted,#2a2e38)] hover:text-[var(--books-text-primary,#f0f0f0)]'
      )
    }
    return clsx(
      flexGrow
        ? 'flex min-w-[5rem] flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2.5 text-sm transition-all duration-200'
        : 'flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-all duration-200',
      active
        ? 'bg-[#FF7A20] font-semibold text-white shadow-sm'
        : 'bg-transparent font-normal text-gray-800 hover:bg-gray-100/90'
    )
  }

  const pillBadgeClass = (tabId) =>
    clsx(
      'rounded-full px-2 py-0.5 text-xs font-bold transition-all duration-200',
      activeTab === tabId
        ? 'bg-white/25 text-white'
        : useBooksPill
          ? 'bg-[var(--books-surface-muted,#2a2e38)] text-[var(--books-text-secondary,#9ca3af)]'
          : 'bg-gray-200/90 text-gray-700'
    )

  const booksIconBtn =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-bg-elevated,#252830)] text-[var(--books-text-secondary,#9ca3af)] shadow-sm transition-colors hover:border-orange-400/50 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] hover:text-[var(--books-orange-text,#fb923c)]'

  const resolvedSearchClass =
    searchInputClassName ||
    'w-64 min-w-[16rem] rounded-full border border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] py-2.5 pl-10 pr-4 text-sm text-[var(--books-input-text,#f0f0f0)] shadow-sm transition-colors placeholder:text-[var(--books-input-placeholder,#6b7280)] focus:border-orange-400/70 focus:outline-none focus:ring-2 focus:ring-orange-500/25'

  const tabButtonClass = (tabId) => {
    const active = activeTab === tabId
    if (isPill) {
      return pillTabButtonClass(tabId, { flexGrow: !pillHug })
    }
    return clsx(
      'flex items-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300',
      active
        ? 'bg-orange-500 text-white shadow-lg'
        : 'border border-white/40 bg-white/80 text-gray-700 backdrop-blur-sm hover:bg-white/90 hover:shadow-md'
    )
  }

  const badgeClass = (tabId) => {
    const active = activeTab === tabId
    if (isPill) {
      return pillBadgeClass(tabId)
    }
    return clsx(
      'ml-2 rounded-full px-2 py-0.5 text-xs font-bold transition-all duration-300',
      active ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-700'
    )
  }

  const tabButtons = tabs.map((tab) => {
    const tabId = tab.id || tab.key
    return (
      <button
        key={tabId}
        type="button"
        onClick={() => handleTabClick(tabId)}
        className={tabButtonClass(tabId)}
      >
        <span>{tab.label}</span>
        {tab.badge !== undefined && tab.badge !== null && tab.badge !== '' && (
          <span className={badgeClass(tabId)}>{tab.badge}</span>
        )}
      </button>
    )
  })

  const pillTrackClass = (() => {
    if (useBooksPill) return pillHug ? booksPillTrackHugClassName : booksPillTrackClassName
    return pillHug ? lightPillTrackHugClass : lightPillTrackStretchClass
  })()

  const tabScrollArea = (
    <div
      className={clsx(
        isBooksModern || isPill
          ? pillTrackClass
          : 'flex min-w-0 flex-1 items-center gap-2 overflow-x-auto'
      )}
    >
      {isBooksModern
        ? tabs.map((tab) => {
            const tabId = tab.id || tab.key
            return (
              <button
                key={tabId}
                type="button"
                onClick={() => handleTabClick(tabId)}
                className={pillTabButtonClass(tabId)}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== null && tab.badge !== '' ? (
                  <span className={pillBadgeClass(tabId)}>{tab.badge}</span>
                ) : null}
              </button>
            )
          })
        : tabButtons}
    </div>
  )

  const tabRow = hasAfterTabs ? (
    <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
      {tabScrollArea}
      <div className="flex shrink-0 items-center border-l border-gray-200/60 pl-2.5 md:pl-3.5">
        {afterTabs}
      </div>
    </div>
  ) : (
    tabScrollArea
  )

  const rightPanel = (
    <div className="flex flex-shrink-0 items-center gap-2">
      {showSearch && (
        <div className="hidden lg:flex items-center">
          <div className="relative">
            <Search
              className={clsx(
                'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform',
                isBooksModern ? 'text-[var(--books-text-tertiary,#6b7280)]' : 'text-gray-500'
              )}
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={isBooksModern ? resolvedSearchClass : 'w-64 rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-md transition-colors duration-200 placeholder:text-gray-400 focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20'}
            />
          </div>
        </div>
      )}

      {showAdd && onAddClick && (
        <button
          onClick={onAddClick}
          className={isBooksModern ? clsx(booksIconBtn, 'text-[var(--books-orange-text,#fb923c)]') : 'flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-orange-600 shadow-md transition-colors duration-200 hover:border-gray-400 hover:bg-orange-50'}
          title={addTitle}
        >
          <Plus className="h-5 w-5" />
        </button>
      )}

      {showViewToggle && (
        <>
          {viewOptions.includes('list') && (
            <button
              onClick={() => onViewChange?.('list')}
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors duration-200',
                activeView === 'list'
                  ? 'border-orange-300 bg-orange-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              )}
              title={listViewTitle}
            >
              <List className="h-5 w-5" />
            </button>
          )}
          {viewOptions.includes('board') && (
            <button
              onClick={() => onViewChange?.('board')}
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors duration-200',
                activeView === 'board'
                  ? 'border-orange-300 bg-orange-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              )}
              title={boardViewTitle}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          )}
          {viewOptions.includes('calendar') && (
            <button
              onClick={() => onViewChange?.('calendar')}
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors duration-200',
                activeView === 'calendar'
                  ? 'border-orange-300 bg-orange-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              )}
              title={calendarViewTitle}
            >
              <CalendarDays className="h-5 w-5" />
            </button>
          )}
        </>
      )}

      {showFilter && onFilterClick && (
        <button
          onClick={onFilterClick}
          className={isBooksModern ? booksIconBtn : 'flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-md transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50'}
          title={filterTitle}
        >
          <Filter className="h-5 w-5" />
        </button>
      )}

      {showBulkEdit && onBulkEditClick && (
        <button
          type="button"
          onClick={onBulkEditClick}
          className={clsx(
            'flex items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold shadow-md transition-colors duration-200',
            bulkEditActive
              ? 'border-orange-300 bg-orange-500 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
          )}
          title={bulkEditTitle}
        >
          <ListChecks className="h-4 w-4 flex-shrink-0" />
          <span className="hidden lg:inline">{bulkEditTitle}</span>
        </button>
      )}

      {showColumnVisibility && onColumnVisibilityClick && (
        <button
          onClick={onColumnVisibilityClick}
          className={isBooksModern ? booksIconBtn : 'flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-md transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 '}
          title={columnVisibilityTitle}
        >
          <Eye className="h-5 w-5" />
        </button>
      )}

      {showSort && onSortClick && (
        <button
          type="button"
          onClick={onSortClick}
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-colors duration-200',
            hasActiveSort
              ? 'border-orange-300 bg-orange-500 text-white hover:bg-orange-600'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
          )}
          title={sortTitle}
          aria-pressed={hasActiveSort}
        >
          <ArrowUpDown className="h-5 w-5" />
        </button>
      )}
    </div>
  )

  if (isPill) {
    return (
      <div
        className={clsx(
          'flex items-center gap-3',
          pillHug ? 'w-fit max-w-full' : 'w-full',
          !pillHug && hasRightPanel && 'justify-between',
          className
        )}
        {...props}
      >
        {tabRow}
        {hasRightPanel ? rightPanel : null}
      </div>
    )
  }

  return (
    <div
      className={clsx(containerClasses[variant] || containerClasses.glass, className)}
      {...props}
    >
      {tabRow}
      {rightPanel}
    </div>
  )
}

export default TabsWithActions
