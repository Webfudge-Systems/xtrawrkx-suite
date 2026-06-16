'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
  Table,
  TableCellCreated,
  TableCellProjectStatus,
  TableCellTitleSubtitle,
  TabsWithActions,
  ProgressBar,
  ownerDisplayFromUser,
} from '@webfudge/ui'
import {
  ChevronRight,
  Eye,
  FolderKanban,
  Link2,
  Lock,
} from 'lucide-react'

const TAB_KEYS = {
  ALL: 'all',
  ACTIVE: 'ACTIVE',
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
}

function isProjectOverdue(project) {
  if (!project?.endDate) return false
  const due = new Date(project.endDate)
  if (Number.isNaN(due.getTime())) return false
  const status = (project.strapiStatus || project.status || '').toUpperCase()
  return due < new Date() && status !== 'COMPLETED' && status !== 'CANCELLED'
}

function filterProjectsByTab(projects, tab) {
  if (tab === TAB_KEYS.ALL) return projects
  return projects.filter((project) => {
    const status = (project.strapiStatus || project.status || '').toUpperCase()
    return status === tab
  })
}

function countByTab(projects) {
  const counts = {
    all: projects.length,
    ACTIVE: 0,
    PLANNING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
  }
  for (const project of projects) {
    const status = (project.strapiStatus || project.status || '').toUpperCase()
    if (status in counts) counts[status] += 1
  }
  return counts
}

export default function DashboardProjectsWidget({
  projects = [],
  loading = false,
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL)

  const tabCounts = useMemo(() => countByTab(projects), [projects])
  const filteredProjects = useMemo(
    () => filterProjectsByTab(projects, activeTab),
    [projects, activeTab]
  )

  const tabItems = useMemo(
    () => [
      { key: TAB_KEYS.ALL, label: 'All', badge: tabCounts.all },
      { key: TAB_KEYS.ACTIVE, label: 'Active', badge: tabCounts.ACTIVE },
      { key: TAB_KEYS.PLANNING, label: 'Planning', badge: tabCounts.PLANNING },
      { key: TAB_KEYS.IN_PROGRESS, label: 'In Progress', badge: tabCounts.IN_PROGRESS },
      { key: TAB_KEYS.COMPLETED, label: 'Completed', badge: tabCounts.COMPLETED },
    ],
    [tabCounts]
  )

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Project name',
        width: '28%',
        className: 'align-middle py-3.5',
        render: (_, row) => {
          const initial = (row.name || 'P').trim().charAt(0).toUpperCase()
          return (
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                fallback={initial}
                alt={row.name}
                size="sm"
                className="mt-0.5 shrink-0 bg-gray-600 text-white"
              />
              <div className="min-w-0 flex-1">
                <TableCellTitleSubtitle
                  title={
                    <span className="inline-flex items-center gap-1.5">
                      {row.name || 'Untitled Project'}
                      {row.isPrivate ? (
                        <Lock className="inline h-3 w-3 shrink-0 text-gray-400" title="Private project" />
                      ) : null}
                    </span>
                  }
                  subtitle={row.description || 'No description'}
                />
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '14%',
        className: 'align-middle py-3.5',
        render: (_, row) => (
          <TableCellProjectStatus status={row.strapiStatus || row.status} compact />
        ),
      },
      {
        key: 'progress',
        label: 'Progress',
        width: '14%',
        className: 'align-middle py-3.5',
        render: (_, row) => <ProgressBar value={row.progress || 0} />,
      },
      {
        key: 'projectManager',
        label: 'Owner',
        width: '16%',
        className: 'align-middle py-3.5',
        render: (_, row) => {
          const pm = row.projectManager
          const derived = ownerDisplayFromUser(pm)
          const label = pm?.name || row.managerName || 'Unassigned'
          return (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar
                src={pm?.avatar || undefined}
                fallback={pm ? derived.avatarFallback : '?'}
                alt={label}
                size="sm"
                className={`shrink-0 text-white ${pm ? 'bg-gray-600' : 'bg-gray-300 text-gray-600'}`}
              />
              <span className="truncate text-xs font-semibold text-gray-900">{label}</span>
            </div>
          )
        },
      },
      {
        key: 'endDate',
        label: 'Due date',
        width: '12%',
        className: 'align-middle py-3.5',
        render: (_, row) => (
          <div
            className={
              isProjectOverdue(row)
                ? '[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90'
                : ''
            }
          >
            <TableCellCreated dateString={row.endDate} dateMode="calendar" emptyLabel="—" />
          </div>
        ),
      },
      {
        key: 'tasks',
        label: 'Tasks',
        width: '10%',
        className: 'align-middle py-3.5',
        render: (_, row) => (
          <span className="text-xs font-semibold tabular-nums text-gray-800">
            {row.completedTasks ?? 0}/{row.totalTasks ?? 0}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        resizable: false,
        defaultWidth: '100px',
        className: 'align-middle whitespace-nowrap py-3.5',
        render: (_, row) => (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="View project"
              onClick={() => router.push(`/projects/${row.slug || row.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-500 hover:bg-gray-100"
              title="Copy link"
              onClick={() =>
                navigator.clipboard?.writeText(
                  `${window.location.origin}/projects/${row.slug || row.id}`
                )
              }
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  )

  return (
    <Card
      outlined
      title="Project Overview"
      subtitle="Track your ongoing projects"
      actions={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/projects')}
          className="gap-2 text-orange-600 hover:text-orange-700"
        >
          <FolderKanban className="h-4 w-4" />
          View all
        </Button>
      }
    >
      <TabsWithActions
        variant="pill"
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-4"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" message="Loading projects…" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={
            activeTab === TAB_KEYS.ALL
              ? 'Get started by creating your first project'
              : `No ${activeTab.replace('_', ' ').toLowerCase()} projects`
          }
          className="py-12"
          action={
            <Button variant="primary" size="sm" onClick={() => router.push('/projects')}>
              Go to Projects
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[420px] overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[2] [&_thead_th]:bg-gray-50/95 [&_thead_th]:backdrop-blur-sm">
            <Table
              columns={columns}
              data={filteredProjects}
              keyField="id"
              variant="modernEmbedded"
              className="w-full"
              onRowClick={(row) => router.push(`/projects/${row.slug || row.id}`)}
              getRowClassName={(row) =>
                isProjectOverdue(row) ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-orange-50/50'
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
            <p className="text-xs text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span>
              {projects.length > filteredProjects.length ? (
                <>
                  {' '}
                  of <span className="font-semibold text-gray-900">{projects.length}</span>
                </>
              ) : null}{' '}
              project{filteredProjects.length !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => router.push('/projects')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              View all projects
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
