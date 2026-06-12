'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { KPICard, Card, Button, LoadingSpinner, formatRelativeTime } from '@webfudge/ui'
import {
  Users,
  ShieldCheck,
  Building2,
  UserRoundCheck,
  Clock3,
  KeyRound,
  ArrowRight,
} from 'lucide-react'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import {
  auditService,
  departmentsService,
  organizationService,
  rolesService,
  teamsService,
  usersService,
} from '../../lib/api'

function isUnauthorizedError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('http 401') ||
    message.includes('unauthorized') ||
    message.includes('missing or invalid credentials') ||
    message.includes('token expired')
  )
}

function normalizeStrapiList(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  return []
}

function getUserStatus(user) {
  if (user?.blocked) return 'suspended'
  if (user?.confirmed === false) return 'invited'
  return 'active'
}

function subscriptionAppLabel(sub) {
  const app = sub?.app
  if (!app) return null
  const raw = app?.attributes ?? app?.data?.attributes ?? app
  return raw?.name || raw?.slug || app?.name || app?.slug || null
}

function summarizeSubscriptions(subscriptions = []) {
  const labels = subscriptions.map(subscriptionAppLabel).filter(Boolean)
  const deduped = [...new Set(labels.map((s) => String(s).trim()))]
  return deduped
}

function verbFromAction(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'create') return 'Created'
  if (a === 'delete') return 'Deleted'
  if (a === 'comment') return 'Comment on'
  if (a === 'update') return 'Updated'
  if (!a) return 'Activity'
  return a.charAt(0).toUpperCase() + a.slice(1)
}

function entityLabel(row) {
  const st = String(row?.subjectType || row?.entityType || '').replace(/_/g, ' ')
  return st ? st.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Record'
}

function formatActivityLine(raw) {
  const row = raw?.attributes ? { id: raw.id, ...raw.attributes } : raw || {}
  const verb = verbFromAction(row.action || row.event)
  const entity = entityLabel(row)
  const name =
    row.targetName ||
    row.entityName ||
    row.subject ||
    row.summary ||
    row.title ||
    (row.subjectId != null ? `#${row.subjectId}` : '')
  const tail = name ? ` · ${String(name).slice(0, 80)}${String(name).length > 80 ? '…' : ''}` : ''
  return `${verb} ${entity}${tail}`
}

