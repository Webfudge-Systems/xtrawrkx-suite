/**
 * Aggregated dashboard metrics for Personal, Sales, and Manager views.
 */
import { fetchMyWorkSummary } from './taskService';
import meetingService from './meetingService';
import leadCompanyService from './leadCompanyService';
import dashboardService from './dashboardService';
import proposalService from './proposalService';
import invoiceService from './invoiceService';
import dealService from './dealService';
import taskService from './taskService';
import strapiClient from '../strapiClient';
import { paginateStrapiList } from '@webfudge/utils';
import { fetchTeamPerformanceSummary } from './teamPerformanceService';
import { isAssignedToCurrentUser } from '../rbac';

const LIST_PAGE_SIZE = 100;
const TERMINAL_TASK = new Set(['COMPLETED', 'CANCELLED']);

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchAllPaged(fetchPage, options = {}) {
  return paginateStrapiList(fetchPage, { pageSize: LIST_PAGE_SIZE, ...options });
}

function isOpenTask(task) {
  const st = String(task?.status ?? '').toUpperCase();
  return st && !TERMINAL_TASK.has(st);
}

function isOverdueTask(task) {
  if (!isOpenTask(task)) return false;
  const due = task?.scheduledDate || task?.dueDate;
  if (!due) return false;
  return new Date(due).getTime() < startOfLocalDay().getTime();
}

export async function fetchPersonalKpis() {
  const empty = {
    openTasks: 0,
    overdueTasks: 0,
    meetingsToday: 0,
    assignedLeads: 0,
  };
  try {
    const dayStart = startOfLocalDay().toISOString();
    const dayEnd = endOfLocalDay().toISOString();

    const [myWork, meetingsRes, leads] = await Promise.all([
      fetchMyWorkSummary(),
      meetingService.getAll({
        'pagination[pageSize]': 50,
        filters: {
          status: { $eq: 'scheduled' },
          startTime: { $gte: dayStart, $lte: dayEnd },
        },
      }).catch(() => ({ data: [] })),
      fetchAllPaged((page) =>
        leadCompanyService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignedTo'],
        })
      ),
    ]);

    const openTasks =
      (myWork?.overdue?.count ?? 0) + (myWork?.today?.count ?? 0) + (myWork?.upcoming?.count ?? 0);
    const overdueTasks = myWork?.overdue?.count ?? 0;
    const meetingsToday = Array.isArray(meetingsRes?.data) ? meetingsRes.data.length : 0;
    const assignedLeads = leads.filter((l) => isAssignedToCurrentUser(l)).length;

    return { openTasks, overdueTasks, meetingsToday, assignedLeads };
  } catch (e) {
    console.error('dashboardDataService.fetchPersonalKpis:', e);
    return empty;
  }
}

export async function fetchSalesKpis() {
  const base = await dashboardService.getStats();
  const data = base?.data || {};
  const empty = {
    ...data,
    totalProposalValue: 0,
    pendingInvoiceValue: 0,
  };

  try {
    const [proposals, invoices] = await Promise.all([
      fetchAllPaged((page) =>
        proposalService.getAll({ 'pagination[page]': page, 'pagination[pageSize]': LIST_PAGE_SIZE })
      ),
      fetchAllPaged((page) =>
        invoiceService.getAll({ 'pagination[page]': page, 'pagination[pageSize]': LIST_PAGE_SIZE })
      ),
    ]);

    const totalProposalValue = proposals.reduce((s, p) => s + money(p.totalValue), 0);
    const pendingStatuses = new Set(['DRAFT', 'SENT', 'PARTIAL']);
    const pendingInvoiceValue = invoices
      .filter((i) => pendingStatuses.has(String(i.status || '').toUpperCase()))
      .reduce((s, i) => s + money(i.balanceDue ?? i.total), 0);

    return {
      totalLeads: data.totalLeads ?? 0,
      pipelineValue: data.pipelineValue ?? 0,
      conversionRate: data.conversionRate ?? 0,
      activeDeals: data.activeDeals ?? 0,
      changes: data.changes || {},
      totalProposalValue,
      pendingInvoiceValue,
    };
  } catch (e) {
    console.error('dashboardDataService.fetchSalesKpis:', e);
    return empty;
  }
}

