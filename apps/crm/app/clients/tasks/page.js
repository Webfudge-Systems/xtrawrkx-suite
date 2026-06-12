'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  ListTodo,
  PlayCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Video,
} from 'lucide-react';
import { calendarDayDiff, isCalendarDateBefore } from '@webfudge/utils';
import {
  Button,
  Table,
  Pagination,
  Avatar,
  LoadingSpinner,
  TabsWithActions,
  KPICard,
  Modal,
  TableCellCreated,
  TableCellDateOnly,
  TableCellOwner,
  TableCellText,
  TableCellOrangePill,
  TableCellMultiline,
  TableCellTaskStatusSelect,
  TableRowActionMenuPortal,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import taskService from '../../../lib/api/taskService';
import strapiClient from '../../../lib/strapiClient';
import leadCompanyService from '../../../lib/api/leadCompanyService';
import clientAccountService from '../../../lib/api/clientAccountService';
import dealService from '../../../lib/api/dealService';

function orgUserLabel(u) {
  if (!u || typeof u !== 'object') return '';
  return (
    u.username ||
    [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
    u.email ||
    (u.id != null ? `User ${u.id}` : '')
  );
}

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.clientsTasks.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.clientsTasks.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'crm.clientsTasks.tableColumnWidths';

const TASK_STATUSES = [
  'SCHEDULED',
  'IN_PROGRESS',
  'INTERNAL_REVIEW',
  'ON_HOLD',
  'OVERDUE',
  'COMPLETED',
  'CANCELLED',
];

const TOGGLEABLE_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'scheduledDate', label: 'Scheduled' },
  { key: 'clientAccount', label: 'Client account' },
  { key: 'deal', label: 'Deal' },
  { key: 'projects', label: 'Projects' },
  { key: 'leadCompany', label: 'Lead company' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_ON_KEYS = new Set(['status', 'priority', 'assignee', 'scheduledDate', 'clientAccount', 'deal']);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_KEYS.has(key);
  return acc;
}, {});

const ITEMS_PER_PAGE = 15;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isTaskOverdue(task) {
  const terminal = ['COMPLETED', 'CANCELLED', 'ON_HOLD'];
  const st = (task?.status || '').toUpperCase();
  if (terminal.includes(st)) return false;
  if (st === 'OVERDUE') return true;
  if (!task?.scheduledDate) return false;
  return isCalendarDateBefore(task.scheduledDate);
}

function isDueToday(task) {
  if (!task?.scheduledDate) return false;
  const st = (task?.status || '').toUpperCase();
  if (['COMPLETED', 'CANCELLED', 'ON_HOLD'].includes(st)) return false;
  return calendarDayDiff(task.scheduledDate) === 0;
}

function accountLabel(acc) {
  if (!acc || typeof acc !== 'object') return '';
  return acc.companyName || acc.name || '';
}

function dealLabel(deal) {
  if (!deal || typeof deal !== 'object') return '';
  return deal.name || '';
}

function dealPickerOptionLabel(d) {
  if (!d || typeof d !== 'object') return '';
  const base = d.name || 'Untitled deal';
  const st = d.stage ? String(d.stage) : '';
  return st ? `${base} (${st})` : base;
}

function leadCompanyLabel(lc) {
  if (!lc || typeof lc !== 'object') return '';
  return lc.companyName || lc.name || '';
}

function projectsLabel(projects) {
  if (!Array.isArray(projects) || !projects.length) return '';
  return projects
    .map((p) => (p && typeof p === 'object' ? p.name : ''))
    .filter(Boolean)
    .join(', ');
}

