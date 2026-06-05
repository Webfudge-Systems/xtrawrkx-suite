'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import {
  Card,
  Button,
  Checkbox,
  Input,
  Textarea,
  Select,
  LoadingSpinner,
} from '@webfudge/ui'
import {
  ArrowLeft,
  Plus,
  FolderOpen,
  CalendarDays,
  DollarSign,
} from 'lucide-react'
import PMPageHeader from '../../../components/PMPageHeader'
import TaskAssigneesPicker from '../../../components/TaskAssigneesPicker'
import projectService from '../../../lib/api/projectService'
import { fetchProjectClientOptions, mapProjectClientSelectOptions } from '../../../lib/api/projectClientOptions'
import { fetchProjectDirectoryUsers } from '../../../lib/api/messageService'
import { transformUser } from '../../../lib/api/dataTransformers'
import { getPmOrgRoleKind, canToggleProjectPrivacy } from '../../../lib/pmOrgRoles'

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function AddProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientAccountFromQuery = searchParams.get('clientAccount')
  const { user: authUser } = useAuth()
  const currentUserId = useMemo(() => {
    const u = authUser?.attributes || authUser
    return u?.id ?? authUser?.id ?? null
  }, [authUser])

  const [loading, setLoading] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [clientOptions, setClientOptions] = useState([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'PLANNING',
    startDate: '',
    endDate: '',
    budget: '',
    clientId: '',
    projectManagerId: '',
    teamMemberIds: [],
    isPrivate: false,
  })

  /** Org directory + current user if missing from roster (edge cases). */
  const directoryUsers = useMemo(() => {
    const base = allUsers
    if (currentUserId == null) return base
    const sid = String(currentUserId)
    if (base.some((u) => String(u.id) === sid)) return base
    const raw = authUser?.attributes || authUser
    const merged = transformUser({ id: Number(currentUserId), ...raw })
    return merged ? [...base, merged] : base
  }, [allUsers, currentUserId, authUser])

  const loadData = useCallback(async () => {
    setClientsLoading(true)
    try {
      const [usersRes, clients] = await Promise.allSettled([
        fetchProjectDirectoryUsers(),
        fetchProjectClientOptions(),
      ])
      if (usersRes.status === 'fulfilled') {
        const raw = usersRes.value || []
        setAllUsers(raw.map(transformUser).filter(Boolean))
      }
      if (clients.status === 'fulfilled') {
        setClientOptions(mapProjectClientSelectOptions(clients.value))
      } else {
        setClientOptions([])
      }
    } catch {
      setClientOptions([])
    } finally {
      setClientsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!clientAccountFromQuery) return
    setForm((prev) => {
      if (prev.clientId) return prev
      return { ...prev, clientId: String(clientAccountFromQuery) }
    })
  }, [clientAccountFromQuery])

  useEffect(() => {
    if (getPmOrgRoleKind() === 'member') {
      router.replace('/projects')
    }
  }, [router])

  /** Default project manager = creator (matches backend when PM omitted). */
  useEffect(() => {
    if (currentUserId == null) return
    setForm((prev) => {
      if (prev.projectManagerId) return prev
      return { ...prev, projectManagerId: String(currentUserId) }
    })
  }, [currentUserId])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Project name is required'
    if (form.clientId === undefined || form.clientId === null) {
      errs.clientId = 'Client is required'
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = 'End date must be after start date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setLoading(true)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        budget: form.budget ? Number(form.budget) : null,
      }
      if (form.clientId) payload.clientAccount = Number(form.clientId)
      else payload.clientAccount = null

      if (form.projectManagerId) payload.projectManager = Number(form.projectManagerId)

      payload.teamMembers = form.teamMemberIds.map(Number)
      if (canToggleProjectPrivacy()) payload.isPrivate = form.isPrivate

      const result = await projectService.createProject(payload)
      const newId = result?.data?.id || result?.id
      if (newId) {
        router.push(`/projects/${newId}`)
      } else {
        router.push('/projects')
      }
    } catch (err) {
      console.error('Create project error:', err)
      setErrors({ submit: 'Failed to create project. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const userOptions = directoryUsers.map((u) => ({
    value: String(u.id),
    label: u.name || u.username || u.email || `User ${u.id}`,
  }))

  const assigneeUserIds = useMemo(
    () => form.teamMemberIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0),
    [form.teamMemberIds]
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <PMPageHeader
        title="Add New Project"
        subtitle="Create a new project and assign team members"
        showProfile
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: 'Add', href: '#' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Project Information */}
        <Card
          title={
            <span className="inline-flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-4 h-4 text-white" />
              </span>
              <span>Project Information</span>
            </span>
          }
          subtitle="Basic information about the project"
          variant="default"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                label="Project Name"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                error={errors.name}
                placeholder="Enter project name"
              />
              <Select
                label="Status"
                value={form.status}
                options={STATUS_OPTIONS}
                onChange={(val) => setForm((p) => ({ ...p, status: val }))}
              />
            </div>
            <Textarea
              label="Project Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              placeholder="Describe the project goals and requirements..."
            />
          </div>
        </Card>

        {/* Project Timeline */}
        <Card
          title={
            <span className="inline-flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-4 h-4 text-white" />
              </span>
              <span>Project Timeline</span>
            </span>
          }
          subtitle="Set the start and end dates for the project"
          variant="default"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              error={errors.endDate}
            />
          </div>
        </Card>

        {/* Budget & Assignment */}
        <Card
          title={
            <span className="inline-flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-white" />
              </span>
              <span>Budget & Assignment</span>
            </span>
          }
          subtitle="Budget, client, one project manager, and multiple assignees (organization members)"
          variant="default"
        >
          <div className="space-y-4">
            <Input
              label="Budget"
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
              placeholder="Enter project budget (optional)"
            />
            <Select
              label="Client"
              required
              value={form.clientId}
              options={[{ value: '', label: 'No client' }, ...clientOptions]}
              onChange={(val) => setForm((p) => ({ ...p, clientId: val ?? '' }))}
              placeholder={clientsLoading ? 'Loading clients…' : 'No client'}
              allowEmpty={false}
              disabled={clientsLoading}
              searchable
              searchPlaceholder="Search clients…"
              error={errors.clientId}
            />
            {!clientsLoading && clientOptions.length === 0 ? (
              <p className="text-xs text-gray-500">
                No client accounts found for your organization. Add accounts in CRM (Clients → Accounts), then link them here.
              </p>
            ) : null}
            <Select
              label="Project manager"
              value={form.projectManagerId}
              options={[{ value: '', label: 'Not assigned' }, ...userOptions]}
              onChange={(val) => setForm((p) => ({ ...p, projectManagerId: val }))}
              placeholder="Choose one project manager"
            />
            <p className="text-xs text-gray-500 -mt-2">
              Defaults to you as creator. Only one person can be project manager.
            </p>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-800">Project assignees</p>
              <p className="mb-2 text-xs text-gray-500">
                Select everyone working on this project (multiple). Same directory as above.
              </p>
              {directoryUsers.length > 0 ? (
                <TaskAssigneesPicker
                  userIds={assigneeUserIds}
                  users={directoryUsers}
                  assignees={[]}
                  onChange={(next) =>
                    setForm((p) => ({
                      ...p,
                      teamMemberIds: next.map(String),
                    }))
                  }
                  compact={false}
                  pickerMode="modal"
                  searchable
                  popoverTitle="Project assignees"
                />
              ) : (
                <p className="text-sm text-gray-500">Loading organization members…</p>
              )}
            </div>
            {canToggleProjectPrivacy() && (
              <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
                <Checkbox
                  checked={form.isPrivate}
                  onChange={(e) => setForm((p) => ({ ...p, isPrivate: e.target.checked }))}
                />
                <span className="text-sm font-medium text-gray-800">
                  Private project
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    — hidden from managers not on the team; admins can always see it
                  </span>
                </span>
              </label>
            )}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            rounded="default"
            className="!border-gray-300 !text-gray-700 hover:!bg-gray-50 px-5"
            onClick={() => router.push('/projects')}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            rounded="pill"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg px-6"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
