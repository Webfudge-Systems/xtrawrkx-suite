'use client'

import { useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resolveUserDisplayName, resolveUserInitials, useAuth } from '@webfudge/auth'
import { Avatar } from '@webfudge/ui'
import { Bell, ChevronDown, Download, Filter, Plus, Upload } from 'lucide-react'
import { clsx } from 'clsx'
import type { HeaderAction } from '@/lib/routes'
import { getAddHref, getRouteMeta } from '@/lib/routes'

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--books-text-secondary,#4b5563)] transition-colors hover:bg-[var(--books-bg-elevated,#e5e7eb)]/80 hover:text-[var(--books-text-primary,#111827)]"
      aria-label={title}
    >
      {children}
    </button>
  )
}

const pillClusterClass =
  'books-shell-surface-pill flex min-h-[48px] shrink-0 items-center border-0 px-1.5 py-1 sm:px-2'

export type TopbarTrailingProps = {
  className?: string
}

/**
 * Separate pill containers: route action icons + bell (utilities), then avatar/profile — matches Books header ref.
 */
export default function TopbarTrailing({ className }: TopbarTrailingProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const meta = getRouteMeta(pathname)

  const onAction = (action: HeaderAction) => {
    if (action === 'add') {
      const href = getAddHref(pathname)
      if (href) router.push(href)
      return
    }
    if (action === 'import') {
      importInputRef.current?.click()
      return
    }
    if (action === 'export') {
      return
    }
  }

  const actionIcons: Record<HeaderAction, React.ReactNode> = {
    filter: <Filter className="h-4 w-4" aria-hidden />,
    export: <Upload className="h-4 w-4" aria-hidden />,
    import: <Download className="h-4 w-4" aria-hidden />,
    add: <Plus className="h-4 w-4" aria-hidden />,
  }

  const displayName = resolveUserDisplayName(user)
  const hasActions = meta.actions.length > 0

  return (
    <div className={clsx('flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3', className)}>
      {/* Utilities: route actions (when present) + notifications — own pill */}
      <div
        className={clsx(
          pillClusterClass,
          'gap-0.5',
          !hasActions && 'justify-center px-2 sm:px-2.5'
        )}
      >
        {hasActions
          ? meta.actions.map((action) => (
              <IconButton key={action} title={action} onClick={() => onAction(action)}>
                {actionIcons[action]}
              </IconButton>
            ))
          : null}
        {hasActions ? (
          <div
            className="mx-0.5 hidden h-7 w-px shrink-0 bg-[color:var(--books-border,rgba(0,0,0,0.08))] sm:block"
            aria-hidden
          />
        ) : null}
        <IconButton title="Notifications">
          <Bell className="h-4 w-4" aria-hidden />
        </IconButton>
      </div>

      {/* Profile — own pill */}
      <div className={clsx(pillClusterClass, 'pl-2 pr-2 sm:pl-2.5 sm:pr-3')}>
        <button
          type="button"
          className="inline-flex max-w-[min(100vw-12rem,16rem)] min-w-0 items-center gap-2 rounded-full py-0.5 text-left transition-colors hover:bg-[var(--books-bg-elevated)]/90 sm:max-w-none"
        >
          <Avatar
            shape="rounded"
            size="sm"
            fallback={resolveUserInitials(user)}
            alt={displayName}
            className="h-8 w-8 shrink-0 rounded-full border-0 bg-[var(--books-brand,#ea580c)] font-semibold text-white"
          />
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-medium text-[var(--books-text-primary,#111827)]">
              {displayName}
            </span>
            <span className="block truncate text-xs text-[var(--books-text-secondary,#6b7280)]">
              Books Workspace
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--books-text-secondary,#6b7280)]" aria-hidden />
        </button>
      </div>

      <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={() => {}} />
    </div>
  )
}
