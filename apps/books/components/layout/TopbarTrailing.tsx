'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Download, Filter, Plus, Upload } from 'lucide-react'
import { clsx } from 'clsx'
import type { HeaderAction } from '@/lib/routes'
import { getAddHref, getRouteMeta } from '@/lib/routes'
import { useBooksShellActions } from '@/context/BooksShellActionsContext'
import {
  BooksTopbarCenterUtilities,
  BooksTopbarIconButton,
  BooksTopbarProfile,
} from '@/components/layout/BooksTopbarShared'

const ACTION_LABELS: Record<HeaderAction, string> = {
  filter: 'Filter',
  export: 'Export',
  import: 'Import',
  add: 'Add',
}

export type TopbarTrailingProps = {
  className?: string
}

/** List-page trailing chrome: route actions + notifications (center pill) and profile (right pill). */
export default function TopbarTrailing({ className }: TopbarTrailingProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { actions } = useBooksShellActions()
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const meta = getRouteMeta(pathname)
  const addHref = getAddHref(pathname)
  const hasActions = meta.actions.length > 0

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
      actions.onExport?.()
      return
    }
    if (action === 'filter') {
      actions.onFilter?.()
    }
  }

  const actionIcons: Record<HeaderAction, React.ReactNode> = {
    filter: <Filter className="h-4 w-4" aria-hidden />,
    export: <Upload className="h-4 w-4" aria-hidden />,
    import: <Download className="h-4 w-4" aria-hidden />,
    add: <Plus className="h-4 w-4" aria-hidden />,
  }

  const listActionButtons = hasActions ? (
    <>
      {meta.actions.map((action) =>
        action === 'add' && addHref ? (
          <Link
            key={action}
            href={addHref}
            title={ACTION_LABELS[action]}
            aria-label={ACTION_LABELS[action]}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--books-text-secondary,#4b5563)] transition-colors hover:bg-[var(--books-bg-elevated,#e5e7eb)]/80 hover:text-[var(--books-text-primary,#111827)]"
          >
            {actionIcons[action]}
          </Link>
        ) : (
          <BooksTopbarIconButton
            key={action}
            title={ACTION_LABELS[action]}
            active={action === 'filter' && Boolean(actions.hasActiveFilters)}
            onClick={() => onAction(action)}
          >
            {actionIcons[action]}
          </BooksTopbarIconButton>
        )
      )}
    </>
  ) : null

  return (
    <div className={clsx('flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3', className)}>
      <BooksTopbarCenterUtilities>{listActionButtons}</BooksTopbarCenterUtilities>
      <BooksTopbarProfile />

      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) actions.onImport?.(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
