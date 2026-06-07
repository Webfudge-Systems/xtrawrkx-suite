/**
 * Aggregates open CRM workload per team member for the manager dashboard view.
 */
import strapiClient from '../strapiClient'
import { paginateStrapiList } from '@webfudge/utils'
import taskService from './taskService'
import leadCompanyService from './leadCompanyService'
import dealService from './dealService'

const LIST_PAGE_SIZE = 100
const TERMINAL_TASK_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

function recordOwnerId(record) {
  const assigned = record?.assignee ?? record?.assignedTo
  if (assigned == null) return null
  if (typeof assigned === 'object') {
    return assigned.id ?? assigned.documentId ?? null
  }
  return assigned
}

function inDateRange(iso, from, to) {
  if (!iso) return true
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return true
  if (from && t < from.getTime()) return false
  if (to && t > to.getTime()) return false
  return true
}

function recordActivityDate(record) {
  return record?.updatedAt || record?.createdAt || null
}

/** @returns {{ from: Date|null, to: Date|null, label: string }} */
export function resolvePerformanceDateRange(preset = 'last30') {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (preset === 'all') {
    return { from: null, to: null, label: 'All time' }
  }
  if (preset === 'last7') {
    const from = new Date(now)
    from.setDate(from.getDate() - 7)
    from.setHours(0, 0, 0, 0)
    return { from, to: end, label: 'Last 7 days' }
  }
  if (preset === 'last90') {
    const from = new Date(now)
    from.setDate(from.getDate() - 90)
    from.setHours(0, 0, 0, 0)
    return { from, to: end, label: 'Last 90 days' }
  }
  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    from.setHours(0, 0, 0, 0)
    return { from, to: end, label: 'This month' }
  }
  const from = new Date(now)
  from.setDate(from.getDate() - 30)
  from.setHours(0, 0, 0, 0)
  return { from, to: end, label: 'Last 30 days' }
}

function countByKey(items, getter) {
  const map = new Map()
  for (const item of items) {
    const key = getter(item) || 'unknown'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()].map(([key, count]) => ({ key, count }))
}

/**
 * @param {string|number} userId
 * @param {{ dateRange?: string }} options
 */
export async function fetchMemberPerformanceDetail(userId, { dateRange = 'last30' } = {}) {
  const empty = {
    tasks: [],
    leads: [],
    deals: [],
    stats: {
      openTasks: 0,
      openLeads: 0,
      openDeals: 0,
      completedTasks: 0,
      totalTasks: 0,
      totalLeads: 0,
      totalDeals: 0,
    },
    report: { tasksByStatus: [], leadsByStatus: [], dealsByStage: [] },
  }

  if (userId == null || userId === '') return empty

  const uid = String(userId)
  const { from, to } = resolvePerformanceDateRange(dateRange)

  try {
    const [tasks, leads, deals] = await Promise.all([
      fetchAllPaged((page) =>
        taskService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignee', 'leadCompany'],
          sort: 'updatedAt:desc',
        })
      ),
      fetchAllPaged((page) =>
        leadCompanyService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignedTo'],
          sort: 'updatedAt:desc',
        })
      ),
      fetchAllPaged((page) =>
        dealService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignedTo', 'leadCompany'],
          sort: 'updatedAt:desc',
        })
      ),
    ])

    const filterOwned = (list) =>
      list.filter((row) => {
        if (String(recordOwnerId(row) ?? '') !== uid) return false
        return inDateRange(recordActivityDate(row), from, to)
      })

    const memberTasks = filterOwned(tasks)
    const memberLeads = filterOwned(leads)
    const memberDeals = filterOwned(deals)

    const openTasks = memberTasks.filter(isOpenTask).length
    const completedTasks = memberTasks.filter(
      (t) => String(t?.status ?? '').toUpperCase() === 'COMPLETED'
    ).length
    const openLeads = memberLeads.length
    const openDeals = memberDeals.filter(isOpenDeal).length

    return {
      tasks: memberTasks,
      leads: memberLeads,
      deals: memberDeals,
      stats: {
        openTasks,
        openLeads,
        openDeals,
        completedTasks,
        totalTasks: memberTasks.length,
        totalLeads: memberLeads.length,
        totalDeals: memberDeals.length,
      },
      report: {
        tasksByStatus: countByKey(memberTasks, (t) =>
          String(t?.status ?? 'unknown').toUpperCase().replace(/_/g, ' ')
        ),
        leadsByStatus: countByKey(memberLeads, (l) =>
          String(l?.status ?? 'new').toUpperCase()
        ),
        dealsByStage: countByKey(memberDeals, (d) =>
          String(d?.stage ?? 'unknown').replace(/_/g, ' ')
        ),
      },
    }
  } catch (e) {
    console.error('teamPerformanceService.fetchMemberPerformanceDetail:', e)
    return empty
  }
}

function assigneeId(record) {
  return recordOwnerId(record)
}

