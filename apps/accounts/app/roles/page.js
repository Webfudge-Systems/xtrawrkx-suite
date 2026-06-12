'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import {
  Button,
  Input,
  KPICard,
  LoadingSpinner,
  Modal,
  Table,
  TabsWithActions,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import RoleTableCell from '../../components/RoleTableCell'
import { rolesService } from '../../lib/api'
import { ACCESS_OPTIONS, CRM_MODULES, PM_MODULES, emptyPermissionsDraft } from '../../lib/constants/rbacMatrix'

const ACCESS_RANK = { none: 0, read: 1, write: 2, manage: 3 }

const COLUMN_VISIBILITY_STORAGE_KEY = 'accounts.roles.tableColumnVisibility'
const COLUMN_ORDER_STORAGE_KEY = 'accounts.roles.tableColumnOrder'
const COLUMN_WIDTHS_STORAGE_KEY = 'accounts.roles.tableColumnWidths'

const DEFAULT_COLUMN_WIDTHS = {
  name: 240,
  type: 140,
  crm: 120,
  pm: 120,
  tier: 130,
  actions: 140,
}

const MIN_COLUMN_WIDTHS = {
  name: 200,
  actions: 120,
}

const TOGGLEABLE_COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'crm', label: 'CRM' },
  { key: 'pm', label: 'PM' },
  { key: 'tier', label: 'Access tier' },
]

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key)

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = true
  return acc
}, {})

function isUnauthorizedError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('http 401') ||
    message.includes('unauthorized') ||
    message.includes('missing or invalid credentials') ||
    message.includes('token expired')
  )
}

function summarizeAppAccess(app) {
  let best = 0
  Object.values(app?.modules || {}).forEach((mod) => {
    const key = mod?.access || 'none'
    best = Math.max(best, ACCESS_RANK[key] ?? 0)
  })
  const labels = ['None', 'Read-only', 'Write', 'Manage']
  return labels[best] || 'None'
}

function clonePermissions(perms) {
  try {
    return JSON.parse(JSON.stringify(perms || {}))
  } catch (_) {
    return emptyPermissionsDraft()
  }
}

function buildPreset(access, overrides = {}) {
  const draft = emptyPermissionsDraft()
  Object.keys(CRM_MODULES).forEach((key) => {
    draft.crm.modules[key] = { access: overrides.crm?.[key] || access }
  })
  Object.keys(PM_MODULES).forEach((key) => {
    draft.pm.modules[key] = { access: overrides.pm?.[key] || access }
  })
  return draft
}

const PERMISSION_PRESETS = [
  { label: 'Admin-like', description: 'Manage all CRM and PM modules.', matrix: buildPreset('manage') },
  {
    label: 'Manager-like',
    description: 'Manage operations, read settings.',
    matrix: buildPreset('manage', { crm: { settings: 'read' }, pm: { settings: 'read' } }),
  },
  {
    label: 'Member-like',
    description: 'Contribute to assigned CRM records and own work without settings access.',
    matrix: buildPreset('read', {
      crm: { leads: 'write', companies: 'write', contacts: 'write', meetings: 'write', calendar: 'write', client_invoices: 'none', proposals: 'none', settings: 'none' },
      pm: { projects: 'write', tasks: 'write', my_tasks: 'write', calendar: 'write', settings: 'none' },
    }),
  },
]