export default function ClientsTasksPage() {
  const router = useRouter();
  const initialFilters = useMemo(
    () => ({
      status: '',
      priority: '',
      assigneeId: '',
      nameQuery: '',
      scheduledRange: '',
    }),
    []
  );

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [moreActionMenu, setMoreActionMenu] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStatus, setCreateStatus] = useState('SCHEDULED');
  const [createPriority, setCreatePriority] = useState('medium');
  const [createAssigneeId, setCreateAssigneeId] = useState('');
  const [createScheduled, setCreateScheduled] = useState('');
  const [createSaving, setCreateSaving] = useState(false);
  const [assigneeOptionsUsers, setAssigneeOptionsUsers] = useState([]);
  const [leadCompanyOptions, setLeadCompanyOptions] = useState([]);
  const [clientAccountOptions, setClientAccountOptions] = useState([]);
  const [createLeadCompanyId, setCreateLeadCompanyId] = useState('');
  const [createClientAccountId, setCreateClientAccountId] = useState('');
  const [createDealId, setCreateDealId] = useState('');
  const [createDealsForPicker, setCreateDealsForPicker] = useState([]);
  const [createDealsLoading, setCreateDealsLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('SCHEDULED');
  const [editPriority, setEditPriority] = useState('medium');
  const [editScheduled, setEditScheduled] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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
  });

  useEffect(() => {
    if (!columnPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [columnPickerOpen]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await taskService.fetchAll({
        sort: 'scheduledDate:desc',
        'pagination[pageSize]': 500,
        populate: ['assignee', 'deal', 'clientAccount', 'projects', 'leadCompany'],
      });
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = [];
        let page = 1;
        let hasMore = true;
        while (hasMore && !cancelled) {
          const response = await strapiClient.getXtrawrkxUsers({
            'pagination[page]': page,
            'pagination[pageSize]': 100,
          });
          const usersData = response?.data ?? response ?? [];
          const arr = Array.isArray(usersData) ? usersData : [];
          const extracted = arr.map((u) =>
            u.attributes ? { id: u.id, documentId: u.documentId ?? u.id, ...u.attributes } : u
          );
          all.push(...extracted);
          const pageCount = response?.meta?.pagination?.pageCount ?? 1;
          hasMore = page < pageCount && arr.length === 100;
          page += 1;
        }
        if (!cancelled) {
          all.sort((a, b) => orgUserLabel(a).localeCompare(orgUserLabel(b)));
          setAssigneeOptionsUsers(all);
        }
      } catch (e) {
        console.error('Task assignee list failed to load', e);
        if (!cancelled) setAssigneeOptionsUsers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lcRes, caRes] = await Promise.all([
          leadCompanyService.getAll({
            sort: 'companyName:asc',
            'pagination[pageSize]': 500,
          }),
          clientAccountService.getAll({
            sort: 'companyName:asc',
            'pagination[pageSize]': 500,
          }),
        ]);
        if (!cancelled) {
          setLeadCompanyOptions(lcRes.data || []);
          setClientAccountOptions(caRes.data || []);
        }
      } catch (e) {
        console.error('Lead companies / client accounts failed to load for task form', e);
        if (!cancelled) {
          setLeadCompanyOptions([]);
          setClientAccountOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const leadNum = createLeadCompanyId ? Number(createLeadCompanyId) : null;
    const clientNum = createClientAccountId ? Number(createClientAccountId) : null;
    const leadOk = leadNum != null && !Number.isNaN(leadNum);
    const clientOk = clientNum != null && !Number.isNaN(clientNum);

    if (!leadOk && !clientOk) {
      setCreateDealsForPicker([]);
      setCreateDealsLoading(false);
      setCreateDealId('');
      return undefined;
    }

    let cancelled = false;
    setCreateDealsLoading(true);
    (async () => {
      try {
        const filters = leadOk
          ? { leadCompany: { id: { $eq: leadNum } } }
          : { clientAccount: { id: { $eq: clientNum } } };
        const { data } = await dealService.getAll({
          filters,
          sort: 'updatedAt:desc',
          'pagination[pageSize]': 200,
          populate: ['leadCompany', 'clientAccount'],
        });
        if (cancelled) return;
        const list = data || [];
        setCreateDealsForPicker(list);
        setCreateDealId((prev) => {
          if (!prev) return '';
          const ok = list.some(
            (d) => d && (String(d.id) === prev || String(d.documentId ?? '') === prev)
          );
          return ok ? prev : '';
        });
      } catch (e) {
        console.error('Deals for task form failed to load', e);
        if (!cancelled) {
          setCreateDealsForPicker([]);
          setCreateDealId('');
        }
      } finally {
        if (!cancelled) setCreateDealsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createLeadCompanyId, createClientAccountId]);

  const taskStats = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    let dueToday = 0;
    for (const t of tasks) {
      if (!t) continue;
      const st = (t.status || '').toUpperCase();
      if (st === 'COMPLETED') completed += 1;
      if (!['COMPLETED', 'CANCELLED'].includes(st)) open += 1;
      if (st === 'IN_PROGRESS' || st === 'INTERNAL_REVIEW') inProgress += 1;
      if (isTaskOverdue(t)) overdue += 1;
      if (isDueToday(t)) dueToday += 1;
    }
    return { open, inProgress, completed, overdue, dueToday };
  }, [tasks]);

  const tabCounts = useMemo(() => {
    const c = {
      all: tasks.length,
      overdue: 0,
      scheduled: 0,
      in_progress: 0,
      internal_review: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const t of tasks) {
      if (!t) continue;
      const st = (t.status || '').toUpperCase();
      if (isTaskOverdue(t)) c.overdue += 1;
      if (st === 'SCHEDULED') c.scheduled += 1;
      if (st === 'IN_PROGRESS') c.in_progress += 1;
      if (st === 'INTERNAL_REVIEW') c.internal_review += 1;
      if (st === 'ON_HOLD') c.on_hold += 1;
      if (st === 'COMPLETED') c.completed += 1;
      if (st === 'CANCELLED') c.cancelled += 1;
    }
    return c;
  }, [tasks]);

  const assigneeFilterOptions = useMemo(() => {
    const map = new Map();
    for (const t of tasks) {
      const u = t?.assignee;
      if (!u || typeof u !== 'object') continue;
      const id = u.id ?? u.documentId;
      if (id == null) continue;
      const name =
        u.username ||
        [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
        u.email ||
        `User ${id}`;
      map.set(String(id), name);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [tasks]);

  const matchesScheduledRange = useCallback((task, range) => {
    if (!range) return true;
    const sd = task.scheduledDate ? new Date(task.scheduledDate) : null;
    const now = new Date();
    const sod = startOfDay(now);
    const eod = endOfDay(now);
    if (range === 'overdue') return sd != null && !Number.isNaN(sd.getTime()) && sd < sod;
    if (range === 'today') return sd != null && !Number.isNaN(sd.getTime()) && sd >= sod && sd <= eod;
    if (range === 'week') {
      const end = new Date(sod);
      end.setDate(end.getDate() + 7);
      return sd != null && !Number.isNaN(sd.getTime()) && sd >= sod && sd <= end;
    }
    if (range === 'next30') {
      const end = new Date(sod);
      end.setDate(end.getDate() + 30);
      return sd != null && !Number.isNaN(sd.getTime()) && sd >= sod && sd <= end;
    }
    return true;
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!task) return false;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (task.name || '').toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        dealLabel(task.deal).toLowerCase().includes(q) ||
        accountLabel(task.clientAccount).toLowerCase().includes(q) ||
        leadCompanyLabel(task.leadCompany).toLowerCase().includes(q);

      const st = (task.status || 'SCHEDULED').toUpperCase();
      let matchesTab = true;
      if (activeTab === 'overdue') matchesTab = isTaskOverdue(task);
      else if (activeTab === 'scheduled') matchesTab = st === 'SCHEDULED';
      else if (activeTab === 'in_progress') matchesTab = st === 'IN_PROGRESS';
      else if (activeTab === 'internal_review') matchesTab = st === 'INTERNAL_REVIEW';
      else if (activeTab === 'on_hold') matchesTab = st === 'ON_HOLD';
      else if (activeTab === 'completed') matchesTab = st === 'COMPLETED';
      else if (activeTab === 'cancelled') matchesTab = st === 'CANCELLED';

      const assigneeId =
        task.assignee && typeof task.assignee === 'object'
          ? String(task.assignee.id ?? task.assignee.documentId ?? '')
          : '';

      const matchesAdvanced =
        (!appliedFilters.status || st === appliedFilters.status) &&
        (!appliedFilters.priority || (task.priority || '').toLowerCase() === appliedFilters.priority.toLowerCase()) &&
        (!appliedFilters.assigneeId || assigneeId === appliedFilters.assigneeId) &&
        (!appliedFilters.nameQuery ||
          (task.name || '').toLowerCase().includes(appliedFilters.nameQuery.toLowerCase())) &&
        matchesScheduledRange(task, appliedFilters.scheduledRange);

      return matchesSearch && matchesTab && matchesAdvanced;
    });
  }, [tasks, searchQuery, activeTab, appliedFilters, matchesScheduledRange]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, appliedFilters]);

  const hasActiveFilters = useMemo(
    () =>
      Object.values(appliedFilters).some((value) =>
        typeof value === 'string' ? value.trim() !== '' : Boolean(value)
      ),
    [appliedFilters]
  );

  const openFilterModal = useCallback(() => {
    setDraftFilters(appliedFilters);
    setShowFilterModal(true);
  }, [appliedFilters]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setShowFilterModal(false);
  }, [draftFilters]);

  const clearAllFilters = useCallback(() => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setShowFilterModal(false);
  }, [initialFilters]);

  const tabItems = [
    { key: 'all', label: 'All tasks', count: tabCounts.all },
    { key: 'overdue', label: 'Overdue', count: tabCounts.overdue },
    { key: 'scheduled', label: 'Scheduled', count: tabCounts.scheduled },
    { key: 'in_progress', label: 'In progress', count: tabCounts.in_progress },
    { key: 'internal_review', label: 'Review', count: tabCounts.internal_review },
    { key: 'on_hold', label: 'On hold', count: tabCounts.on_hold },
    { key: 'completed', label: 'Completed', count: tabCounts.completed },
    { key: 'cancelled', label: 'Cancelled', count: tabCounts.cancelled },
  ];

  const handleStatusUpdate = useCallback(
    async (taskId, newStatus) => {
      if (!taskId) return;
      const loadingKey = `${taskId}-${newStatus}`;
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));
      try {
        await taskService.update(taskId, { status: newStatus });
        setTasks((prev) =>
          prev.map((t) => (t?.id === taskId ? { ...t, status: newStatus } : t))
        );
      } catch (e) {
        console.error(e);
        alert('Failed to update status.');
      } finally {
        setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
      }
    },
    []
  );

  const handleDeleteTask = async () => {
    if (!taskToDelete?.id) return;
    const loadingKey = `${taskToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      await taskService.delete(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (e) {
      console.error(e);
      alert('Failed to delete task.');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const openCreate = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateStatus('SCHEDULED');
    setCreatePriority('medium');
    setCreateAssigneeId('');
    setCreateScheduled('');
    setCreateLeadCompanyId('');
    setCreateClientAccountId('');
    setCreateDealId('');
    setCreateDealsForPicker([]);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const name = createName.trim();
    if (!name || createSaving) return;
    setCreateSaving(true);
    try {
      const payload = {
        name,
        description: createDescription.trim() || null,
        status: createStatus,
        priority: createPriority,
      };
      if (createScheduled) payload.scheduledDate = new Date(createScheduled).toISOString();
      const assigneeNum = createAssigneeId ? Number(createAssigneeId) : null;
      if (assigneeNum != null && !Number.isNaN(assigneeNum)) payload.assignee = assigneeNum;

      const lcNum = createLeadCompanyId ? Number(createLeadCompanyId) : null;
      const caNum = createClientAccountId ? Number(createClientAccountId) : null;
      const dealNum = createDealId ? Number(createDealId) : null;
      if (lcNum != null && !Number.isNaN(lcNum)) payload.leadCompany = lcNum;
      if (caNum != null && !Number.isNaN(caNum)) payload.clientAccount = caNum;
      if (dealNum != null && !Number.isNaN(dealNum)) payload.deal = dealNum;

      const { data: created } = await taskService.create(payload);
      let row = created;
      if (row?.id) {
        try {
          const { data: full } = await taskService.getOne(row.id, {
            populate: ['assignee', 'deal', 'clientAccount', 'projects', 'leadCompany'],
          });
          if (full) row = full;
        } catch (e) {
          console.warn('Could not reload task after create', e);
        }
      }
      if (row) setTasks((prev) => [row, ...prev]);
      setCreateOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not create task.');
    } finally {
      setCreateSaving(false);
    }
  };

  const openEdit = useCallback((task) => {
    setEditTask(task);
    setEditName(task.name || '');
    setEditDescription(task.description || '');
    setEditStatus((task.status || 'SCHEDULED').toUpperCase());
    setEditPriority((task.priority || 'medium').toLowerCase());
    if (task.scheduledDate) {
      const d = new Date(task.scheduledDate);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        setEditScheduled(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        );
      } else setEditScheduled('');
    } else setEditScheduled('');
    setEditOpen(true);
  }, []);

  const submitEdit = async () => {
    if (!editTask?.id || editSaving) return;
    const name = editName.trim();
    if (!name) return;
    setEditSaving(true);
    try {
      const payload = {
        name,
        description: editDescription.trim() || null,
        status: editStatus,
        priority: editPriority,
      };
      if (editScheduled) payload.scheduledDate = new Date(editScheduled).toISOString();
      else payload.scheduledDate = null;
      const { data } = await taskService.update(editTask.id, payload);
      if (data) {
        setTasks((prev) => prev.map((t) => (t.id === editTask.id ? { ...t, ...data } : t)));
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editTask.id
              ? {
                  ...t,
                  name,
                  description: editDescription.trim() || null,
                  status: editStatus,
                  priority: editPriority,
                  scheduledDate: editScheduled ? new Date(editScheduled).toISOString() : null,
                }
              : t
          )
        );
      }
      setEditOpen(false);
      setEditTask(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not save task.');
    } finally {
      setEditSaving(false);
    }
  };

  const dealIdForRow = (task) => {
    const d = task?.deal;
    if (!d) return null;
    if (typeof d === 'object') return d.id ?? d.documentId;
    return d;
  };

  const allTableColumns = useMemo(
    () => [
      {
        key: 'task',
        label: 'TASK',
        fixed: true,
        render: (_, task) => (
          <div className="flex min-w-[220px] items-start gap-3">
            <Avatar fallback={(task.name || 'T')[0]} alt={task.name} size="sm" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">{task.name || 'Untitled'}</div>
              <div className="truncate text-sm text-gray-500">
                {task.description ? String(task.description).slice(0, 80) : 'No description'}
                {task.description && String(task.description).length > 80 ? '…' : ''}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, task) => {
          const saving = Object.entries(loadingActions).some(
            ([key, active]) =>
              active && key.startsWith(`${task.id}-`) && !key.endsWith('-delete')
          );
          return (
            <TableCellTaskStatusSelect
              status={task.status}
              onStatusChange={(next) => handleStatusUpdate(task.id, next)}
              saving={saving}
            />
          );
        },
      },
      {
        key: 'priority',
        visibilityKey: 'priority',
        label: 'PRIORITY',
        render: (_, task) => <TableCellOrangePill value={task.priority} />,
      },
      {
        key: 'assignee',
        visibilityKey: 'assignee',
        label: 'ASSIGNEE',
        render: (_, task) => <TableCellOwner user={task.assignee} />,
      },
      {
        key: 'scheduledDate',
        visibilityKey: 'scheduledDate',
        label: 'SCHEDULED',
        render: (_, task) => (
          <TableCellCreated dateString={task.scheduledDate} dateMode="calendar" />
        ),
      },
      {
        key: 'clientAccount',
        visibilityKey: 'clientAccount',
        label: 'CLIENT',
        render: (_, task) => {
          const acc = task.clientAccount;
          const id = acc && typeof acc === 'object' ? acc.id ?? acc.documentId : null;
          const label = accountLabel(acc);
          if (id && label) {
            return (
              <Link
                href={`/clients/accounts/${id}`}
                className="text-sm font-medium text-orange-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </Link>
            );
          }
          return <TableCellText value={label} />;
        },
      },
      {
        key: 'deal',
        visibilityKey: 'deal',
        label: 'DEAL',
        render: (_, task) => {
          const id = dealIdForRow(task);
          const label = dealLabel(task.deal);
          if (id && label) {
            return (
              <Link
                href={`/sales/deals/${id}`}
                className="max-w-[180px] truncate text-sm font-medium text-orange-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </Link>
            );
          }
          return <TableCellText value={label} />;
        },
      },
      {
        key: 'projects',
        visibilityKey: 'projects',
        label: 'PROJECTS',
        render: (_, task) => <TableCellText value={projectsLabel(task.projects)} maxWidthClass="max-w-[200px]" />,
      },
      {
        key: 'leadCompany',
        visibilityKey: 'leadCompany',
        label: 'LEAD CO.',
        render: (_, task) => <TableCellText value={leadCompanyLabel(task.leadCompany)} />,
      },
      {
        key: 'description',
        visibilityKey: 'description',
        label: 'DESCRIPTION',
        render: (_, task) => (
          <TableCellMultiline text={task.description} maxChars={100} maxWidthClass="max-w-[220px]" />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, task) => <TableCellCreated dateString={task.createdAt} />,
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_, task) => <TableCellDateOnly dateString={task.updatedAt} />,
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, task) => {
          const did = dealIdForRow(task);
          return (
            <div className="flex min-w-[200px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-teal-600 hover:bg-teal-50"
                  title="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    setMoreActionMenu((prev) =>
                      prev?.id === task.id
                        ? null
                        : { id: task.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                    );
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-emerald-600 hover:bg-emerald-50"
                title="Edit task"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(task);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                title="Open deal"
                disabled={!did}
                onClick={(e) => {
                  e.stopPropagation();
                  if (did) router.push(`/sales/deals/${did}`);
                }}
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-red-600 hover:bg-red-50"
                title="Delete task"
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskToDelete(task);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, openEdit]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.task) out.push(byKey.task);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return out;
  }, [allTableColumns, columnVisibility, columnOrder]);

  const onRowClick = (row) => {
    const did = dealIdForRow(row);
    if (did) router.push(`/sales/deals/${did}`);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Tasks"
        subtitle="Client delivery and follow-up tasks"
        breadcrumb={[
          { label: 'Clients', href: '/clients' },
          { label: 'Tasks', href: '/clients/tasks' },
        ]}
        showActions
        hasActiveFilters={hasActiveFilters}
        onAddClick={openCreate}
        onFilterClick={openFilterModal}
        onImportClick={() => console.log('Import tasks')}
        onExportClick={() => console.log('Export tasks')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Open tasks"
          value={taskStats.open}
          subtitle={taskStats.open === 0 ? 'None open' : 'Not completed or cancelled'}
          icon={ListTodo}
          colorScheme="orange"
        />
        <KPICard
          title="In progress / review"
          value={taskStats.inProgress}
          subtitle="Active work"
          icon={PlayCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Due today"
          value={taskStats.dueToday}
          subtitle="Scheduled for today"
          icon={AlertTriangle}
          colorScheme="orange"
        />
        <KPICard
          title="Completed"
          value={taskStats.completed}
          subtitle="All time"
          icon={CheckCircle}
          colorScheme="orange"
        />
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabItems.map((item) => ({
            key: item.key,
            label: item.label,
            badge: item.count.toString(),
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tasks..."
          showAdd
          onAddClick={openCreate}
          addTitle="Add task"
          showFilter
          onFilterClick={openFilterModal}
          showColumnVisibility
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show or hide columns"
          showExport
          onExportClick={() => console.log('Export tasks')}
          exportTitle="Export"
        />
        <TableColumnPicker
          open={columnPickerOpen}
          description="Task name and actions stay visible. Drag column edges in the table to resize."
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
        Showing <span className="font-semibold text-gray-900">{filteredTasks.length}</span> result
        {filteredTasks.length !== 1 ? 's' : ''}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading tasks..." />
          </div>
        ) : (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedTasks}
              keyField="id"
              variant="modern"
              onRowClick={onRowClick}
              {...tableResizeProps}
            />
            {paginatedTasks.length === 0 && (
              <div className="border-t border-gray-200 p-12 text-center">
                <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No tasks found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all' || hasActiveFilters
                    ? 'Try adjusting search or filters'
                    : 'Create a task to track delivery work'}
                </p>
                {!searchQuery && activeTab === 'all' && !hasActiveFilters && (
                  <Button variant="primary" onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add task
                  </Button>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredTasks.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal && !!taskToDelete}
        onClose={() => {
          if (taskToDelete && loadingActions[`${taskToDelete.id}-delete`]) return;
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
        title="Delete Task"
        size="md"
        closeOnBackdrop={!(taskToDelete && loadingActions[`${taskToDelete.id}-delete`])}
      >
        {taskToDelete ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-900">
                <span className="font-semibold">This action cannot be undone</span>
              </p>
            </div>
            <p className="text-sm text-gray-700">Are you sure you want to delete this task?</p>
            <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="muted"
                disabled={!!loadingActions[`${taskToDelete.id}-delete`]}
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteTask}
                disabled={!!loadingActions[`${taskToDelete.id}-delete`]}
                className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
              >
                {loadingActions[`${taskToDelete.id}-delete`] ? 'Deleting…' : 'Delete Task'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => !createSaving && setCreateOpen(false)} title="New task" size="lg">
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="Task title"
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Description (optional)</span>
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="Notes or acceptance criteria"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Priority</span>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Assignee (optional)</span>
            <select
              value={createAssigneeId}
              onChange={(e) => setCreateAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">Default — assign to me</option>
              {assigneeOptionsUsers.map((u) => {
                const id = u.id ?? u.documentId;
                if (id == null) return null;
                return (
                  <option key={String(id)} value={String(id)}>
                    {orgUserLabel(u)}
                  </option>
                );
              })}
            </select>
            <span className="text-xs text-gray-500">Leave as default unless someone else should own this task.</span>
          </label>

          <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-4">
            <p className="text-sm font-medium text-gray-800">CRM links (optional)</p>
            <p className="text-xs text-gray-500">
              Choose a lead company <span className="font-medium text-gray-600">or</span> a client account, then pick a deal for that record. Selecting one clears the other.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Lead company</span>
                <select
                  value={createLeadCompanyId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCreateLeadCompanyId(v);
                    if (v) setCreateClientAccountId('');
                    setCreateDealId('');
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">— None —</option>
                  {leadCompanyOptions.map((lc) => {
                    const id = lc.id ?? lc.documentId;
                    if (id == null) return null;
                    const label = leadCompanyLabel(lc) || `Lead ${id}`;
                    return (
                      <option key={String(id)} value={String(id)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Client account</span>
                <select
                  value={createClientAccountId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCreateClientAccountId(v);
                    if (v) setCreateLeadCompanyId('');
                    setCreateDealId('');
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="">— None —</option>
                  {clientAccountOptions.map((acc) => {
                    const id = acc.id ?? acc.documentId;
                    if (id == null) return null;
                    const label = accountLabel(acc) || `Account ${id}`;
                    return (
                      <option key={String(id)} value={String(id)}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Deal (optional)</span>
              <select
                value={createDealId}
                onChange={(e) => setCreateDealId(e.target.value)}
                disabled={
                  (!createLeadCompanyId && !createClientAccountId) || createDealsLoading || createDealsForPicker.length === 0
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">
                  {!createLeadCompanyId && !createClientAccountId
                    ? 'Select a lead or client first'
                    : createDealsLoading
                      ? 'Loading deals…'
                      : createDealsForPicker.length === 0
                        ? 'No deals for this record'
                        : '— No deal —'}
                </option>
                {createDealsForPicker.map((d) => {
                  const id = d.id ?? d.documentId;
                  if (id == null) return null;
                  return (
                    <option key={String(id)} value={String(id)}>
                      {dealPickerOptionLabel(d)}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Scheduled (optional)</span>
            <input
              type="datetime-local"
              value={createScheduled}
              onChange={(e) => setCreateScheduled(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button variant="muted" type="button" onClick={() => setCreateOpen(false)} disabled={createSaving}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={submitCreate} disabled={createSaving || !createName.trim()}>
              {createSaving ? 'Saving…' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editOpen && !!editTask} onClose={() => !editSaving && setEditOpen(false)} title="Edit task" size="lg">
        {editTask ? (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Priority</span>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Scheduled</span>
              <input
                type="datetime-local"
                value={editScheduled}
                onChange={(e) => setEditScheduled(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button variant="muted" type="button" onClick={() => setEditOpen(false)} disabled={editSaving}>
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={submitEdit} disabled={editSaving || !editName.trim()}>
                {editSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter tasks" size="lg">
        <div className="space-y-5">
          <p className="text-sm text-gray-600">Refine tasks by status, assignee, and schedule</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Any status</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Priority</span>
              <select
                value={draftFilters.priority}
                onChange={(e) => setDraftFilters((p) => ({ ...p, priority: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Any priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Assignee</span>
              <select
                value={draftFilters.assigneeId}
                onChange={(e) => setDraftFilters((p) => ({ ...p, assigneeId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Anyone</option>
                {assigneeFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Scheduled</span>
              <select
                value={draftFilters.scheduledRange}
                onChange={(e) => setDraftFilters((p) => ({ ...p, scheduledRange: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Any time</option>
                <option value="overdue">Overdue (before today)</option>
                <option value="today">Due today</option>
                <option value="week">Due within 7 days</option>
                <option value="next30">Due within 30 days</option>
              </select>
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Task name contains</span>
              <input
                value={draftFilters.nameQuery}
                onChange={(e) => setDraftFilters((p) => ({ ...p, nameQuery: e.target.value }))}
                placeholder="Filter by title..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={clearAllFilters}>
              Clear all
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="muted" onClick={() => setShowFilterModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </div>
          {hasActiveFilters ? <p className="text-xs text-orange-700">Active filters are applied.</p> : null}
        </div>
      </Modal>

      {moreActionMenu &&
        (() => {
          const row = tasks.find((t) => t.id === moreActionMenu.id);
          if (!row) return null;
          return (
            <TableRowActionMenuPortal
              open
              anchor={{
                top: moreActionMenu.top,
                left: moreActionMenu.left,
                triggerEl: moreActionMenu.triggerEl,
              }}
              onClose={() => setMoreActionMenu(null)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  console.log('Create meet for task', row.id);
                }}
              >
                <Video className="h-4 w-4 shrink-0 text-teal-600" />
                Create meet
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  const did = dealIdForRow(row);
                  if (did) router.push(`/sales/deals/${did}`);
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Open linked deal
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  void navigator.clipboard.writeText(`${window.location.origin}/clients/tasks`);
                }}
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
                Copy tasks page link
              </button>
            </TableRowActionMenuPortal>
          );
        })()}
    </div>
  );
}
