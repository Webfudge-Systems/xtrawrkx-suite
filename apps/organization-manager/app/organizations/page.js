'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, PauseCircle, Plus, Sparkles } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  KPICard,
  KPICardsRowSkeleton,
  Table,
  TableCellOwner,
  TableCellText,
  TableResultsCount,
  TableSkeleton,
  TabsWithActions,
  ownerDisplayFromUser,
} from '@webfudge/ui'
import OrganizationRowActions from '../../components/OrganizationRowActions'
import OrganizationListMobile from '../../components/OrganizationListMobile'
import PlatformPageHeader from '../../components/PlatformPageHeader'
import { formatOrgStatus, orgStatusVariant } from '../../lib/orgDisplay'
import platformService from '../../lib/platformService'

export default function OrganizationsPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, listRes] = await Promise.all([
        platformService.getStats(),
        platformService.listOrganizations({ pageSize: 100, search: search.trim() || undefined }),
      ])
      setStats(statsData)
      setRows(listRes.data || [])
    } catch (err) {
      setError(err?.message || 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const tabCounts = useMemo(() => {
    let active = 0
    let trial = 0
    let suspended = 0
    rows.forEach((row) => {
      const status = String(row.status || '').toLowerCase()
      if (status === 'active') active += 1
      else if (status === 'trial') trial += 1
      else if (status === 'suspended') suspended += 1
    })
    return { total: rows.length, active, trial, suspended }
  }, [rows])

  const tabItems = useMemo(
    () => [
      { key: 'all', label: 'All Organizations', count: stats?.total ?? tabCounts.total },
      { key: 'active', label: 'Active', count: stats?.active ?? tabCounts.active },
      { key: 'trial', label: 'Trial', count: stats?.trial ?? tabCounts.trial },
      { key: 'suspended', label: 'Suspended', count: stats?.suspended ?? tabCounts.suspended },
    ],
    [stats, tabCounts]
  )

  const filteredRows = useMemo(() => {
    if (activeTab === 'all') return rows
    return rows.filter((row) => String(row.status || '').toLowerCase() === activeTab)
  }, [rows, activeTab])

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'ORGANIZATION',
        render: (_, row) => (
          <TableCellText
            maxWidthClass="max-w-[280px]"
            primary={
              <Link
                href={`/organizations/${row.id}`}
                className="font-semibold text-brand-primary hover:underline"
              >
                {row.name}
              </Link>
            }
            secondary={row.companyEmail || row.slug}
          />
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (_, row) => (
          <Badge variant={orgStatusVariant(row.status)} size="sm" className="capitalize">
            {formatOrgStatus(row.status)}
          </Badge>
        ),
      },
      {
        key: 'members',
        label: 'USERS',
        render: (_, row) => (
          <TableCellText primary={String(row.memberCount ?? 0)} emphasized />
        ),
      },
      {
        key: 'owner',
        label: 'OWNER',
        render: (_, row) => {
          const derived = ownerDisplayFromUser(row.owner)
          if (derived.label === 'Unassigned') {
            return <TableCellText primary="—" />
          }
          return <TableCellOwner user={row.owner} showIcon={false} />
        },
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        width: '1%',
        headerClassName: 'text-left whitespace-nowrap',
        className: 'text-left align-middle whitespace-nowrap w-[1%]',
        render: (_, row) => (
          <OrganizationRowActions
            orgId={row.id}
            orgName={row.name}
            onDeleted={load}
          />
        ),
      },
    ],
    [load]
  )

  const isEmpty = !loading && filteredRows.length === 0

  return (
    <div className="min-h-full space-y-4 bg-white p-3 sm:space-y-6 sm:p-4 md:p-6">
      <PlatformPageHeader
        title="Organizations"
        subtitle="Create and manage tenant organizations with isolated data and users."
        breadcrumb={[{ label: 'Organizations', href: '/organizations' }]}
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      {loading && !stats ? (
        <KPICardsRowSkeleton count={4} />
      ) : stats ? (
        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Total organizations"
            value={String(stats.total ?? 0)}
            icon={Building2}
            colorScheme="orange"
          />
          <KPICard
            title="Active"
            value={String(stats.active ?? 0)}
            icon={CheckCircle2}
            colorScheme="orange"
          />
          <KPICard
            title="Trial"
            value={String(stats.trial ?? 0)}
            icon={Sparkles}
            colorScheme="orange"
          />
          <KPICard
            title="Suspended"
            value={String(stats.suspended ?? 0)}
            icon={PauseCircle}
            colorScheme="orange"
          />
        </div>
      ) : null}

      <TabsWithActions
        variant="modern"
        tabs={tabItems.map((item) => ({
          key: item.key,
          label: item.label,
          badge: String(item.count),
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showSearch
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search organizations..."
        showAdd
        onAddClick={() => router.push('/organizations/new')}
        addTitle="New organization"
      />

      {!loading ? <TableResultsCount count={filteredRows.length} /> : null}

      {!loading && !isEmpty ? (
        <OrganizationListMobile rows={filteredRows} onDeleted={load} />
      ) : null}

      {isEmpty ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={Building2}
            title={
              search.trim() || activeTab !== 'all'
                ? 'No organizations found'
                : 'No organizations yet'
            }
            description={
              search.trim()
                ? 'No organizations match your search. Try a different name or email.'
                : activeTab !== 'all'
                  ? `No organizations are currently in the ${activeTab} state.`
                  : 'Create your first tenant organization to provision isolated users and data.'
            }
            action={
              <Button onClick={() => router.push('/organizations/new')} className="gap-2">
                <Plus className="w-4 h-4" />
                Create organization
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
          {loading ? (
            <div className="p-8">
              <TableSkeleton rows={6} columns={5} />
            </div>
          ) : (
            <Table columns={columns} data={filteredRows} keyField="id" variant="modernEmbedded" />
          )}
        </div>
      )}
    </div>
  )
}
