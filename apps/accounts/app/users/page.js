'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, Eye, EyeOff, Mail, MoreHorizontal, Pencil, ShieldBan, ShieldCheck, Trash2, UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Input,
  KPICard,
  LoadingSpinner,
  Modal,
  Pagination,
  Table,
  TableCellCreated,
  TableCellRole,
  TableRowActionMenuPortal,
  TabsWithActions,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import DepartmentPillMultiSelect from '../../components/DepartmentPillMultiSelect'
import TransferUserSelect from '../../components/TransferUserSelect'
import { isOrganizationAdmin } from '../../lib/accountsAccess'
import { departmentsService, rolesService, usersService } from '../../lib/api'

function formatDepartmentLabels(user, departmentCatalog = []) {
  const nameById = new Map(
    (departmentCatalog || []).map((d) => [d.id, d.name || '']).filter(([, name]) => name)
  )

  const labels = []
  const seen = new Set()
  const addLabel = (id, name) => {
    const key = id != null ? String(id) : name
    if (!key || seen.has(key)) return
    seen.add(key)
    labels.push(name || nameById.get(id) || (id != null ? `Dept ${id}` : null))
  }

  const deptRows = Array.isArray(user?.departments) ? user.departments : []
  for (const d of deptRows) {
    if (d && typeof d === 'object') {
      addLabel(d.id, d.name)
    } else {
      const id = Number.parseInt(String(d), 10)
      if (Number.isFinite(id)) addLabel(id, nameById.get(id))
    }
  }

  const ids = Array.isArray(user?.departmentIds) ? user.departmentIds : []
  for (const id of ids) {
    addLabel(id, nameById.get(id))
  }

  const cleaned = labels.filter(Boolean)
  return cleaned.length ? cleaned.join(', ') : 'None'
}

const ITEMS_PER_PAGE = 15

const COLUMN_VISIBILITY_STORAGE_KEY = 'accounts.users.tableColumnVisibility'
const COLUMN_ORDER_STORAGE_KEY = 'accounts.users.tableColumnOrder'
const COLUMN_WIDTHS_STORAGE_KEY = 'accounts.users.tableColumnWidths'

const DEFAULT_COLUMN_WIDTHS = {
  user: 260,
  email: 240,
  role: 140,
  departments: 180,
  status: 120,
  createdAt: 140,
  updatedAt: 140,
  actions: 180,
}

const MIN_COLUMN_WIDTHS = {
  user: 220,
  email: 200,
  actions: 160,
}

const TOGGLEABLE_COLUMNS = [
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'departments', label: 'Departments' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Last updated' },
]

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key)

const DEFAULT_ON_COLUMN_KEYS = new Set(['email', 'role', 'departments', 'status', 'createdAt'])

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_COLUMN_KEYS.has(key)
  return acc
}, {})

function getUserDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  if (user?.username) return user.username
  if (user?.email) return user.email
  return 'Unknown User'
}

function getUserStatus(user) {
  if (user?.blocked) return 'suspended'
  if (user?.confirmed === false) return 'invited'
  return 'active'
}

function getUserStatusVariant(status) {
  if (status === 'active') return 'success'
  if (status === 'invited') return 'warning'
  return 'danger'
}

function roleOptionValue(role) {
  if (role?.id != null && role?.id !== '') return `id:${role.id}`
  return `code:${String(role?.code || 'member').toLowerCase()}`
}

