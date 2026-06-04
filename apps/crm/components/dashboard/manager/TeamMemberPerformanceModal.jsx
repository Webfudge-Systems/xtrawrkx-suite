'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { CheckSquare, Building2, Briefcase } from 'lucide-react'
import {
  Modal,
  TabsWithActions,
  Select,
  EmptyState,
  LoadingSpinner,
  Avatar,
  TableCellText,
  TableCellCreated,
  Card,
  TableCellLeadStatusSelect,
  TableCellTaskStatusSelect,
  TableCellDealStageSelect,
  crmTableActionsColumn,
} from '@webfudge/ui'
import {
  fetchMemberPerformanceDetail,
  resolvePerformanceDateRange,
} from '../../../lib/api/teamPerformanceService'
import taskService from '../../../lib/api/taskService'
import leadCompanyService from '../../../lib/api/leadCompanyService'
import dealService from '../../../lib/api/dealService'
import { canEditCRMRecord } from '../../../lib/rbac'
import { leadCompanyLabel } from '../leadsMeetingsShared'

const DATE_RANGE_OPTIONS = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'all', label: 'All time' },
]

const MODAL_TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'leads', label: 'Leads' },
  { id: 'deals', label: 'Deals' },
  { id: 'report', label: 'Report' },
]

const MODAL_TABLE_COL_WIDTHS = {
  tasks: ['28%', '20%', '18%', '18%', '16%'],
  leads: ['44%', '22%', '18%', '16%'],
  deals: ['30%', '18%', '14%', '18%', '20%'],
}

