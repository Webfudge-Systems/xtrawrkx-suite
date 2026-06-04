'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Activity,
  Building2,
  Calendar,
  ExternalLink,
  Hash,
  Mail,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import {
  ActivitiesTimeline,
  Badge,
  Button,
  Card,
  EmptyState,
  InfoRow,
  InfoSection,
  KPICard,
  LoadingSpinner,
  Select,
  SidebarCardTitle,
  Table,
  TableCellText,
  TabsWithActions,
  ownerDisplayFromUser,
  useMediaQuery,
} from '@webfudge/ui'
import OrganizationMembersMobile from '../../../components/OrganizationMembersMobile'
import PlatformPageHeader from '../../../components/PlatformPageHeader'
import { buildOrgActivityItems } from '../../../lib/orgActivity'
import { formatOrgStatus, orgStatusVariant } from '../../../lib/orgDisplay'
import platformService from '../../../lib/platformService'

const ACCOUNTS_URL = process.env.NEXT_PUBLIC_ACCOUNTS_APP_URL || 'http://localhost:3001'
const PM_URL = process.env.NEXT_PUBLIC_PM_APP_URL || 'http://localhost:3002'

const STATUS_OPTIONS = [
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
]

function openAsOrg(orgId, url) {
  localStorage.setItem('current-org-id', String(orgId))
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatShortDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

/** Full-width elevated section cards */
const DETAIL_CARD_CLASS = 'w-full'

function OrganizationProfileCard({ org, ownerLabel }) {
  return (
    <Card variant="elevated" className={DETAIL_CARD_CLASS}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-xl font-semibold text-gray-900">Organization profile</h2>
          <p className="mt-1.5 text-base text-gray-500">
            Internal workspace identity and primary admin for this tenant.
          </p>
        </div>
        <Badge variant={orgStatusVariant(org.status)} size="sm" className="shrink-0 capitalize">
          {formatOrgStatus(org.status)}
        </Badge>
      </div>
      <div className="space-y-5">
        <InfoSection title="Key info" icon={Building2} isFirst>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <InfoRow label="Owner" value={ownerLabel} icon={User} emphasize />
            <InfoRow label="Workspace slug" value={org.slug} icon={Hash} />
            <InfoRow label="Primary email" value={org.companyEmail || org.owner?.email} icon={Mail} />
            <InfoRow label="Trial ends" value={formatShortDate(org.trialEndsAt)} icon={Calendar} />
            <InfoRow label="Created" value={formatShortDate(org.createdAt)} icon={Calendar} />
          </div>
        </InfoSection>
      </div>
    </Card>
  )
}

function StatusSidebar({ status, saving, onStatusChange, onSave }) {
  return (
    <Card variant="elevated" className={DETAIL_CARD_CLASS}>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Status control</h2>
      <div className="space-y-4">
        <Select
          label="Organization status"
          value={status}
          onChange={onStatusChange}
          options={STATUS_OPTIONS}
        />
        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Update status'}
        </Button>
      </div>
    </Card>
  )
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const id = params?.id
  const isMobile = useMediaQuery('(max-width: 767px)')
  const [org, setOrg] = useState(null)
  const [activityItems, setActivityItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('trial')
  const [activeTab, setActiveTab] = useState('overview')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await platformService.getOrganization(id)
      setOrg(data)
      setStatus(data?.status || 'trial')

      try {
        const activities = await platformService.getOrganizationActivities(id)
        setActivityItems(Array.isArray(activities) ? activities : buildOrgActivityItems(data))
      } catch {
        setActivityItems(buildOrgActivityItems(data))
      }
    } catch (err) {
      setError(err?.message || 'Failed to load organization')
      setOrg(null)
      setActivityItems([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusSave = async () => {
    setSaving(true)
    setError('')
    try {
      await platformService.updateOrganization(id, { status })
      await load()
    } catch (err) {
      setError(err?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const members = org?.organizationUsers || []
  const ownerDerived = ownerDisplayFromUser(org?.owner)

  const breadcrumb = useMemo(
    () => [
      { label: 'Organizations', href: '/organizations' },
      ...(org?.name ? [{ label: org.name }] : []),
    ],
    [org?.name]
  )

  const detailTabs = useMemo(
    () => {
      const tabs = [
        { key: 'overview', label: 'Overview' },
        {
          key: 'members',
          label: 'Members',
          badge: members.length > 0 ? String(members.length) : undefined,
        },
        {
          key: 'activities',
          label: 'Activities',
          badge: activityItems.length > 0 ? String(activityItems.length) : undefined,
        },
      ]
      return isMobile ? tabs.filter((tab) => tab.key !== 'overview') : tabs
    },
    [members.length, activityItems.length, isMobile]
  )

  useEffect(() => {
    if (isMobile && activeTab === 'overview') {
      setActiveTab('members')
    }
  }, [isMobile, activeTab])

  const memberColumns = useMemo(
    () => [
      {
        key: 'user',
        label: 'MEMBER',
        render: (_, row) => {
          const u = row.user
          if (!u) {
            return <TableCellText primary={`User ${row.id}`} />
          }
          const derived = ownerDisplayFromUser(u)
          if (derived.label === 'Unassigned') {
            return <TableCellText primary={u.email || '—'} />
          }
          return (
            <TableCellText
              primary={derived.label}
              secondary={u.email}
              maxWidthClass="max-w-[280px]"
            />
          )
        },
      },
      {
        key: 'role',
        label: 'ROLE',
        render: (_, row) => (
          <Badge variant="secondary" size="sm">
            {row.role?.name || 'Member'}
          </Badge>
        ),
      },
    ],
    []
  )

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PlatformPageHeader
          title="Loading organization..."
          breadcrumb={[{ label: 'Organizations', href: '/organizations' }]}
        />
        <Card variant="elevated" className={`flex justify-center p-12 ${DETAIL_CARD_CLASS}`}>
          <LoadingSpinner size="lg" message="Loading organization..." />
        </Card>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <PlatformPageHeader
          title="Organization not found"
          breadcrumb={[{ label: 'Organizations', href: '/organizations' }]}
        />
        <Card variant="elevated" className={`p-8 ${DETAIL_CARD_CLASS}`}>
          <EmptyState
            icon={Building2}
            title="Organization not found"
            description={error || 'This organization may have been deleted or the link is invalid.'}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
      <PlatformPageHeader
        title={org.name}
        subtitle={org.companyEmail || org.slug}
        breadcrumb={breadcrumb}
      >
        <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:justify-end">
          <Button
            variant="secondary"
            onClick={() => openAsOrg(org.id, ACCOUNTS_URL)}
            className="gap-2 px-3 sm:px-4"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Open Accounts</span>
            <span className="sm:hidden">Accounts</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => openAsOrg(org.id, PM_URL)}
            className="gap-2 px-3 sm:px-4"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Open PM</span>
            <span className="sm:hidden">PM</span>
          </Button>
        </div>
      </PlatformPageHeader>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm md:hidden">
        <Badge variant={orgStatusVariant(org.status)} size="sm" className="capitalize">
          {formatOrgStatus(org.status)}
        </Badge>
        <span className="text-sm text-gray-500">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </span>
        {org.trialEndsAt ? (
          <span className="text-sm text-gray-500">Trial ends {formatShortDate(org.trialEndsAt)}</span>
        ) : null}
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Status"
          value={formatOrgStatus(org.status)}
          icon={Sparkles}
          colorScheme="orange"
        />
        <KPICard
          title="Members"
          value={String(members.length)}
          icon={Users}
          colorScheme="orange"
        />
        <KPICard
          title="Trial ends"
          value={formatShortDate(org.trialEndsAt)}
          icon={Calendar}
          colorScheme="orange"
        />
        <KPICard
          title="Created"
          value={formatShortDate(org.createdAt)}
          icon={Calendar}
          colorScheme="orange"
        />
      </div>

      {isMobile ? (
        <Card variant="elevated" className={`md:hidden ${DETAIL_CARD_CLASS}`}>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Status</h2>
          <div className="space-y-3">
            <Select
              label="Organization status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
            <Button onClick={handleStatusSave} disabled={saving} className="w-full">
              {saving ? 'Saving…' : 'Update status'}
            </Button>
          </div>
        </Card>
      ) : null}

      <TabsWithActions
        variant="pill"
        tabs={detailTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'overview' ? (
        <div className="hidden grid-cols-1 gap-6 lg:grid lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OrganizationProfileCard org={org} ownerLabel={ownerDerived.label} />
          </div>
          <div>
            <StatusSidebar
              status={status}
              saving={saving}
              onStatusChange={setStatus}
              onSave={handleStatusSave}
            />
          </div>
        </div>
      ) : null}

      {activeTab === 'members' ? (
        <Card variant="elevated" className={DETAIL_CARD_CLASS}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Members</h2>
            <p className="mt-1.5 text-base text-gray-500">
              {members.length} workspace {members.length === 1 ? 'user' : 'users'} assigned to this organization.
            </p>
          </div>
          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Assign an owner when creating the organization to provision the first admin user."
            />
          ) : (
            <>
              <OrganizationMembersMobile members={members} />
              <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
                <Table
                  columns={memberColumns}
                  data={members}
                  keyField="id"
                  variant="modernEmbedded"
                />
              </div>
            </>
          )}
        </Card>
      ) : null}

      {activeTab === 'activities' ? (
        <Card variant="elevated" className={DETAIL_CARD_CLASS}>
          <SidebarCardTitle title="Activity timeline" icon={Activity} />
          <ActivitiesTimeline items={activityItems} />
        </Card>
      ) : null}
    </div>
  )
}
