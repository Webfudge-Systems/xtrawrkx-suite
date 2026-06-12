'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type BooksShellActions = {
  onFilter?: () => void
  onExport?: () => void
  onImport?: (file: File) => void
  hasActiveFilters?: boolean
}

type BooksShellActionsContextValue = {
  actions: BooksShellActions
  registerActions: (actions: BooksShellActions) => void
  clearActions: () => void
}

const BooksShellActionsContext = createContext<BooksShellActionsContextValue | null>(null)

const EMPTY_ACTIONS: BooksShellActions = {}

export function BooksShellActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<BooksShellActions>(EMPTY_ACTIONS)

  const registerActions = useCallback((next: BooksShellActions) => {
    setActions((prev) => {
      const same =
        prev.onFilter === next.onFilter &&
        prev.onExport === next.onExport &&
        prev.onImport === next.onImport &&
        prev.hasActiveFilters === next.hasActiveFilters
      return same ? prev : next
    })
  }, [])

  const clearActions = useCallback(() => {
    setActions((prev) => (Object.keys(prev).length === 0 ? prev : EMPTY_ACTIONS))
  }, [])

  const value = useMemo(
    () => ({ actions, registerActions, clearActions }),
    [actions, registerActions, clearActions]
  )

  return <BooksShellActionsContext.Provider value={value}>{children}</BooksShellActionsContext.Provider>
}

export function useBooksShellActions() {
  const ctx = useContext(BooksShellActionsContext)
  if (!ctx) {
    throw new Error('useBooksShellActions must be used within BooksShellActionsProvider')
  }
  return ctx
}

/** Register page-level handlers for the layout header action icons (filter, export, import). */
export function useRegisterBooksShellActions({
  onFilter,
  onExport,
  onImport,
  hasActiveFilters,
}: BooksShellActions) {
  const { registerActions, clearActions } = useBooksShellActions()
  const actionsRef = useRef<BooksShellActions>({ onFilter, onExport, onImport, hasActiveFilters })
  actionsRef.current = { onFilter, onExport, onImport, hasActiveFilters }

  useEffect(() => {
    registerActions({
      onFilter: () => actionsRef.current.onFilter?.(),
      onExport: () => actionsRef.current.onExport?.(),
      onImport: (file) => actionsRef.current.onImport?.(file),
      hasActiveFilters: actionsRef.current.hasActiveFilters,
    })
    return clearActions
  }, [hasActiveFilters, registerActions, clearActions])
}