export async function fetchManagerKpis() {
  const empty = {
    teamOpenTasks: 0,
    teamOverdueTasks: 0,
    meetingsToday: 0,
    activeTeamMembers: 0,
  };
  try {
    const dayStart = startOfLocalDay().toISOString();
    const dayEnd = endOfLocalDay().toISOString();

    const [team, tasks, meetingsRes] = await Promise.all([
      fetchTeamPerformanceSummary(),
      fetchAllPaged((page) =>
        taskService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignee'],
        })
      ),
      meetingService.getAll({
        'pagination[pageSize]': 50,
        filters: {
          status: { $eq: 'scheduled' },
          startTime: { $gte: dayStart, $lte: dayEnd },
        },
      }).catch(() => ({ data: [] })),
    ]);

    const openTasks = tasks.filter(isOpenTask);
    const teamOverdueTasks = openTasks.filter(isOverdueTask).length;
    const meetingsToday = Array.isArray(meetingsRes?.data) ? meetingsRes.data.length : 0;
    const activeTeamMembers = team.members?.length ?? 0;

    return {
      teamOpenTasks: team.totals?.openTasks ?? openTasks.length,
      teamOverdueTasks,
      meetingsToday,
      activeTeamMembers,
    };
  } catch (e) {
    console.error('dashboardDataService.fetchManagerKpis:', e);
    return empty;
  }
}

/** Raw lists for sales/manager chart widgets (client-side aggregation). */
export async function fetchSalesDashboardData() {
  try {
    const [deals, leads, meetings, proposals, invoices, usersRes] = await Promise.all([
      dealService.fetchAll().catch(() => []),
      leadCompanyService.fetchAll().catch(() => []),
      fetchAllPaged((page) =>
        meetingService.getAll({ 'pagination[page]': page, 'pagination[pageSize]': LIST_PAGE_SIZE })
      ),
      fetchAllPaged((page) =>
        proposalService.getAll({ 'pagination[page]': page, 'pagination[pageSize]': LIST_PAGE_SIZE })
      ),
      fetchAllPaged((page) =>
        invoiceService.getAll({ 'pagination[page]': page, 'pagination[pageSize]': LIST_PAGE_SIZE })
      ),
      strapiClient.getXtrawrkxUsers({ pageSize: LIST_PAGE_SIZE }).catch(() => ({ data: [] })),
    ]);
    return {
      deals: Array.isArray(deals) ? deals : [],
      leads: Array.isArray(leads) ? leads : [],
      meetings: Array.isArray(meetings) ? meetings : [],
      proposals: Array.isArray(proposals) ? proposals : [],
      invoices: Array.isArray(invoices) ? invoices : [],
      users: Array.isArray(usersRes?.data) ? usersRes.data : [],
    };
  } catch (e) {
    console.error('dashboardDataService.fetchSalesDashboardData:', e);
    return { deals: [], leads: [], meetings: [], proposals: [], invoices: [], users: [] };
  }
}

function displayName(user) {
  if (!user) return 'Unknown';
  const first = user.firstName || user.first_name || '';
  const last = user.lastName || user.last_name || '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (user.username) return user.username;
  if (user.email) return String(user.email).split('@')[0];
  return 'Team member';
}

export async function fetchManagerDashboardData() {
  try {
    const [team, tasks, leads, meetings, usersRes] = await Promise.all([
      fetchTeamPerformanceSummary(),
      fetchAllPaged((page) =>
        taskService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignee'],
        })
      ),
      fetchAllPaged((page) =>
        leadCompanyService.getAll({
          'pagination[page]': page,
          'pagination[pageSize]': LIST_PAGE_SIZE,
          populate: ['assignedTo'],
        })
      ),
      fetchAllPaged((page) =>
        meetingService.getAll({ 'pagination[page]': page, 'pagination[pageSize]': LIST_PAGE_SIZE })
      ),
      strapiClient.getXtrawrkxUsers({ pageSize: LIST_PAGE_SIZE }).catch(() => ({ data: [] })),
    ]);
    const users = Array.isArray(usersRes?.data) ? usersRes.data : [];
    const nameById = new Map(users.map((u) => [String(u.id), displayName(u)]));
    return { team, tasks, leads, meetings, nameById };
  } catch (e) {
    console.error('dashboardDataService.fetchManagerDashboardData:', e);
    return { team: { members: [], totals: {} }, tasks: [], leads: [], meetings: [], nameById: new Map() };
  }
}
