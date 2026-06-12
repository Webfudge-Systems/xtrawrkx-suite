declare module '@webfudge/ui' {
  export const Button: any
  export const Input: any
  export const workspaceSearchInputClassName: string
  export const WorkspaceSearchInput: React.ComponentType<Record<string, unknown>>
  export const Select: any
  export const Checkbox: any
  export const Textarea: any
  export const Accordion: any
  export const Card: any
  export const FormSectionCard: any
  export const Badge: any
  export const Avatar: any
  export const LoginBrandCorner: any
  export const LoginProductCredit: any
  export const LoginMobileBrandHeader: any
  export const SidebarProductBranding: any
  export const WorkspaceHeader: any
  export const WorkspaceBackButton: React.ComponentType<{
    onClick?: () => void
    label?: string
    className?: string
  }>
  export const workspaceBackButtonClassName: string
  export const Table: any
  export const TableSortDropdown: React.ComponentType<{
    open: boolean
    sortRules: { key: string; direction: 'asc' | 'desc' }[]
    columnOptions: { key: string; label: string }[]
    onAddRule?: (key: string, direction?: 'asc' | 'desc') => void
    onRemoveRule?: (key: string) => void
    onSetDirection?: (key: string, direction: 'asc' | 'desc') => void
    onMoveRule?: (from: number, to: number) => void
    onClear?: () => void
    maxRules?: number
    className?: string
    theme?: 'light' | 'books'
  }>
  export function useTableSort(options?: {
    storageKey?: string
    defaultRules?: { key: string; direction: 'asc' | 'desc' }[]
    maxRules?: number
  }): {
    sortRules: { key: string; direction: 'asc' | 'desc' }[]
    sortData: (
      data: unknown[],
      getValue: (row: unknown, key: string) => unknown
    ) => unknown[]
    bindSortableColumns: (columns: unknown[], sortableKeys: string[]) => unknown[]
    hasActiveSort: boolean
    addSortRule: (key: string, direction?: 'asc' | 'desc') => void
    removeSortRule: (key: string) => void
    setRuleDirection: (key: string, direction: 'asc' | 'desc') => void
    moveSortRule: (from: number, to: number) => void
    clearSort: () => void
    maxRules: number
  }
  export const Pagination: any
  export const EmptyState: any
  export const TableResultsCount: any
  export const TableEmptyBelow: any
  export const KPICard: any
  export const Tabs: any
  export const TabsWithActions: any
  export const TableRowActionMenuPortal: any
  export const Modal: any
  export const LoadingSpinner: any
  export const PageLoader: any
  export const SkeletonLoader: any
  export const CardSkeleton: any
  export const TableSkeleton: any
  export const TableCellCreated: any
  export const TableCellDateOnly: any
  export const TableCellText: any
  export const TableCellOrangePill: any
  export const TableCellTitleSubtitle: any
  export const TableCellCrmRowActions: any
  export const crmTableActionsColumn: any
  export function crmTableCellTheme(theme?: 'default' | 'books'): Record<string, string>
  export function formatTableDate(dateString?: string | null, opts?: Record<string, unknown>): string
  export function formatRelativeTime(dateString?: string | null, opts?: Record<string, unknown>): string
  export const DashboardChartCanvas: React.ComponentType<{
    className?: string
    children?: React.ReactNode
  }>
  export const DonutChartFrame: React.ComponentType<{
    total: string | number
    centerLabel?: string
    children?: React.ReactNode
  }>
  export const DONUT_TOOLTIP_WRAPPER_STYLE: Record<string, string | number>
  export const PRIMARY_ORANGE_SHADES: string[]
}