export default function AccountsHome() {
  const [organizationName, setOrganizationName] = useState('Accounts')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeUsers: 0,
    rolesCount: 0,
    departmentsCount: 0,
    teamsCount: 0,
    pendingInvites: 0,
  })
  const [subscriptionsSummary, setSubscriptionsSummary] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activityFetchFailed, setActivityFetchFailed] = useState(false)

  useEffect(() => {
    let isMounted = true

    try {
      const currentOrgId = localStorage.getItem('current-org-id')
      const rawOrganizations = localStorage.getItem('auth-organizations')
      const organizations = rawOrganizations ? JSON.parse(rawOrganizations) : []
      const selectedOrg = organizations.find((org) => String(org?.id) === String(currentOrgId))
      const cachedOrgName = selectedOrg?.name || organizations?.[0]?.name

      if (isMounted && typeof cachedOrgName === 'string' && cachedOrgName.trim()) {
        setOrganizationName(cachedOrgName.trim())
      }
    } catch (_) {}

    organizationService
      .getCurrent()
      .then((response) => {
        const orgRoot = response?.data ?? response
        const orgFlat = orgRoot?.attributes ? { ...orgRoot.attributes, id: orgRoot.id } : orgRoot
        const name =
          orgFlat?.name ||
          response?.data?.attributes?.name ||
          response?.data?.name ||
          response?.name ||
          response?.organization?.name

        if (isMounted && typeof name === 'string' && name.trim()) {
          setOrganizationName(name.trim())
        }

        const subs = orgFlat?.subscriptions || []
        if (isMounted) {
          setSubscriptionsSummary(summarizeSubscriptions(Array.isArray(subs) ? subs : []))
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setActivityFetchFailed(false)

      const [usersRes, rolesList, deptRes, teamsRes, orgRes] = await Promise.all([
        usersService.list({ sort: 'updatedAt:desc' }),
        rolesService.listForOrg(),
        departmentsService.list().catch(() => null),
        teamsService.list().catch(() => null),
        organizationService.getCurrent().catch(() => null),
      ])

      const users = normalizeStrapiList(usersRes)
      let invited = 0
      let active = 0
      users.forEach((u) => {
        const st = getUserStatus(u)
        if (st === 'invited') invited += 1
        if (st === 'active') active += 1
      })

      const departments = normalizeStrapiList(deptRes)
      const teams = normalizeStrapiList(teamsRes)

      setStats({
        activeUsers: active,
        rolesCount: Array.isArray(rolesList) ? rolesList.length : 0,
        departmentsCount: departments.length,
        teamsCount: teams.length,
        pendingInvites: invited,
      })

      if (orgRes) {
        const orgRoot = orgRes?.data ?? orgRes
        const orgFlat = orgRoot?.attributes ? { ...orgRoot.attributes, id: orgRoot.id } : orgRoot
        const nm =
          orgFlat?.name ||
          orgRes?.data?.attributes?.name ||
          orgRes?.data?.name ||
          orgRes?.name
        if (typeof nm === 'string' && nm.trim()) {
          setOrganizationName(nm.trim())
        }
        const subs = orgFlat?.subscriptions
        if (Array.isArray(subs)) {
          setSubscriptionsSummary(summarizeSubscriptions(subs))
        }
      }

      try {
        const auditResult = await auditService.list({ page: 1, pageSize: 6 })
        const rows = Array.isArray(auditResult?.rows) ? auditResult.rows : []
        setRecentActivity(rows.slice(0, 6))
        setActivityFetchFailed(false)
      } catch {
        setRecentActivity([])
        setActivityFetchFailed(true)
      }
    } catch (error) {
      if (isUnauthorizedError(error) && typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('current-org-id')
        localStorage.removeItem('auth-user')
        window.location.href = '/login'
        return
      }
      console.error('Dashboard load failed', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const cards = useMemo(
    () => [
      {
        title: 'Active Users',
        value: stats.activeUsers,
        subtitle: 'Confirmed members in this organization',
        icon: Users,
      },
      {
        title: 'Roles',
        value: stats.rolesCount,
        subtitle: 'System + custom roles',
        icon: ShieldCheck,
      },
      {
        title: 'Departments',
        value: stats.departmentsCount,
        subtitle: 'Org structure units',
        icon: Building2,
      },
      {
        title: 'Teams',
        value: stats.teamsCount,
        subtitle: 'Delivery and function teams',
        icon: UserRoundCheck,
      },
    ],
    [stats]
  )

  const appAccessDescription = useMemo(() => {
    if (subscriptionsSummary.length === 0) {
      return 'No app subscriptions loaded yet. Subscribed apps appear here when connected.'
    }
    const joined = subscriptionsSummary.join(', ')
    return `${joined} ${subscriptionsSummary.length === 1 ? 'is' : 'are'} assigned to this organization.`
  }, [subscriptionsSummary])

  const quickActions = useMemo(
    () => [
      { label: 'Add User', href: '/users', hint: 'Invite or add members' },
      { label: 'Manage Roles', href: '/roles', hint: 'CRM & PM permissions' },
      { label: 'Review Audit Logs', href: '/audit-logs', hint: 'Workspace timeline' },
      { label: 'Manage Departments', href: '/departments', hint: 'Organize users' },
    ],
    []
  )

  return (
    <div className="p-4 space-y-4 bg-white min-h-full">
      <AccountsPageHeader
        title={`${organizationName} Dashboard`}
        subtitle="Organization identity, access, and security overview."
        breadcrumb={[{ label: 'Dashboard', href: '/' }]}
        showSearch
      />

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80 py-16">
          <LoadingSpinner size="lg" message="Loading dashboard…" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => (
              <KPICard key={card.title} {...card} colorScheme="orange" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card
              glass
              className="lg:col-span-2"
              title="Security Health"
              subtitle="Current workspace security posture and action queue"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase">MFA adoption</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">—</p>
                  <p className="text-xs text-gray-500 mt-2">Not reported by the API yet. Track MFA in your IdP.</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase">Pending invites</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingInvites}</p>
                  <p className="text-xs text-gray-500 mt-2">Users awaiting email confirmation</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <p className="text-xs text-gray-500 uppercase">Open incidents</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">0</p>
                  <p className="text-xs text-gray-500 mt-2">No incidents recorded for this workspace</p>
                </div>
              </div>
            </Card>
            <Card glass title="Quick Actions" subtitle="Frequently used admin actions">
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.href}
                    as={Link}
                    href={action.href}
                    variant="secondary"
                    className="w-full justify-between"
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span>{action.label}</span>
                      <span className="text-[11px] font-normal text-gray-500">{action.hint}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card
              glass
              title="Recent workspace activity"
              subtitle="Latest CRM & PM timeline entries (organization feed)"
              actions={<Clock3 className="w-5 h-5 text-gray-500" />}
            >
              {activityFetchFailed ? (
                <p className="text-sm text-gray-600">Could not load activity. Try again from Audit Logs.</p>
              ) : recentActivity.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">No timeline entries yet.</p>
                  <Button as={Link} href="/audit-logs" variant="ghost" size="sm" className="px-0 text-orange-600">
                    Open audit logs →
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white/80">
                  {recentActivity.map((row, idx) => {
                    const flat = row?.attributes ? { id: row.id, ...row.attributes } : row
                    const at = flat?.createdAt || flat?.updatedAt || flat?.timestamp
                    return (
                      <li key={flat?.id ?? idx} className="flex gap-3 px-3 py-2.5 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-800 leading-snug">{formatActivityLine(row)}</p>
                        </div>
                        <time className="shrink-0 text-xs text-gray-500 tabular-nums" dateTime={at || undefined}>
                          {at ? formatRelativeTime(at) : '—'}
                        </time>
                      </li>
                    )
                  })}
                </ul>
              )}
              {!activityFetchFailed && recentActivity.length > 0 ? (
                <div className="mt-3 flex justify-end">
                  <Button as={Link} href="/audit-logs" variant="ghost" size="sm" className="text-orange-600">
                    View all activity
                  </Button>
                </div>
              ) : null}
            </Card>
            <Card
              glass
              title="App Access Summary"
              subtitle="Apps linked to this organization"
              actions={<KeyRound className="w-5 h-5 text-gray-500" />}
            >
              <p className="text-sm text-gray-700 leading-relaxed">{appAccessDescription}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button as={Link} href="/app-access" variant="outline" size="sm">
                  View app access
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
