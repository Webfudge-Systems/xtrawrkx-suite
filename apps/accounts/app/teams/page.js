'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react'
import {
  Button,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  Select,
  Table,
  TableCellText,
  TableEmptyBelow,
  Textarea,
} from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { departmentsService, teamsService, usersService } from '../../lib/api'

function userLabel(user) {
  if (!user) return 'â€”'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email || user.username || `User ${user.id}`
}

function normalizeRow(row) {
  const leader = row.leader && typeof row.leader === 'object' ? row.leader : null
  const department = row.department && typeof row.department === 'object' ? row.department : null
  const members = Array.isArray(row.members) ? row.members : []
  return {
    id: row.id,
    name: row.name || '',
    description: row.description || '',
    isActive: row.isActive !== false,
    leaderId: leader?.id ?? '',
    leaderLabel: userLabel(leader),
    departmentId: department?.id ?? '',
    departmentName: department?.name || '',
    memberIds: members.map((m) => m.id).filter(Boolean),
    memberCount: members.length,
  }
}

export default function TeamsPage() {
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    leaderId: '',
    departmentId: '',
    memberIds: [],
    isActive: true,
  })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [teamData, deptData, userResponse] = await Promise.all([
        teamsService.list(),
        departmentsService.list(),
        usersService.list(),
      ])
      setRows((teamData || []).map(normalizeRow))
      setDepartments(deptData || [])
      const userList = Array.isArray(userResponse) ? userResponse : Array.isArray(userResponse?.data) ? userResponse.data : []
      setUsers(userList.map((m) => m.user || m))
    } catch (err) {
      setError(err?.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.departmentName.toLowerCase().includes(q))
  }, [rows, searchQuery])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', leaderId: '', departmentId: '', memberIds: [], isActive: true })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name,
      description: row.description,
      leaderId: row.leaderId ? String(row.leaderId) : '',
      departmentId: row.departmentId ? String(row.departmentId) : '',
      memberIds: row.memberIds.map(String),
      isActive: row.isActive,
    })
    setModalOpen(true)
  }

  const toggleMember = (userId) => {
    const id = String(userId)
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter((x) => x !== id) : [...f.memberIds, id],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
        leader: form.leaderId ? Number(form.leaderId) : null,
        department: form.departmentId ? Number(form.departmentId) : null,
        members: form.memberIds.map((id) => Number(id)),
      }
      if (editing) {
        await teamsService.update(editing.id, payload)
      } else {
        await teamsService.create(payload)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to save team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete team "${row.name}"?`)) return
    try {
      await teamsService.delete(row.id)
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to delete team')
    }
  }

  const columns = [
    { key: 'name', label: 'Team', sortable: true },
    { key: 'departmentName', label: 'Department', sortable: true },
    { key: 'leaderLabel', label: 'Leader', sortable: true },
    { key: 'memberCount', label: 'Members', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: '', sortable: false },
  ]

  return (
    <div className="min-h-full bg-gray-50">
      <AccountsPageHeader
        title="Teams"
        subtitle="Create teams, assign leaders, and map members to departments."
        breadcrumb={[{ label: 'Teams', href: '/teams' }]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search teams..."
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add team
          </Button>
        }
      />

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No teams yet"
            description="Create teams to group users for projects, permissions, and reporting."
            action={<Button onClick={openCreate}>Add team</Button>}
          />
        ) : (
          <Table
            columns={columns}
            data={filtered}
            renderCell={(row, column) => {
              if (column.key === 'name') return <TableCellText primary={row.name} secondary={row.description} />
              if (column.key === 'departmentName') return <TableCellText primary={row.departmentName || 'â€”'} />
              if (column.key === 'leaderLabel') return <TableCellText primary={row.leaderLabel} />
              if (column.key === 'memberCount') return <TableCellText primary={String(row.memberCount)} />
              if (column.key === 'status') {
                return (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                )
              }
              if (column.key === 'actions') {
                return (
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => openEdit(row)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(row)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
              return null
            }}
          />
        )}
        {!loading && filtered.length > 0 && <TableEmptyBelow count={filtered.length} noun="team" />}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit team' : 'Add team'} maxWidth="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          <Select
            label="Department"
            value={form.departmentId}
            onChange={(value) => setForm((f) => ({ ...f, departmentId: value }))}
            options={[
              { value: '', label: 'No department' },
              ...departments.map((d) => ({ value: String(d.id), label: d.name })),
            ]}
          />
          <Select
            label="Team leader"
            value={form.leaderId}
            onChange={(value) => setForm((f) => ({ ...f, leaderId: value }))}
            options={[
              { value: '', label: 'No leader' },
              ...users.map((u) => ({ value: String(u.id), label: userLabel(u) })),
            ]}
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Members</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(String(u.id))}
                    onChange={() => toggleMember(u.id)}
                  />
                  {userLabel(u)}
                </label>
              ))}
            </div>
          </div>
          <Select
            label="Status"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(value) => setForm((f) => ({ ...f, isActive: value === 'active' }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Savingâ€¦' : editing ? 'Save changes' : 'Create team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
