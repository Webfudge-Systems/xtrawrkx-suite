'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserCircle,
} from 'lucide-react'
import {
  Avatar,
  Button,
  Input,
  KPICard,
  LoadingSpinner,
  Modal,
  Select,
  Table,
  TableCellTitleSubtitle,
  TableRowActionMenuPortal,
  TabsWithActions,
  Textarea,
  ownerDisplayFromUser,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { departmentsService, usersService } from '../../lib/api'

function userLabel(user) {
  if (!user) return '—'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email || user.username || `User ${user.id}`
}

function getStatusClasses(isActive) {
  if (isActive) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
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

function normalizeRow(row) {
  const lead = row.lead && typeof row.lead === 'object' ? row.lead : null
  const parent = row.parent && typeof row.parent === 'object' ? row.parent : null
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    isActive: row.isActive !== false,
    lead,
    leadId: lead?.id ?? '',
    leadLabel: userLabel(lead),
    parentId: parent?.id ?? '',
    parentName: parent?.name || '',
  }
}

const EMPTY_FORM = { name: '', description: '', leadId: '', parentId: '', isActive: true }

const COLUMN_VISIBILITY_STORAGE_KEY = 'accounts.departments.tableColumnVisibility'
const COLUMN_ORDER_STORAGE_KEY = 'accounts.departments.tableColumnOrder'
const COLUMN_WIDTHS_STORAGE_KEY = 'accounts.departments.tableColumnWidths'

const DEFAULT_COLUMN_WIDTHS = {
  name: 280,
  lead: 180,
  parent: 160,
  status: 120,
  actions: 200,
}

const MIN_COLUMN_WIDTHS = {
  name: 200,
  actions: 160,
}

const TOGGLEABLE_COLUMNS = [
  { key: 'lead', label: 'Lead' },
  { key: 'parent', label: 'Parent' },
  { key: 'status', label: 'Status' },
]

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key)

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = true
  return acc
}, {})