function isOpenTask(task) {
  const status = String(task?.status ?? task?.strapiStatus ?? '').toUpperCase()
  return status && !TERMINAL_TASK_STATUSES.has(status)
}

function normDealStage(stage) {
  const s = String(stage ?? '').trim().toLowerCase()
  return s
}

function isOpenDeal(deal) {
  const s = normDealStage(deal?.stage)
  return s !== 'won' && s !== 'lost' && s !== 'closed_won' && s !== 'closed_lost'
}

function displayName(user) {
  if (!user) return 'Unknown'
  const first = user.firstName || user.first_name || ''
  const last = user.lastName || user.last_name || ''
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (user.username) return user.username
  if (user.email) return String(user.email).split('@')[0]
  return 'Team member'
}

function memberRoleLabel(user) {
  if (!user) return 'Member'
  const name = user.orgRoleName || user.role?.name || user.primaryRole?.name
  if (name) return String(name)
  const code = String(user.orgRoleCode || user.role?.code || '').toLowerCase()
  if (code === 'manager') return 'Manager'
  if (code === 'admin') return 'Admin'
  if (code === 'member') return 'Member'
  return 'Sales'
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

async function fetchAllPaged(fetchPage, options = {}) {
  return paginateStrapiList(fetchPage, { pageSize: LIST_PAGE_SIZE, ...options })
}

function bumpCount(map, id) {
  if (id == null) return
  const key = String(id)
  map.set(key, (map.get(key) || 0) + 1)
}

const BAR_PALETTE = ['orange', 'blue', 'green', 'purple', 'teal', 'pink', 'indigo']

/**
 * @returns {Promise<{ members: object[], totals: { openTasks: number, openLeads: number, openDeals: number } }>}
 */
export async function fetchTeamPerformanceSummary() {
  const empty = {
    members: [],
    totals: { openTasks: 0, openLeads: 0, openDeals: 0 },
  }

  try {
    const [usersRes, tasks, leads, deals] = await Promise.all([
      strapiClient.getXtrawrkxUsers({ pageSize: LIST_PAGE_SIZE }),
      fetchAllPaged((page) =>
        taskService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignee'],
          sort: 'updatedAt:desc',
        })
      ),
      fetchAllPaged((page) =>
        leadCompanyService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignedTo'],
          sort: 'updatedAt:desc',
        })
      ),
      fetchAllPaged((page) =>
        dealService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignedTo'],
          sort: 'updatedAt:desc',
        })
      ),
    ])

    const users = Array.isArray(usersRes?.data) ? usersRes.data : []
    const usersById = new Map(users.map((u) => [String(u.id), u]))

    const taskCounts = new Map()
    const leadCounts = new Map()
    const dealCounts = new Map()

    for (const task of tasks) {
      if (!isOpenTask(task)) continue
      bumpCount(taskCounts, assigneeId(task))
    }
    for (const lead of leads) {
      bumpCount(leadCounts, assigneeId(lead))
    }
    for (const deal of deals) {
      if (!isOpenDeal(deal)) continue
      bumpCount(dealCounts, assigneeId(deal))
    }

    const allIds = new Set([
      ...taskCounts.keys(),
      ...leadCounts.keys(),
      ...dealCounts.keys(),
    ])

    const entries = [...allIds].map((id) => {
      const user = usersById.get(id)
      const name = displayName(user)
      const openTasks = taskCounts.get(id) || 0
      const openLeads = leadCounts.get(id) || 0
      const openDeals = dealCounts.get(id) || 0
      const workloadScore = openTasks + openLeads + openDeals
      return {
        id,
        name,
        initials: initialsFromName(name),
        openTasks,
        openLeads,
        openDeals,
        workloadScore,
      }
    })

    entries.sort((a, b) => b.workloadScore - a.workloadScore)

    const maxScore = entries.length ? Math.max(...entries.map((e) => e.workloadScore), 1) : 1

    const members = entries.slice(0, 8).map((entry, index) => ({
      ...entry,
      role: memberRoleLabel(usersById.get(entry.id)),
      percent: Math.round((entry.workloadScore / maxScore) * 100),
      barColor: BAR_PALETTE[index % BAR_PALETTE.length],
      meta: [
        entry.openTasks ? `${entry.openTasks} task${entry.openTasks === 1 ? '' : 's'}` : null,
        entry.openLeads ? `${entry.openLeads} lead${entry.openLeads === 1 ? '' : 's'}` : null,
        entry.openDeals ? `${entry.openDeals} deal${entry.openDeals === 1 ? '' : 's'}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || 'No open items',
    }))

    const totals = {
      openTasks: [...taskCounts.values()].reduce((s, n) => s + n, 0),
      openLeads: [...leadCounts.values()].reduce((s, n) => s + n, 0),
      openDeals: [...dealCounts.values()].reduce((s, n) => s + n, 0),
    }

    return { members, totals }
  } catch (e) {
    console.error('teamPerformanceService.fetchTeamPerformanceSummary:', e)
    return empty
  }
}