function ModalDataTable({ columns, data, colWidths, keyField = 'id' }) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          {colWidths.map((width, index) => (
            <col key={columns[index]?.key ?? index} style={{ width }} />
          ))}
        </colgroup>
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${
                  column.headerClassName || ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {data.map((row, rowIndex) => {
            const rowKey = row[keyField] ?? rowIndex
            return (
              <tr
                key={rowKey}
                className="group bg-white transition-colors hover:bg-blue-50/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`min-w-0 px-3 py-3 text-sm text-gray-700 group-hover:text-gray-900 ${
                      column.className || ''
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReportBreakdown({ title, items, color = '#FF7A20' }) {
  const max = items.reduce((m, x) => Math.max(m, x.count), 0) || 1
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center text-sm text-gray-500">
        No {title.toLowerCase()} in this period.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold capitalize text-gray-900">
              {item.key}
            </span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-gray-600">
              {item.count}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${Math.round((item.count / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function TasksTab({ tasks, onTaskStatusChange, savingTaskIds }) {
  const rows = useMemo(
    () =>
      tasks.map((task) => {
        const id = task?.id ?? task?.documentId
        const lc = task?.leadCompany
        const lcId = lc && (lc.id ?? lc.documentId)
        const viewHref = lcId
          ? `/sales/lead-companies/${lcId}`
          : id != null
            ? `/clients/tasks?highlight=${id}`
            : '/clients/tasks'
        const editHref = lcId ? `/sales/lead-companies/${lcId}/edit` : '/clients/tasks'
        return {
          id: id ?? task.title,
          task,
          title: task.title || task.name || 'Untitled task',
          status: task.status,
          due: task.scheduledDate || task.dueDate,
          updatedAt: task.updatedAt,
          href: viewHref,
          viewHref,
          editHref,
        }
      }),
    [tasks]
  )

  if (!rows.length) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks"
        description="No tasks for this member in the selected period."
      />
    )
  }

  const columns = [
    {
      key: 'title',
      label: 'Task',
      className: 'min-w-0',
      render: (_, row) => (
        <Link
          href={row.href}
          className="block truncate font-semibold text-gray-900 hover:text-orange-600"
          title={row.title}
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <TableCellTaskStatusSelect
          status={row.status}
          onStatusChange={(next) => onTaskStatusChange(row.task, next)}
          saving={Boolean(savingTaskIds[row.id])}
          containerClassName="w-full max-w-full"
        />
      ),
    },
    {
      key: 'due',
      label: 'Due',
      render: (_, row) => <TableCellCreated dateString={row.due} dateMode="calendar" />,
    },
    {
      key: 'updated',
      label: 'Updated',
      render: (_, row) => <TableCellCreated dateString={row.updatedAt} dateMode="relative" />,
    },
    crmTableActionsColumn((row) => ({
      viewHref: row.viewHref,
      editHref: row.editHref,
      viewTitle: 'View task',
      editTitle: row.viewHref?.includes('/lead-companies/') ? 'Edit lead' : 'Open tasks',
    })),
  ]

  return <ModalDataTable columns={columns} data={rows} colWidths={MODAL_TABLE_COL_WIDTHS.tasks} />
}

function LeadsTab({ leads, onLeadStatusChange, savingLeadIds }) {
  const rows = useMemo(
    () =>
      leads.map((lead) => {
        const id = lead?.id ?? lead?.documentId
        return {
          id: id ?? leadCompanyLabel(lead),
          lead,
          company: leadCompanyLabel(lead),
          updatedAt: lead.updatedAt,
          href: id != null ? `/sales/lead-companies/${id}` : '/sales/lead-companies',
          viewHref: id != null ? `/sales/lead-companies/${id}` : null,
          editHref: id != null ? `/sales/lead-companies/${id}/edit` : null,
        }
      }),
    [leads]
  )

  if (!rows.length) {
    return (
      <EmptyState
        icon={Building2}
        title="No leads"
        description="No leads for this member in the selected period."
      />
    )
  }

  const columns = [
    {
      key: 'company',
      label: 'Company',
      className: 'min-w-0',
      render: (_, row) => (
        <Link
          href={row.href}
          className="block truncate font-semibold text-gray-900 hover:text-orange-600"
          title={row.company}
        >
          {row.company}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <TableCellLeadStatusSelect
          company={row.lead}
          onStatusChange={(_, next) => onLeadStatusChange(row.lead, next)}
          saving={Boolean(savingLeadIds[row.lead?.id ?? row.lead?.documentId])}
          canEdit={canEditCRMRecord('leads', row.lead)}
          containerClassName="w-full max-w-full"
        />
      ),
    },
    {
      key: 'updated',
      label: 'Updated',
      render: (_, row) => <TableCellCreated dateString={row.updatedAt} dateMode="calendar" />,
    },
    crmTableActionsColumn((row) => ({
      viewHref: row.viewHref,
      editHref: row.editHref,
      viewTitle: 'View lead',
      editTitle: 'Edit lead',
    })),
  ]

  return <ModalDataTable columns={columns} data={rows} colWidths={MODAL_TABLE_COL_WIDTHS.leads} />
}

function DealsTab({ deals, onDealStageChange, savingDealIds }) {
  const rows = useMemo(
    () =>
      deals.map((deal) => {
        const id = deal?.id ?? deal?.documentId
        const name = deal.name || deal.title || deal?.leadCompany?.companyName || `Deal ${id ?? ''}`
        return {
          id: id ?? name,
          deal,
          name,
          stage: deal.stage,
          value: deal.value ?? deal.amount,
          updatedAt: deal.updatedAt,
          href: id != null ? `/sales/deals/${id}` : '/sales/deals',
          viewHref: id != null ? `/sales/deals/${id}` : null,
          editHref: id != null ? `/sales/deals/${id}/edit` : null,
        }
      }),
    [deals]
  )

  if (!rows.length) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No deals"
        description="No deals for this member in the selected period."
      />
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Deal',
      className: 'min-w-0',
      render: (_, row) => (
        <Link
          href={row.href}
          className="block truncate font-semibold text-gray-900 hover:text-orange-600"
          title={row.name}
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (_, row) => (
        <TableCellDealStageSelect
          stage={row.stage}
          onStageChange={(next) => onDealStageChange(row.deal, next)}
          saving={Boolean(savingDealIds[row.deal?.id ?? row.deal?.documentId])}
          canEdit={canEditCRMRecord('deals', row.deal)}
          containerClassName="w-full max-w-full"
        />
      ),
    },
    {
      key: 'value',
      label: 'Value',
      render: (_, row) => (
        <TableCellText
          value={row.value != null ? `₹${Number(row.value).toLocaleString('en-IN')}` : '—'}
          emphasized
        />
      ),
    },
    {
      key: 'updated',
      label: 'Updated',
      render: (_, row) => <TableCellCreated dateString={row.updatedAt} dateMode="relative" />,
    },
    crmTableActionsColumn((row) => ({
      viewHref: row.viewHref,
      editHref: row.editHref,
      viewTitle: 'View deal',
      editTitle: 'Edit deal',
    })),
  ]

  return <ModalDataTable columns={columns} data={rows} colWidths={MODAL_TABLE_COL_WIDTHS.deals} />
}

function ReportTab({ report, stats, rangeLabel }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Performance breakdown for <span className="font-semibold text-gray-900">{rangeLabel}</span>.
      </p>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 shadow-md">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
            <CheckSquare className="h-4 w-4 text-orange-600" />
            Tasks by status
          </h3>
          <ReportBreakdown title="Tasks" items={report.tasksByStatus} color="#ea580c" />
        </Card>
        <Card className="p-5 shadow-md">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
            <Building2 className="h-4 w-4 text-orange-600" />
            Leads by status
          </h3>
          <ReportBreakdown title="Leads" items={report.leadsByStatus} color="#FF7A20" />
        </Card>
        <Card className="p-5 shadow-md">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-700">
            <Briefcase className="h-4 w-4 text-orange-600" />
            Deals by stage
          </h3>
          <ReportBreakdown title="Deals" items={report.dealsByStage} color="#c2410c" />
        </Card>
      </div>
      <Card className="p-5 shadow-md">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700">Summary</h3>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Open tasks', stats.openTasks],
            ['Completed tasks', stats.completedTasks],
            ['Leads', stats.totalLeads],
            ['Open deals', stats.openDeals],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
              <dt className="text-xs font-medium text-gray-500">{label}</dt>
              <dd className="mt-1 text-2xl font-black tabular-nums text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}

export default function TeamMemberPerformanceModal({ member, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('tasks')
  const [dateRange, setDateRange] = useState('last30')
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [savingTaskIds, setSavingTaskIds] = useState({})
  const [savingLeadIds, setSavingLeadIds] = useState({})
  const [savingDealIds, setSavingDealIds] = useState({})

  useEffect(() => {
    if (!isOpen || !member?.id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchMemberPerformanceDetail(member.id, { dateRange })
      if (!cancelled) {
        setDetail(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, member?.id, dateRange])

  useEffect(() => {
    if (isOpen) {
      setActiveTab('tasks')
    }
  }, [isOpen, member?.id])

  const handleTaskStatusChange = useCallback(async (task, nextStatus) => {
    const id = task?.id ?? task?.documentId
    if (!id) return
    setSavingTaskIds((prev) => ({ ...prev, [id]: true }))
    try {
      await taskService.update(id, { status: nextStatus })
      setDetail((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            (t?.id ?? t?.documentId) === id ? { ...t, status: nextStatus } : t
          ),
        }
      })
    } catch (e) {
      console.error(e)
      alert('Failed to update task status.')
    } finally {
      setSavingTaskIds((prev) => ({ ...prev, [id]: false }))
    }
  }, [])

  const handleLeadStatusChange = useCallback(async (lead, nextStatus) => {
    const id = lead?.id ?? lead?.documentId
    if (!id) return
    setSavingLeadIds((prev) => ({ ...prev, [id]: true }))
    try {
      await leadCompanyService.update(id, { status: nextStatus })
      setDetail((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          leads: prev.leads.map((l) =>
            (l?.id ?? l?.documentId) === id ? { ...l, status: nextStatus } : l
          ),
        }
      })
    } catch (e) {
      console.error(e)
      alert('Failed to update lead status.')
    } finally {
      setSavingLeadIds((prev) => ({ ...prev, [id]: false }))
    }
  }, [])

  const handleDealStageChange = useCallback(async (deal, nextStage) => {
    const id = deal?.id ?? deal?.documentId
    if (!id) return
    if (!canEditCRMRecord('deals', deal)) {
      alert('You can only update deals assigned to you.')
      return
    }
    setSavingDealIds((prev) => ({ ...prev, [id]: true }))
    try {
      await dealService.update(id, { stage: nextStage })
      setDetail((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          deals: prev.deals.map((d) =>
            (d?.id ?? d?.documentId) === id ? { ...d, stage: nextStage } : d
          ),
        }
      })
    } catch (e) {
      console.error(e)
      alert(e?.message || 'Failed to update deal stage.')
    } finally {
      setSavingDealIds((prev) => ({ ...prev, [id]: false }))
    }
  }, [])

  const rangeLabel = resolvePerformanceDateRange(dateRange).label

  const tabs = useMemo(
    () =>
      MODAL_TABS.map((tab) => {
        let badge = 0
        if (detail) {
          if (tab.id === 'tasks') badge = detail.stats.totalTasks
          if (tab.id === 'leads') badge = detail.stats.totalLeads
          if (tab.id === 'deals') badge = detail.stats.totalDeals
        }
        return { ...tab, badge: badge || undefined }
      }),
    [detail]
  )

  if (!member) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      className="min-w-0 w-full"
      contentClassName="!flex min-h-0 min-w-0 w-full flex-1 flex-col !overflow-hidden !px-4 !pb-4 !pt-4 sm:!px-6"
    >
      <div className="shrink-0 space-y-4 border-b border-gray-200 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              size="lg"
              fallback={member.initials}
              className="!h-12 !w-12 bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-4 ring-orange-100"
            />
            <div>
              <p className="text-lg font-bold text-gray-900">{member.name}</p>
              <p className="text-sm text-gray-600">{member.role || 'Team member'}</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                {member.percent ?? 0}% team capacity
              </p>
            </div>
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Date range"
              value={dateRange}
              onChange={setDateRange}
              options={DATE_RANGE_OPTIONS}
              allowEmpty={false}
            />
          </div>
        </div>

        {!loading && detail ? (
          <>
            <TabsWithActions
              variant="pill"
              pillTrack="hug"
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        ) : null}
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pt-4 [scrollbar-width:thin]">
        {loading || !detail ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" message="Loading performance..." />
          </div>
        ) : (
          <>
            {activeTab === 'tasks' && (
              <TasksTab
                tasks={detail.tasks}
                onTaskStatusChange={handleTaskStatusChange}
                savingTaskIds={savingTaskIds}
              />
            )}
            {activeTab === 'leads' && (
              <LeadsTab
                leads={detail.leads}
                onLeadStatusChange={handleLeadStatusChange}
                savingLeadIds={savingLeadIds}
              />
            )}
            {activeTab === 'deals' && (
              <DealsTab
                deals={detail.deals}
                onDealStageChange={handleDealStageChange}
                savingDealIds={savingDealIds}
              />
            )}
            {activeTab === 'report' && (
              <ReportTab report={detail.report} stats={detail.stats} rangeLabel={rangeLabel} />
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