function ModuleMatrix({ draft, label, appKey, modules, onChange, readOnly }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        {Object.entries(modules).map(([key, title]) => {
          const current = draft?.modules?.[key]?.access || 'read'
          return (
            <div key={key} className="flex items-center gap-3 px-3 py-2 bg-white">
              <span className="flex-1 text-sm text-gray-800 truncate" title={title}>
                {title}
              </span>
              <select
                disabled={readOnly}
                value={current}
                onChange={(e) => onChange(key, appKey, e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs shrink-0 focus:border-orange-500 focus:outline-none disabled:bg-gray-100"
              >
                {ACCESS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RolesPage() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const [detailModal, setDetailModal] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formMatrix, setFormMatrix] = useState(() => emptyPermissionsDraft())
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleteRole, setDeleteRole] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      const list = await rolesService.listForOrg()
      setRoles(Array.isArray(list) ? list : [])
    } catch (error) {
      if (isUnauthorizedError(error) && typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('current-org-id')
        localStorage.removeItem('auth-user')
        window.location.href = '/login'
        return
      }
      console.error('Failed to load roles', error)
      setRoles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const stats = useMemo(() => {
    let systemCount = 0
    let customCount = 0
    roles.forEach((r) => {
      if (r?.isSystem) systemCount += 1
      else customCount += 1
    })
    return {
      total: roles.length,
      systemCount,
      customCount,
    }
  }, [roles])

  const tabItems = useMemo(
    () => [
      { key: 'all', label: 'All roles', count: stats.total },
      { key: 'system', label: 'System templates', count: stats.systemCount },
      { key: 'custom', label: 'Custom', count: stats.customCount },
    ],
    [stats]
  )

  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return roles.filter((role) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'system' && role.isSystem) ||
        (activeTab === 'custom' && !role.isSystem)
      if (!matchesTab) return false
      if (!q) return true
      const name = String(role?.name || '').toLowerCase()
      const desc = String(role?.description || '').toLowerCase()
      const code = String(role?.code || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || code.includes(q)
    })
  }, [roles, activeTab, searchQuery])

  const openViewSystem = (role) => {
    setDetailModal({ mode: 'view-system', role })
    setFormName(role.name || '')
    setFormDescription(role.description || '')
    setFormMatrix(clonePermissions(role.permissions))
    setFormError('')
  }

  const openCreate = () => {
    setDetailModal({ mode: 'create' })
    setFormName('')
    setFormDescription('')
    setFormMatrix(emptyPermissionsDraft())
    setFormError('')
  }

  const openEditCustom = (role) => {
    setDetailModal({ mode: 'edit', role })
    setFormName(role.name || '')
    setFormDescription(role.description || '')
    setFormMatrix(clonePermissions(role.permissions))
    setFormError('')
  }

  const handleMatrixChange = (moduleKey, appKey, value) => {
    setFormMatrix((prev) => {
      const next = clonePermissions(prev)
      if (!next[appKey]) next[appKey] = { modules: {} }
      if (!next[appKey].modules) next[appKey].modules = {}
      next[appKey].modules[moduleKey] = { access: value }
      return next
    })
  }

  const submitForm = async () => {
    if (!detailModal) return
    const name = formName.trim()
    if (!name) {
      setFormError('Role name is required.')
      return
    }

    try {
      setFormSaving(true)
      setFormError('')
      if (detailModal.mode === 'create') {
        await rolesService.create({
          name,
          description: formDescription.trim(),
          permissions: formMatrix,
        })
      } else if (detailModal.mode === 'edit' && detailModal.role?.id) {
        await rolesService.update(detailModal.role.id, {
          name,
          description: formDescription.trim(),
          permissions: formMatrix,
        })
      }
      setDetailModal(null)
      await fetchRoles()
    } catch (e) {
      setFormError(e?.message || 'Could not save role')
    } finally {
      setFormSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteRole?.id) return
    try {
      setDeleteSubmitting(true)
      await rolesService.delete(deleteRole.id)
      setDeleteRole(null)
      await fetchRoles()
    } catch (e) {
      alert(e?.message || 'Unable to delete this role.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'ROLE',
        render: (_, role) => (
          <RoleTableCell name={role.name} code={role.code} isSystem={role.isSystem} className="min-w-[200px]" />
        ),
      },
      {
        key: 'type',
        label: 'TYPE',
        render: (_, role) =>
          role.isSystem ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              System template
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
              Org custom
            </span>
          ),
      },
      {
        key: 'crm',
        label: 'CRM',
        render: (_, role) => (
          <span className="text-sm text-gray-700">{summarizeAppAccess(role.permissions?.crm)}</span>
        ),
      },
      {
        key: 'pm',
        label: 'PM',
        render: (_, role) => (
          <span className="text-sm text-gray-700">{summarizeAppAccess(role.permissions?.pm)}</span>
        ),
      },
      {
        key: 'tier',
        label: 'ACCESS TIER',
        render: (_, role) => (
          <span className="inline-flex capitalize text-xs font-medium text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
            {role.accessLevel || 'basic'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, role) => (
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            {role.isSystem ? (
              <Button
                variant="ghost"
                size="sm"
                title="View permissions"
                className="p-2 text-teal-600 hover:bg-teal-50"
                onClick={(e) => {
                  e.stopPropagation()
                  openViewSystem(role)
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Edit custom role"
                  className="p-2 text-emerald-600 hover:bg-emerald-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditCustom(role)
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete role"
                  className="p-2 text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteRole(role)
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
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
    if (byKey.actions) out.push(byKey.actions)
    return out
  }, [columns, columnVisibility, columnOrder])

  const readOnlyModal = Boolean(detailModal?.mode === 'view-system')

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-full">
      <AccountsPageHeader
        title="Roles & Permissions"
        subtitle="Define role hierarchy and CRM / PM module access for this organization."
        breadcrumb={[{ label: 'Roles', href: '/roles' }]}
        showSearch
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Roles"
          value={stats.total}
          subtitle="System + custom assignments"
          icon={Shield}
          colorScheme="orange"
        />
        <KPICard
          title="System Templates"
          value={stats.systemCount}
          subtitle="Immutable Admin / Manager / Member"
          icon={Shield}
          colorScheme="orange"
        />
        <KPICard
          title="Custom Roles"
          value={stats.customCount}
          subtitle="Designed for your organization"
          icon={Shield}
          colorScheme="orange"
        />
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
          searchPlaceholder="Search roles..."
          showAdd
          onAddClick={openCreate}
          addTitle="Add Custom Role"
          showColumnVisibility
          onColumnVisibilityClick={() => setColumnPickerOpen((open) => !open)}
          columnVisibilityTitle="Show, hide, or reorder columns"
        />
        <TableColumnPicker
          open={columnPickerOpen}
          description="Role and actions stay visible. Drag column edges in the table to resize."
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

      <p className="text-xs text-gray-500">
        System roles ship with recommended CRM and PM access. Custom roles are stored only for the active organization
        and can be assigned when inviting or editing users (admins only for create / edit / delete).
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading roles..." />
          </div>
        ) : (
          <>
            <Table columns={visibleColumns} data={filteredRoles} keyField="id" variant="modern" {...tableResizeProps} />
            {filteredRoles.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No roles match your filters</h3>
                <p className="text-sm text-gray-500 mb-4">Try another tab or search term, or add a custom role.</p>
                <Button variant="primary" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Role
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(detailModal)}
        onClose={() => !formSaving && setDetailModal(null)}
        title={
          detailModal?.mode === 'create'
            ? 'Add Custom Role'
            : detailModal?.mode === 'edit'
              ? 'Edit Custom Role'
              : 'System role — permissions'
        }
        size="lg"
        closeOnBackdrop={!formSaving}
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role name</label>
            <Input
              disabled={readOnlyModal}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Revenue Operations"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              disabled={readOnlyModal}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none disabled:bg-gray-100"
              placeholder="What is this role responsible for?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModuleMatrix
              draft={formMatrix.crm}
              label="CRM"
              appKey="crm"
              modules={CRM_MODULES}
              onChange={handleMatrixChange}
              readOnly={readOnlyModal}
            />
            <ModuleMatrix
              draft={formMatrix.pm}
              label="Project management"
              appKey="pm"
              modules={PM_MODULES}
              onChange={handleMatrixChange}
              readOnly={readOnlyModal}
            />
          </div>

          {!readOnlyModal ? (
            <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">Quick presets</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {PERMISSION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setFormMatrix(clonePermissions(preset.matrix))}
                    className="text-left rounded-lg border border-orange-100 bg-white px-3 py-2 hover:border-orange-300"
                  >
                    <span className="block text-sm font-semibold text-gray-900">{preset.label}</span>
                    <span className="block text-xs text-gray-500">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              System templates are immutable. Create a custom role when you need a different CRM or PM permission mix.
            </div>
          )}

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200/80">
            <Button variant="muted" disabled={formSaving} onClick={() => setDetailModal(null)}>
              {readOnlyModal ? 'Close' : 'Cancel'}
            </Button>
            {!readOnlyModal ? (
              <Button variant="primary" onClick={submitForm} disabled={formSaving}>
                {formSaving ? 'Saving...' : detailModal?.mode === 'edit' ? 'Save role' : 'Create role'}
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteRole)}
        onClose={() => !deleteSubmitting && setDeleteRole(null)}
        title="Delete custom role?"
        size="md"
        closeOnBackdrop={!deleteSubmitting}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Remove <span className="font-semibold text-gray-900">{deleteRole?.name}</span>? You must reassign any users
            on this role first.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="muted" disabled={deleteSubmitting} onClick={() => setDeleteRole(null)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={deleteSubmitting} onClick={confirmDelete}>
              {deleteSubmitting ? 'Deleting...' : 'Delete Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