function parseRoleOption(value) {
  const raw = String(value || '')
  if (raw.startsWith('id:')) return { roleId: raw.slice(3), roleCode: null }
  if (raw.startsWith('code:')) return { roleId: null, roleCode: raw.slice(5) || 'member' }
  return { roleId: null, roleCode: raw || 'member' }
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

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [roles, setRoles] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoleSelection, setInviteRoleSelection] = useState('code:member')
  const [directAdd, setDirectAdd] = useState(false)
  const [directPassword, setDirectPassword] = useState('')
  const [inviteSubmitting, setInviteSubmitting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRoleSelection, setEditRoleSelection] = useState('code:member')
  const [editStatus, setEditStatus] = useState('active')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')
  const [rowActionMenu, setRowActionMenu] = useState(null)
  const [suspendTargetUser, setSuspendTargetUser] = useState(null)
  const [suspendTransferToUserId, setSuspendTransferToUserId] = useState('')
  const [suspendError, setSuspendError] = useState('')
  const [suspendSubmitting, setSuspendSubmitting] = useState(false)
  const [deleteTargetUser, setDeleteTargetUser] = useState(null)
  const [deleteTransferToUserId, setDeleteTransferToUserId] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [allDepartments, setAllDepartments] = useState([])
  const [inviteDepartmentIds, setInviteDepartmentIds] = useState([])
  const [invitePrimaryDepartmentId, setInvitePrimaryDepartmentId] = useState(null)
  const [editDepartmentIds, setEditDepartmentIds] = useState([])
  const [editPrimaryDepartmentId, setEditPrimaryDepartmentId] = useState(null)
  const [editChangePassword, setEditChangePassword] = useState(false)
  const [editPassword, setEditPassword] = useState('')
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editTransferToUserId, setEditTransferToUserId] = useState('')
  const canEditPassword = useMemo(() => isOrganizationAdmin(), [])
  const canManageUsers = useMemo(() => isOrganizationAdmin(), [])
  const editRequiresTransfer = useMemo(() => {
    if (!editUser) return false
    return editStatus === 'suspended' && getUserStatus(editUser) !== 'suspended'
  }, [editStatus, editUser])

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

  const toggleInviteDepartment = useCallback((deptId) => {
    setInviteDepartmentIds((prev) => {
      const next = prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
      if (!next.includes(invitePrimaryDepartmentId)) {
        setInvitePrimaryDepartmentId(next[0] ?? null)
      }
      return next
    })
  }, [invitePrimaryDepartmentId])

  const toggleEditDepartment = useCallback((deptId) => {
    setEditDepartmentIds((prev) => {
      const next = prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
      if (!next.includes(editPrimaryDepartmentId)) {
        setEditPrimaryDepartmentId(next[0] ?? null)
      }
      return next
    })
  }, [editPrimaryDepartmentId])

  const handleInviteUser = useCallback(() => {
    setInviteEmail('')
    const defaultRole =
      roles.find((r) => String(r.code).toLowerCase() === 'member') || roles[0]
    setInviteRoleSelection(defaultRole ? roleOptionValue(defaultRole) : 'code:member')
    setDirectAdd(false)
    setDirectPassword('')
    setInviteDepartmentIds([])
    setInvitePrimaryDepartmentId(null)
    setInviteError('')
    setShowInviteModal(true)
  }, [roles])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await usersService.list({ page: 1, pageSize: 250, sort: 'updatedAt:desc' })
      const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []
      setUsers(list)
    } catch (error) {
      if (isUnauthorizedError(error) && typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('current-org-id')
        localStorage.removeItem('auth-user')
        window.location.href = '/login'
        return
      }
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await departmentsService.list()
        if (!cancelled) {
          setAllDepartments(
            (rows || [])
              .map((d) => ({ id: d.id, name: d.name || '', isActive: d.isActive !== false }))
              .filter((d) => d.isActive)
          )
        }
      } catch {
        if (!cancelled) setAllDepartments([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const list = await rolesService.listForOrg()
          if (!cancelled) {
            const finalRoles = list.length
              ? list
              : [
                { code: 'admin', name: 'Admin' },
                { code: 'manager', name: 'Manager' },
                { code: 'member', name: 'Member' },
              ]
            setRoles(finalRoles)
          }
        } catch (error) {
          if (isUnauthorizedError(error) && typeof window !== 'undefined') {
            localStorage.removeItem('auth-token')
            localStorage.removeItem('current-org-id')
            localStorage.removeItem('auth-user')
            window.location.href = '/login'
            return
          }
          if (!cancelled) {
            setRoles([
              { code: 'admin', name: 'Admin' },
              { code: 'manager', name: 'Manager' },
              { code: 'member', name: 'Member' },
            ])
          }
        }
      })()

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    let active = 0
    let invited = 0
    let suspended = 0

    users.forEach((user) => {
      const status = getUserStatus(user)
      if (status === 'active') active += 1
      else if (status === 'invited') invited += 1
      else suspended += 1
    })

    return {
      total: users.length,
      active,
      invited,
      suspended,
    }
  }, [users])

  const tabItems = useMemo(
    () => [
      { key: 'all', label: 'All Users', count: stats.total },
      { key: 'active', label: 'Active', count: stats.active },
      { key: 'invited', label: 'Invited', count: stats.invited },
      { key: 'suspended', label: 'Suspended', count: stats.suspended },
    ],
    [stats]
  )

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const status = getUserStatus(user)
      const matchesTab = activeTab === 'all' || status === activeTab
      const displayName = getUserDisplayName(user).toLowerCase()
      const email = String(user?.email || '').toLowerCase()
      const role = String(user?.role?.name || user?.role || '').toLowerCase()
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === '' || displayName.includes(q) || email.includes(q) || role.includes(q)
      return matchesTab && matchesSearch
    })
  }, [users, activeTab, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUsers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery])

  const submitInvite = useCallback(async () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      setInviteError('Email is required.')
      return
    }

    try {
      setInviteSubmitting(true)
      setInviteError('')
      const inviteRole = parseRoleOption(inviteRoleSelection)
      await usersService.invite({
        email,
        roleId: inviteRole.roleId,
        roleCode: inviteRole.roleCode || 'member',
        directAdd,
        directPassword: directPassword.trim() || undefined,
        sendWelcomeEmail: true,
        departmentIds: inviteDepartmentIds,
        primaryDepartmentId: invitePrimaryDepartmentId,
      })
      setShowInviteModal(false)
      await fetchUsers()
    } catch (error) {
      setInviteError(error?.message || 'Failed to send invitation')
    } finally {
      setInviteSubmitting(false)
    }
  }, [
    directAdd,
    directPassword,
    fetchUsers,
    inviteDepartmentIds,
    inviteEmail,
    invitePrimaryDepartmentId,
    inviteRoleSelection,
  ])

  const openEditModal = useCallback(
    (user) => {
      setEditUser(user)
      setEditName(user?.username || getUserDisplayName(user))
      setEditEmail(user?.email || '')
      if (user?.roleId) {
        setEditRoleSelection(`id:${user.roleId}`)
      } else {
        const code = String(user?.roleCode || user?.role || 'member').toLowerCase()
        const match = roles.find((r) => String(r.code).toLowerCase() === code)
        setEditRoleSelection(match ? roleOptionValue(match) : `code:${code}`)
      }
      setEditStatus(getUserStatus(user))
      const deptIds = Array.isArray(user?.departmentIds)
        ? user.departmentIds
        : Array.isArray(user?.departments)
          ? user.departments.map((d) => d.id)
          : []
      setEditDepartmentIds(deptIds)
      setEditPrimaryDepartmentId(user?.primaryDepartmentId || deptIds[0] || null)
      setEditChangePassword(false)
      setEditPassword('')
      setShowEditPassword(false)
      setEditTransferToUserId('')
      setEditError('')
    },
    [roles]
  )

  const submitEdit = useCallback(async () => {
    if (!editUser?.membershipId) {
      setEditError('Membership record is missing')
      return
    }

    const name = editName.trim()
    const email = editEmail.trim().toLowerCase()
    if (!name) {
      setEditError('Name is required.')
      return
    }
    if (name.length < 3) {
      setEditError('Name must be at least 3 characters.')
      return
    }
    if (!email) {
      setEditError('Email is required.')
      return
    }
    if (editChangePassword) {
      const nextPassword = editPassword.trim()
      if (!nextPassword) {
        setEditError('Password is required when changing password.')
        return
      }
      if (nextPassword.length < 8) {
        setEditError('Password must be at least 8 characters.')
        return
      }
    }
    if (editRequiresTransfer && !editTransferToUserId) {
      setEditError('Select a user to receive open assignments before suspending.')
      return
    }

    try {
      setEditSubmitting(true)
      setEditError('')
      const editedRole = parseRoleOption(editRoleSelection)
      await usersService.updateMembership({
        membershipId: editUser.membershipId,
        roleId: editedRole.roleId,
        roleCode: editedRole.roleCode || undefined,
        status: editStatus,
        email,
        username: name,
        password: editChangePassword ? editPassword.trim() : undefined,
        transferToUserId: editRequiresTransfer ? editTransferToUserId : undefined,
        departmentIds: editDepartmentIds,
        primaryDepartmentId: editPrimaryDepartmentId,
      })
      setEditUser(null)
      await fetchUsers()
    } catch (error) {
      setEditError(error?.message || 'Failed to update user')
    } finally {
      setEditSubmitting(false)
    }
  }, [
    editChangePassword,
    editDepartmentIds,
    editEmail,
    editName,
    editPassword,
    editPrimaryDepartmentId,
    editRequiresTransfer,
    editRoleSelection,
    editStatus,
    editTransferToUserId,
    editUser,
    fetchUsers,
  ])

  const toggleUserStatus = useCallback(
    async (user, nextStatus, transferToUserId) => {
      if (!user?.membershipId) return
      await usersService.updateMembership({
        membershipId: user.membershipId,
        roleId: user?.roleId ?? undefined,
        roleCode: String(user?.roleCode || user?.role || 'member').toLowerCase(),
        status: nextStatus,
        transferToUserId: nextStatus === 'suspended' ? transferToUserId : undefined,
      })
      await fetchUsers()
    },
    [fetchUsers]
  )

  const requestUserStatusChange = useCallback(
    (user, nextStatus) => {
      if (nextStatus === 'suspended') {
        setSuspendTargetUser(user)
        setSuspendTransferToUserId('')
        setSuspendError('')
        return
      }
      toggleUserStatus(user, nextStatus).catch((error) => {
        console.error('Failed to update user status:', error)
      })
    },
    [toggleUserStatus]
  )

  const confirmSuspendUser = useCallback(async () => {
    if (!suspendTargetUser) return
    if (!suspendTransferToUserId) {
      setSuspendError('Select a user to receive open assignments before suspending.')
      return
    }
    try {
      setSuspendSubmitting(true)
      setSuspendError('')
      await toggleUserStatus(suspendTargetUser, 'suspended', suspendTransferToUserId)
      setSuspendTargetUser(null)
      setSuspendTransferToUserId('')
    } catch (error) {
      setSuspendError(error?.message || 'Failed to suspend user')
    } finally {
      setSuspendSubmitting(false)
    }
  }, [suspendTargetUser, suspendTransferToUserId, toggleUserStatus])

  const openDeleteModal = useCallback((user) => {
    setDeleteTargetUser(user)
    setDeleteTransferToUserId('')
    setDeleteError('')
  }, [])

  const confirmDeleteUser = useCallback(async () => {
    if (!deleteTargetUser?.membershipId) return
    if (!deleteTransferToUserId) {
      setDeleteError('Select a user to receive open assignments before removing this user.')
      return
    }
    try {
      setDeleteSubmitting(true)
      setDeleteError('')
      await usersService.removeMembership({
        membershipId: deleteTargetUser.membershipId,
        transferToUserId: deleteTransferToUserId,
      })
      setDeleteTargetUser(null)
      setDeleteTransferToUserId('')
      await fetchUsers()
    } catch (error) {
      setDeleteError(error?.message || 'Failed to remove user')
    } finally {
      setDeleteSubmitting(false)
    }
  }, [deleteTargetUser, deleteTransferToUserId, fetchUsers])

  const columns = useMemo(
    () => [
      {
        key: 'user',
        label: 'USER',
        render: (_, user) => (
          <div className="flex items-center gap-3 min-w-[220px]">
            <Avatar fallback={getUserDisplayName(user)[0] || 'U'} alt={getUserDisplayName(user)} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{getUserDisplayName(user)}</p>
              <p className="text-xs text-gray-500 truncate">@{user?.username || 'n/a'}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        label: 'EMAIL',
        render: (_, user) => (
          <div className="flex items-center gap-2 min-w-[220px] text-sm text-gray-700">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{user?.email || '—'}</span>
          </div>
        ),
      },
      {
        key: 'role',
        label: 'ROLE',
        render: (_, user) => (
          <TableCellRole roleLabel={user?.role?.name || user?.role || 'Member'} />
        ),
      },
      {
        key: 'departments',
        label: 'DEPARTMENTS',
        render: (_, user) => (
          <span className="min-w-[140px] text-sm text-gray-700">{formatDepartmentLabels(user, allDepartments)}</span>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, user) => {
          const status = getUserStatus(user)
          return <Badge variant={getUserStatusVariant(status)} className="capitalize">{status}</Badge>
        },
      },
      {
        key: 'createdAt',
        label: 'CREATED',
        render: (_, user) => <TableCellCreated dateString={user?.createdAt} />,
      },
      {
        key: 'updatedAt',
        label: 'LAST UPDATED',
        render: (_, user) => <TableCellCreated dateString={user?.updatedAt} />,
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        render: (_, user) => {
          const status = getUserStatus(user)
          const isSuspended = status === 'suspended'
          return (
            <div className="flex items-center gap-1 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-teal-600 hover:bg-teal-50"
                title="More actions"
                onClick={(e) => {
                  e.stopPropagation()
                  const r = e.currentTarget.getBoundingClientRect()
                  setRowActionMenu((prev) =>
                    prev?.id === user.membershipId
                      ? null
                      : { id: user.membershipId, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget, user }
                  )
                }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-emerald-600 hover:bg-emerald-50"
                title="Edit user"
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal(user)
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                title="Send mail"
                disabled={!user?.email}
                onClick={(e) => {
                  e.stopPropagation()
                  if (user?.email) window.location.href = `mailto:${user.email}`
                }}
              >
                <Mail className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${isSuspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-600 hover:bg-red-50'}`}
                title={isSuspended ? 'Activate user' : 'Suspend user'}
                onClick={(e) => {
                  e.stopPropagation()
                  requestUserStatusChange(user, isSuspended ? 'active' : 'suspended')
                }}
              >
                {isSuspended ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
              </Button>
            </div>
          )
        },
      },
    ],
    [allDepartments, openEditModal, requestUserStatusChange]
  )

  const visibleColumns = useMemo(() => {
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c]))
    const out = []
    if (byKey.user) out.push(byKey.user)
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key])
    }
    if (byKey.actions) out.push(byKey.actions)
    return out
  }, [columns, columnVisibility, columnOrder])

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-full">
      <AccountsPageHeader
        title="Organization's Users"
        subtitle="Manage organization users, invitations, access, and lifecycle."
        breadcrumb={[{ label: 'Users', href: '/users' }]}
        showSearch
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Users" value={stats.total} subtitle="Organization members" icon={Users} colorScheme="orange" />
        <KPICard title="Active Users" value={stats.active} subtitle="Confirmed and active access" icon={UserCheck} colorScheme="orange" />
        <KPICard title="Invited Users" value={stats.invited} subtitle="Pending account confirmation" icon={Clock3} colorScheme="orange" />
        <KPICard title="Suspended Users" value={stats.suspended} subtitle="Blocked from accessing apps" icon={UserX} colorScheme="orange" />
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
          searchPlaceholder="Search users..."
          showAdd
          onAddClick={handleInviteUser}
          addTitle="Invite User"
          showColumnVisibility
          onColumnVisibilityClick={() => setColumnPickerOpen((open) => !open)}
          columnVisibilityTitle="Show, hide, or reorder columns"
        />
        <TableColumnPicker
          open={columnPickerOpen}
          description="User and actions stay visible. Drag column edges in the table to resize."
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

      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> result
        {filteredUsers.length !== 1 ? 's' : ''}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading users..." />
          </div>
        ) : (
          <>
            <Table columns={visibleColumns} data={paginatedUsers} keyField="id" variant="modern" {...tableResizeProps} />
            {paginatedUsers.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No users found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeTab !== 'all'
                    ? 'Try adjusting your search or tab filter.'
                    : 'No users are available for this organization yet.'}
                </p>
                <Button variant="primary" onClick={handleInviteUser}>
                  Invite User
                </Button>
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showInviteModal}
        onClose={() => !inviteSubmitting && setShowInviteModal(false)}
        title="Invite User"
        size="md"
        closeOnBackdrop={!inviteSubmitting}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={inviteRoleSelection}
              onChange={(e) => setInviteRoleSelection(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            >
              {roles.map((role) => (
                <option key={roleOptionValue(role)} value={roleOptionValue(role)}>
                  {role.name}
                  {role?.isSystem === false ? ' · Custom' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Departments</label>
            <DepartmentPillMultiSelect
              departments={allDepartments}
              selectedIds={inviteDepartmentIds}
              primaryId={invitePrimaryDepartmentId}
              onToggle={toggleInviteDepartment}
              onPrimaryChange={setInvitePrimaryDepartmentId}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={directAdd}
              onChange={(e) => setDirectAdd(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            Directly add user without invitation
          </label>
          {directAdd ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Temporary Password (optional)</label>
              <Input
                type="text"
                value={directPassword}
                onChange={(e) => setDirectPassword(e.target.value)}
                placeholder="Auto-generated if left empty"
              />
              <p className="text-xs text-gray-500">
                If the user doesn&apos;t exist, we will create it and email credentials.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Invitation mode sends an email with a secure accept-invite link.
            </p>
          )}
          {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="muted" onClick={() => setShowInviteModal(false)} disabled={inviteSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitInvite} disabled={inviteSubmitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {inviteSubmitting ? 'Submitting...' : directAdd ? 'Add User' : 'Send Invite'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(editUser)}
        onClose={() => !editSubmitting && setEditUser(null)}
        title="Edit User"
        size="md"
        closeOnBackdrop={!editSubmitting}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="user@company.com"
            />
          </div>
          {canEditPassword ? (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editChangePassword}
                  onChange={(e) => {
                    setEditChangePassword(e.target.checked)
                    if (!e.target.checked) {
                      setEditPassword('')
                      setShowEditPassword(false)
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                Change password
              </label>
              {editChangePassword ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <div className="relative">
                    <Input
                      type={showEditPassword ? 'text' : 'password'}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEditPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Minimum 8 characters. The user will sign in with this password.</p>
                </div>
              ) : null}
            </>
          ) : null}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={editRoleSelection}
              onChange={(e) => setEditRoleSelection(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            >
              {roles.map((role) => (
                <option key={roleOptionValue(role)} value={roleOptionValue(role)}>
                  {role.name}
                  {role?.isSystem === false ? ' · Custom' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Departments</label>
            <DepartmentPillMultiSelect
              departments={allDepartments}
              selectedIds={editDepartmentIds}
              primaryId={editPrimaryDepartmentId}
              onToggle={toggleEditDepartment}
              onPrimaryChange={setEditPrimaryDepartmentId}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={editStatus}
              onChange={(e) => {
                setEditStatus(e.target.value)
                if (e.target.value !== 'suspended') setEditTransferToUserId('')
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {editRequiresTransfer ? (
            <TransferUserSelect
              users={users}
              excludeUserId={editUser?.id}
              value={editTransferToUserId}
              onChange={(nextId) => {
                setEditTransferToUserId(nextId)
                setEditError('')
              }}
              disabled={editSubmitting}
            />
          ) : null}
          {editError ? <p className="text-sm text-red-600">{editError}</p> : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="muted" onClick={() => setEditUser(null)} disabled={editSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitEdit} disabled={editSubmitting}>
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
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
              openEditModal(rowActionMenu.user)
              setRowActionMenu(null)
            }}
          >
            <Pencil className="w-4 h-4 text-teal-600" />
            Edit user
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
            disabled={!rowActionMenu.user?.email}
            onClick={() => {
              if (rowActionMenu.user?.email) navigator.clipboard.writeText(rowActionMenu.user.email)
              setRowActionMenu(null)
            }}
          >
            <Mail className="w-4 h-4 text-teal-600" />
            Copy email
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
            onClick={() => {
              const status = getUserStatus(rowActionMenu.user)
              requestUserStatusChange(rowActionMenu.user, status === 'suspended' ? 'active' : 'suspended')
              setRowActionMenu(null)
            }}
          >
            {getUserStatus(rowActionMenu.user) === 'suspended' ? (
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            ) : (
              <ShieldBan className="w-4 h-4 text-teal-600" />
            )}
            {getUserStatus(rowActionMenu.user) === 'suspended' ? 'Activate user' : 'Suspend user'}
          </button>
          {canManageUsers ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50"
              onClick={() => {
                openDeleteModal(rowActionMenu.user)
                setRowActionMenu(null)
              }}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              Remove user
            </button>
          ) : null}
        </TableRowActionMenuPortal>
      ) : null}

      <Modal
        isOpen={Boolean(suspendTargetUser)}
        onClose={() => !suspendSubmitting && setSuspendTargetUser(null)}
        title="Suspend User"
        size="md"
        closeOnBackdrop={!suspendSubmitting}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to suspend{' '}
            <span className="font-semibold text-gray-900">{getUserDisplayName(suspendTargetUser || {})}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Suspended users cannot access the workspace until reactivated. Open assignments must be transferred first.
          </p>
          <TransferUserSelect
            users={users}
            excludeUserId={suspendTargetUser?.id}
            value={suspendTransferToUserId}
            onChange={(nextId) => {
              setSuspendTransferToUserId(nextId)
              setSuspendError('')
            }}
            disabled={suspendSubmitting}
          />
          {suspendError ? <p className="text-sm text-red-600">{suspendError}</p> : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="muted"
              onClick={() => setSuspendTargetUser(null)}
              disabled={suspendSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmSuspendUser}
              disabled={suspendSubmitting}
            >
              {suspendSubmitting ? 'Suspending...' : 'Suspend User'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => !deleteSubmitting && setDeleteTargetUser(null)}
        title="Remove User"
        size="md"
        closeOnBackdrop={!deleteSubmitting}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Remove{' '}
            <span className="font-semibold text-gray-900">{getUserDisplayName(deleteTargetUser || {})}</span>{' '}
            from this organization?
          </p>
          <p className="text-sm text-gray-500">
            This removes their workspace access. Their account may still exist elsewhere, but they will no longer appear in this organization.
          </p>
          <TransferUserSelect
            users={users}
            excludeUserId={deleteTargetUser?.id}
            value={deleteTransferToUserId}
            onChange={(nextId) => {
              setDeleteTransferToUserId(nextId)
              setDeleteError('')
            }}
            disabled={deleteSubmitting}
          />
          {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="muted"
              onClick={() => setDeleteTargetUser(null)}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteUser}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? 'Removing...' : 'Remove User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
