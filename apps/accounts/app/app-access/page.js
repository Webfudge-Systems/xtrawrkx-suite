'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, LayoutGrid, ShieldCheck } from 'lucide-react'
import {
  Badge,
  KPICard,
  LoadingSpinner,
  Table,
  TableCellText,
  TableEmptyBelow,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui'
import RoleTableCell from '../../components/RoleTableCell'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { organizationService } from '../../lib/api'
import { CRM_MODULES, PM_MODULES } from '../../lib/constants/rbacMatrix'

const ACCESS_RANK = { none: 0, read: 1, write: 2, manage: 3 }

const COLUMN_VISIBILITY_STORAGE_KEY = 'accounts.appAccess.tableColumnVisibility'
const COLUMN_ORDER_STORAGE_KEY = 'accounts.appAccess.tableColumnOrder'
const COLUMN_WIDTHS_STORAGE_KEY = 'accounts.appAccess.tableColumnWidths'

const DEFAULT_COLUMN_WIDTHS = {
  name: 240,
  crm: 140,
  pm: 140,
  type: 120,
}

const MIN_COLUMN_WIDTHS = {
  name: 200,
}

const TOGGLEABLE_COLUMNS = [
  { key: 'crm', label: 'CRM access' },
  { key: 'pm', label: 'PM access' },
  { key: 'type', label: 'Type' },
]

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key)

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = true
  return acc
}, {})

function summarizeAppAccess(app) {
  let best = 0
  Object.values(app?.modules || {}).forEach((mod) => {
    const key = mod?.access || 'none'
    best = Math.max(best, ACCESS_RANK[key] ?? 0)
  })
  const labels = ['None', 'Read-only', 'Write', 'Manage']
  return labels[best] || 'None'
}

function isUnauthorizedError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('http 401') ||
    message.includes('unauthorized') ||
    message.includes('missing or invalid credentials') ||
    message.includes('token expired')
  )
}

export default function AppAccessPage() {
  const [loading, setLoading] = useState(true)
  const [appsMeta, setAppsMeta] = useState(null)
  const [roleRows, setRoleRows] = useState([])
  const [error, setError] = useState('')

  const {
    columnVisibility,
    columnOrder,
    columnPickerOpen,
    setColumnPickerOpen,
    columnDropIndicator,
    toolbarRef,
    setColumnVisible,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnRowDragOver,
    handleColumnListDragLeave,
    handleColumnDrop,
    resetColumnTablePreferences,
    tableResizeProps,
  } = useTableColumnPreferences({
    visibilityStorageKey: COLUMN_VISIBILITY_STORAGE_KEY,
    orderStorageKey: COLUMN_ORDER_STORAGE_KEY,
    widthsStorageKey: COLUMN_WIDTHS_STORAGE_KEY,
    defaultVisibility: DEFAULT_COLUMN_VISIBILITY,
    reorderableKeys: REORDERABLE_COLUMN_KEYS,
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidths: MIN_COLUMN_WIDTHS,
  })

  useEffect(() => {
    if (!columnPickerOpen) return
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [columnPickerOpen, setColumnPickerOpen, toolbarRef])

  const fetchAppAccess = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const json = await organizationService.getAppAccess()
      const bundle = json?.data ?? json
      setAppsMeta(bundle?.apps || null)
      setRoleRows(Array.isArray(bundle?.roleAccess) ? bundle.roleAccess : [])
    } catch (err) {
      if (isUnauthorizedError(err) && typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('current-org-id')
        localStorage.removeItem('auth-user')
        window.location.href = '/login'
        return
      }
      console.error('Failed to load app access', err)
      setError(err?.message || 'Could not load app access.')
      setAppsMeta(null)
      setRoleRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppAccess()
  }, [fetchAppAccess])

  const crmModuleCount = Object.keys(CRM_MODULES).length
  const pmModuleCount = Object.keys(PM_MODULES).length

  const crmEnabled = appsMeta?.crm?.enabled !== false
  const pmEnabled = appsMeta?.pm?.enabled !== false

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: 'Role',
        render: (_, row) => (
          <RoleTableCell name={row.name} code={row.code} isSystem={row.isSystem} />
        ),
      },
      {
        key: 'crm',
        title: 'CRM access',
        render: (_, row) => (
          <TableCellText emphasized nowrap value={summarizeAppAccess(row.permissions?.crm)} />
        ),
      },
      {
        key: 'pm',
        title: 'PM access',
        render: (_, row) => (
          <TableCellText emphasized nowrap value={summarizeAppAccess(row.permissions?.pm)} />
        ),
      },
      {
        key: 'type',
        title: 'Type',
        render: (_, row) =>
          row.isSystem ? (
            <Badge variant="gray" size="sm" className="rounded-full font-medium normal-case tracking-normal">
              System
            </Badge>
          ) : (
            <Badge
              size="sm"
              className="rounded-full border-teal-200 bg-teal-50 font-medium normal-case tracking-normal text-teal-800"
            >
              Custom
            </Badge>
          ),
      },
    ],
    []
  )

  const visibleColumns = useMemo(() => {
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c]))
    const out = []
    if (byKey.name) out.push(byKey.name)
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key])
    }
    return out
  }, [columns, columnVisibility, columnOrder])

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-full">
      <AccountsPageHeader
        title="App Access"
        subtitle="Review CRM and PM enablement, launcher visibility, and role access."
        breadcrumb={[{ label: 'App Access', href: '/app-access' }]}
        showSearch
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title={appsMeta?.crm?.label || 'CRM'}
          value={crmEnabled ? 'Enabled' : 'Disabled'}
          subtitle={`${crmModuleCount} RBAC modules mapped`}
          icon={LayoutGrid}
          colorScheme="orange"
        />
        <KPICard
          title={appsMeta?.pm?.label || 'Project Management'}
          value={pmEnabled ? 'Enabled' : 'Disabled'}
          subtitle={`${pmModuleCount} RBAC modules mapped`}
          icon={ShieldCheck}
          colorScheme="orange"
        />
      </div>

      <div className="space-y-3">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" ref={toolbarRef}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Role launcher visibility</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-3xl">
              A role appears in an app when any module has read, write, or manage access. Edit exact module access from{' '}
              <Link href="/roles" className="font-medium text-orange-600 hover:text-orange-700 underline-offset-2 hover:underline">
                Roles &amp; Permissions
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={() => setColumnPickerOpen((open) => !open)}
            className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full border border-gray-300 bg-white text-gray-700 shadow-md transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50 sm:self-start"
            title="Show, hide, or reorder columns"
          >
            <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <TableColumnPicker
            open={columnPickerOpen}
            description="Role stays visible. Drag column edges in the table to resize."
            reorderableRows={TOGGLEABLE_COLUMNS}
            columnVisibility={columnVisibility}
            columnOrder={columnOrder}
            columnDropIndicator={columnDropIndicator}
            onSetVisible={setColumnVisible}
            onDragStart={handleColumnDragStart}
            onDragEnd={handleColumnDragEnd}
            onRowDragOver={handleColumnRowDragOver}
            onListDragLeave={handleColumnListDragLeave}
            onDrop={handleColumnDrop}
            onReset={resetColumnTablePreferences}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <LoadingSpinner size="lg" message="Loading app access..." />
            </div>
          ) : (
            <>
              <Table columns={visibleColumns} data={roleRows} keyField="id" variant="modernEmbedded" {...tableResizeProps} />
              {roleRows.length === 0 && (
                <TableEmptyBelow
                  title="No roles found"
                  description="Roles for this organization will appear here once they are configured."
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