export default function DepartmentsPage() {
  const [rows, setRows] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [rowActionMenu, setRowActionMenu] = useState(null)

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

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [deptData, userResponse] = await Promise.all([departmentsService.list(), usersService.list()])
      setRows((deptData || []).map(normalizeRow))
      const userList = Array.isArray(userResponse)
        ? userResponse
        : Array.isArray(userResponse?.data)
          ? userResponse.data
          : []
      setUsers(userList.map((m) => m.user || m).filter(Boolean))
    } catch (err) {
      if (isUnauthorizedError(err) && typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('current-org-id')
        localStorage.removeItem('auth-user')
        window.location.href = '/login'
        return
      }
      setError(err?.message || 'Failed to load departments')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setActiveTab('all')
  }, [searchQuery])

  const stats = useMemo(() => {
    let active = 0
    let inactive = 0
    let withLead = 0
    let topLevel = 0
    rows.forEach((row) => {
      if (row.isActive) active += 1
      else inactive += 1
      if (row.leadId) withLead += 1
      if (!row.parentId) topLevel += 1
    })
    return { total: rows.length, active, inactive, withLead, topLevel }
  }, [rows])

  const tabItems = useMemo(
    () => [
      { key: 'all', label: 'All Departments', count: stats.total },
      { key: 'active', label: 'Active', count: stats.active },
      { key: 'inactive', label: 'Inactive', count: stats.inactive },
    ],
    [stats]
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && row.isActive) ||
        (activeTab === 'inactive' && !row.isActive)
      if (!matchesTab) return false
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.leadLabel.toLowerCase().includes(q) ||
        row.parentName.toLowerCase().includes(q)
      )
    })
  }, [rows, searchQuery, activeTab])

  const openCreate = useCallback(() => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((row) => {
    setEditing(row)
    setForm({
      name: row.name,
      description: row.description,
      leadId: row.leadId ? String(row.leadId) : '',
      parentId: row.parentId ? String(row.parentId) : '',
      isActive: row.isActive,
    })
    setFormError('')
    setModalOpen(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setFormError('Department name is required.')
      return
    }
    if (name.length < 2) {
      setFormError('Department name must be at least 2 characters.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        name,
        description: form.description.trim() || null,
        isActive: form.isActive,
        lead: form.leadId ? Number(form.leadId) : null,
        parent: form.parentId ? Number(form.parentId) : null,
      }
      if (editing) {
        await departmentsService.update(editing.id, payload)
      } else {
        await departmentsService.create(payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(err?.message || 'Failed to save department')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDepartmentStatus = useCallback(
    async (row) => {
      try {
        setError('')
        await departmentsService.update(row.id, {
          name: row.name,
          description: row.description || null,
          isActive: !row.isActive,
          lead: row.leadId ? Number(row.leadId) : null,
          parent: row.parentId ? Number(row.parentId) : null,
        })
        await load()
      } catch (err) {
        setError(err?.message || 'Failed to update department status')
      }
    },
    [load]
  )

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleteSubmitting(true)
    try {
      await departmentsService.delete(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      setFormError(err?.message || 'Failed to delete department')
      setDeleteTarget(null)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'DEPARTMENT',
        render: (_, row) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Building2 className="h-4 w-4" />
            </div>
            <TableCellTitleSubtitle
              title={row.name}
              subtitle={row.description || 'No description'}
              className="min-w-0"
            />
          </div>
        ),
      },
      {
        key: 'lead',
        label: 'LEAD',
        render: (_, row) => {
          if (!row.lead) {
            return <span className="text-sm text-gray-400">Unassigned</span>
          }
          const display = ownerDisplayFromUser(row.lead)
          return (
            <div className="flex items-center gap-2.5 min-w-[160px]">
              <Avatar fallback={display.avatarFallback} alt={display.label} size="sm" />
              <span className="text-sm font-medium text-gray-800 truncate">{display.label}</span>
            </div>
          )
        },
      },
      {
        key: 'parent',
        label: 'PARENT',
        render: (_, row) => (
          <span className="text-sm text-gray-700">{row.parentName || '—'}</span>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClasses(row.isActive)}`}
          >
            {row.isActive ? 'active' : 'inactive'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        headerClassName: 'text-right w-[1%] whitespace-nowrap',
        className: 'text-right w-[1%] whitespace-nowrap align-middle',
        render: (_, row) => (
          <div
            className="inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-teal-600 hover:bg-teal-50"
              title="More actions"
              onClick={(e) => {
                e.stopPropagation()
                const r = e.currentTarget.getBoundingClientRect()
                setRowActionMenu((prev) =>
                  prev?.id === row.id
                    ? null
                    : { id: row.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget, row }
                )
              }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit department"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(row)
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-2 ${row.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
              title={row.isActive ? 'Mark inactive' : 'Mark active'}
              onClick={(e) => {
                e.stopPropagation()
                toggleDepartmentStatus(row)
              }}
            >
              {row.isActive ? <ShieldBan className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete department"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(row)
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, toggleDepartmentStatus]
  )

  const visibleColumns = useMemo(() => {
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c]))
    const out = []
    if (byKey.name) out.push(byKey.name)
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key])
    }
    if (byKey.actions) out.push(byKey.actions)
    return out
  }, [columns, columnVisibility, columnOrder])

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-full">
      <AccountsPageHeader
        title="Departments"
        subtitle="Manage department hierarchy, leads, and user mapping."
        breadcrumb={[{ label: 'Departments', href: '/departments' }]}
        showSearch
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Departments" value={stats.total} icon={Building2} colorScheme="orange" />
        <KPICard title="Active" value={stats.active} icon={CheckCircle2} colorScheme="orange" />
        <KPICard title="With Lead" value={stats.withLead} icon={UserCircle} colorScheme="orange" />
        <KPICard title="Top Level" value={stats.topLevel} icon={Layers} colorScheme="orange" />
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabItems.map((item) => ({
            key: item.key,
            label: item.label,
            badge: String(item.count),
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search departments..."
          showAdd
          onAddClick={openCreate}
          addTitle="Add Department"
          showColumnVisibility
          onColumnVisibilityClick={() => setColumnPickerOpen((open) => !open)}
          columnVisibilityTitle="Show, hide, or reorder columns"
        />
        <TableColumnPicker
          open={columnPickerOpen}
          description="Department and actions stay visible. Drag column edges in the table to resize."
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

      <p className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filtered.length}</span> result
        {filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" message="Loading departments..." />
          </div>
        ) : (
          <>
            <Table columns={visibleColumns} data={filtered} keyField="id" variant="modern" {...tableResizeProps} />
            {filtered.length === 0 && (
              <div className="border-t border-gray-200 p-12 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No departments found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all'
                    ? 'Try adjusting your search or tab filter.'
                    : 'Create departments to organize users across your workspace.'}
                </p>
                <Button variant="primary" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
        size="md"
        closeOnBackdrop={!submitting}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Department name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Marketing"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional summary of this department"
              rows={3}
            />
          </div>
          <Select
            label="Department lead"
            value={form.leadId}
            onChange={(value) => setForm((f) => ({ ...f, leadId: value }))}
            options={[
              { value: '', label: 'No lead assigned' },
              ...users.map((u) => ({
                value: String(u.id),
                label: userLabel(u),
              })),
            ]}
          />
          <Select
            label="Parent department"
            value={form.parentId}
            onChange={(value) => setForm((f) => ({ ...f, parentId: value }))}
            options={[
              { value: '', label: 'None (top level)' },
              ...rows
                .filter((r) => !editing || r.id !== editing.id)
                .map((r) => ({ value: String(r.id), label: r.name })),
            ]}
          />
          <Select
            label="Status"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(value) => setForm((f) => ({ ...f, isActive: value === 'active' }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="muted" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {rowActionMenu ? (
        <TableRowActionMenuPortal
          open
          anchor={{
            top: rowActionMenu.top,
            left: rowActionMenu.left,
            triggerEl: rowActionMenu.triggerEl,
          }}
          onClose={() => setRowActionMenu(null)}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
            onClick={() => {
              openEdit(rowActionMenu.row)
              setRowActionMenu(null)
            }}
          >
            <Pencil className="w-4 h-4 text-teal-600" />
            Edit department
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
            onClick={() => {
              toggleDepartmentStatus(rowActionMenu.row)
              setRowActionMenu(null)
            }}
          >
            {rowActionMenu.row?.isActive ? (
              <ShieldBan className="w-4 h-4 text-teal-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            )}
            {rowActionMenu.row?.isActive ? 'Mark inactive' : 'Mark active'}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
            onClick={() => {
              setDeleteTarget(rowActionMenu.row)
              setRowActionMenu(null)
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete department
          </button>
        </TableRowActionMenuPortal>
      ) : null}

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteSubmitting && setDeleteTarget(null)}
        title="Delete department"
        size="sm"
        closeOnBackdrop={!deleteSubmitting}
      >
        <p className="text-sm text-gray-600">
          Delete <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>? Users assigned to this
          department may need to be reassigned.
        </p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="muted" onClick={() => setDeleteTarget(null)} disabled={deleteSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteSubmitting}>
            {deleteSubmitting ? 'Deleting...' : 'Delete Department'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
