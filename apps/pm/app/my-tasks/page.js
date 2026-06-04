'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@webfudge/auth';
import {
  Avatar,
  Button,
  KPICard,
  LoadingSpinner,
  Modal,
  Select,
  Table,
  TableCellCreated,
  TableCellTitleSubtitle,
  TableRowActionMenuPortal,
  TabsWithActions,
  Textarea,
  ChatMessageText,
  ViewToggleGroup,
  ViewToggleButton,
  ownerDisplayFromUser,
  TableCellTaskStatusSelect,
  PM_TASK_STATUS_OPTIONS,
} from '@webfudge/ui';
import {
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Copy,
  Edit3,
  Eye,
  FolderKanban,
  GanttChart,
  Kanban,
  LayoutList,
  Link2,
  ListTodo,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  SendHorizontal,
  Table2,
  Trash2,
  CheckCircle,
  GripVertical,
} from 'lucide-react';
import PMPageHeader from '../../components/PMPageHeader';
import PMRowActions from '../../components/PMRowActions';
import QuickCreateTaskModal from '../../components/QuickCreateTaskModal';
import {
  isTaskOverdue,
  MyTasksKanbanBoard,
  MyTasksListByStatus,
  MyTasksTimelineView,
} from '../../components/MyTasksViews';
import { TaskSubtasksAfterRow, TaskSubtasksToggleButton } from '../../components/TaskSubtasksTableExtras';
import TaskAssigneesPicker from '../../components/TaskAssigneesPicker';
import {
  pmTableSelectFillProps,
  PRIORITY_OPTIONS,
} from '../../components/PMStatusBadge';
import projectService from '../../lib/api/projectService';
import { fetchPmAssignableUsers } from '../../lib/api/messageService';
import taskService from '../../lib/api/taskService';
import taskCommentService from '../../lib/api/taskCommentService';
import { transformProject, transformTask, transformUser } from '../../lib/api/dataTransformers';
import { usePmTableSort } from '../../hooks/usePmTableSort';
import { TableSortDropdown as PmTableSortDropdown } from '@webfudge/ui';

const TABLE_SORT_STORAGE_KEY = 'pm.myTasks.tableSort';

const STATUS_TABS = [
  { id: 'MY_TASKS', label: 'My Tasks' },
  { id: 'IN_PROGRESS', label: 'In Progress Tasks' },
  { id: 'OVERDUE', label: 'Overdue Tasks' },
  { id: 'all', label: 'All Tasks' },
];

/** Completed/cancelled tasks stay on All Tasks but are hidden from My Tasks. */
const MY_TASKS_EXCLUDED_STATUSES = new Set(['COMPLETED', 'CANCELLED']);

const COLUMN_VISIBILITY_STORAGE_KEY = 'pm.myTasks.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'pm.myTasks.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'pm.myTasks.tableColumnWidths';
const TASK_VIEW_STORAGE_KEY = 'pm.myTasks.taskView';

/** Default pixel widths for resizable table columns (keyed by column `key`). */
const DEFAULT_COLUMN_WIDTHS = {
  name: 300,
  project: 168,
  status: 170,
  priority: 140,
  assigner: 140,
  assignees: 130,
  startDate: 120,
  dueDate: 120,
  tags: 140,
  description: 200,
  createdAt: 120,
  updatedAt: 120,
  recurrence: 120,
  actions: 220,
};

/** Enforced minimums when loading saved widths (e.g. after older defaults). */
const MIN_COLUMN_WIDTHS = {
  actions: 220,
};

const TASK_VIEW_MODES = ['list', 'table', 'kanban', 'timeline'];

function readStoredTaskView() {
  if (typeof window === 'undefined') return 'table';
  try {
    const v = window.localStorage.getItem(TASK_VIEW_STORAGE_KEY);
    if (TASK_VIEW_MODES.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return 'table';
}

/** Optional columns (task name + actions always visible). Extra fields default off until enabled. */
const TOGGLEABLE_COLUMNS = [
  { key: 'project', label: 'Project' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assigner', label: 'Assigner' },
  { key: 'assignees', label: 'Assignees' },
  { key: 'startDate', label: 'Start date' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'tags', label: 'Tags' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Last updated' },
  { key: 'recurrence', label: 'Repeat' },
];

const DEFAULT_ON_COLUMN_KEYS = new Set([
  'project',
  'status',
  'priority',
  'assigner',
  'assignees',
  'startDate',
  'dueDate',
]);

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_COLUMN_KEYS.has(key);
  return acc;
}, {});

function loadColumnVisibility() {
  if (typeof window === 'undefined') return { ...DEFAULT_COLUMN_VISIBILITY };
  try {
    const raw = window.localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COLUMN_VISIBILITY };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed };
  } catch {
    return { ...DEFAULT_COLUMN_VISIBILITY };
  }
}

function loadColumnOrder() {
  if (typeof window === 'undefined') return [...REORDERABLE_COLUMN_KEYS];
  try {
    const raw = window.localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
    if (!raw) return [...REORDERABLE_COLUMN_KEYS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...REORDERABLE_COLUMN_KEYS];
    const valid = new Set(REORDERABLE_COLUMN_KEYS);
    const ordered = parsed.filter((k) => valid.has(k));
    const missing = REORDERABLE_COLUMN_KEYS.filter((k) => !ordered.includes(k));
    return [...ordered, ...missing];
  } catch {
    return [...REORDERABLE_COLUMN_KEYS];
  }
}

function persistColumnOrder(order) {
  try {
    window.localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

function loadColumnWidths() {
  if (typeof window === 'undefined') return { ...DEFAULT_COLUMN_WIDTHS };
  try {
    const raw = window.localStorage.getItem(COLUMN_WIDTHS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COLUMN_WIDTHS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_COLUMN_WIDTHS };
    const merged = { ...DEFAULT_COLUMN_WIDTHS, ...parsed };
    for (const [key, min] of Object.entries(MIN_COLUMN_WIDTHS)) {
      if (typeof merged[key] === 'number' && merged[key] < min) {
        merged[key] = min;
      }
    }
    return merged;
  } catch {
    return { ...DEFAULT_COLUMN_WIDTHS };
  }
}

function persistColumnWidths(widths) {
  try {
    window.localStorage.setItem(COLUMN_WIDTHS_STORAGE_KEY, JSON.stringify(widths));
  } catch {
    /* ignore */
  }
}

function assignerStrapiShape(row, users) {
  const u = users.find((x) => Number(x.id) === Number(row.assignerId));
  if (!u) return null;
  const parts = (u.name || '').trim().split(/\s+/);
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    firstName: u.firstName || parts[0] || '',
    lastName: u.lastName || parts.slice(1).join(' ') || '',
    email: u.email || '',
    username: u.name || u.email || '',
  };
}

/** Clear label for table (no Select): prefer API name, then roster, then fallback. */
function assignerTableLabel(row, assignerUser, derived) {
  const a = row.assignerName && String(row.assignerName).trim();
  if (a) return a;
  if (assignerUser?.name?.trim()) return assignerUser.name.trim();
  if (assignerUser?.email?.trim()) return assignerUser.email.trim();
  const lbl = derived?.label;
  if (lbl && lbl !== 'Unassigned') return lbl;
  if (row.assignerId != null) return `User ${row.assignerId}`;
  return '';
}

function actorDisplay(actor) {
  if (!actor || typeof actor !== 'object') return 'Unknown user';
  if (actor.username) return actor.username;
  if (actor.email) return actor.email;
  if (actor.id != null) return `User ${actor.id}`;
  return 'Unknown user';
}

function commentTextFromMeta(meta) {
  if (meta == null) return '';
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta);
      return typeof parsed?.comment === 'string' ? parsed.comment : '';
    } catch {
      return '';
    }
  }
  if (typeof meta === 'object' && typeof meta.comment === 'string') {
    return meta.comment;
  }
  return '';
}

function formatCommentTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MyTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const openedCreateFromQuery = useRef(false);
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [activeTab, setActiveTab] = useState('MY_TASKS');
  const [taskViewMode, setTaskViewMode] = useState(() =>
    typeof window === 'undefined' ? 'table' : readStoredTaskView()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ priority: '', projectId: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [taskModal, setTaskModal] = useState({ open: false, task: null, parentContext: null });
  const [expandedSubtaskParents, setExpandedSubtaskParents] = useState(() => new Set());
  const [deleteModal, setDeleteModal] = useState({ open: false, task: null });
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY }));
  const [columnOrder, setColumnOrder] = useState(() => [...REORDERABLE_COLUMN_KEYS]);
  const [columnWidths, setColumnWidths] = useState(() => ({ ...DEFAULT_COLUMN_WIDTHS }));
  const [columnDropIndicator, setColumnDropIndicator] = useState(null);
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsByTask, setCommentsByTask] = useState({});
  const [commentCountsByTaskId, setCommentCountsByTaskId] = useState({});
  const [commentLoadingTaskId, setCommentLoadingTaskId] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const toolbarRef = useRef(null);
  const columnDragKeyRef = useRef(null);
  const columnDropIndicatorRef = useRef(null);

  const getUserId = useCallback(() => {
    const u = user?.attributes || user;
    return u?.id || user?.id || null;
  }, [user]);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = { pageSize: 200, sort: 'updatedAt:desc' };
      if (filters.priority) params.priority = filters.priority;
      if (filters.projectId) params.projectId = filters.projectId;

      const res = await taskService.getAllTasks(params);
      const list = (res?.data || []).map(transformTask).filter(Boolean);
      setAllTasks(list);
    } catch (error) {
      console.error('Load tasks error:', error);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  }, [filters.priority, filters.projectId, getUserId]);

  const currentUserId = useMemo(() => {
    const id = getUserId();
    return id == null ? null : String(id);
  }, [getUserId]);

  const isMyTask = useCallback(
    (task) => {
      if (!currentUserId) return false;
      const directAssigneeIds = (task.assigneeUserIds || []).map((id) => String(id));
      if (directAssigneeIds.includes(currentUserId)) return true;
      const assigneeIdsFromObjects = (task.assignees || [])
        .map((assignee) => assignee?.id)
        .filter((id) => id != null)
        .map((id) => String(id));
      return assigneeIdsFromObjects.includes(currentUserId);
    },
    [currentUserId]
  );

  const isActiveMyTask = useCallback(
    (task) => isMyTask(task) && !MY_TASKS_EXCLUDED_STATUSES.has(task.strapiStatus),
    [isMyTask]
  );

  const filteredTasks = useMemo(() => {
    let list = [...allTasks];
    if (activeTab !== 'all') {
      if (activeTab === 'MY_TASKS') list = list.filter(isActiveMyTask);
      else if (activeTab === 'OVERDUE') list = list.filter(isTaskOverdue);
      else if (activeTab === 'IN_PROGRESS') list = list.filter((task) => task.strapiStatus === 'IN_PROGRESS');
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter((task) => {
        const assigneeNames = (task.assignees || []).map((a) => a.name).join(' ');
        return [task.name, task.project, task.assigneeName, task.assignerName, assigneeNames, task.description].some(
          (value) => String(value || '').toLowerCase().includes(query)
        );
      });
    }
    return list;
  }, [allTasks, activeTab, searchQuery, isActiveMyTask]);

  /** Every task in the active filter gets its own row; parents still expose nested subtasks when expanded. */
  const tableRootTasks = filteredTasks;

  const {
    sortedData: sortedTableRootTasks,
    bindSortableColumns,
    hasActiveSort,
    sortRules,
    columnOptions: sortColumnOptions,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    maxRules: sortMaxRules,
  } = usePmTableSort({
    entity: 'task',
    storageKey: TABLE_SORT_STORAGE_KEY,
    data: tableRootTasks,
  });

  const childrenByParentId = useMemo(() => {
    const map = {};
    for (const task of allTasks) {
      if (!task?.parentId) continue;
      if (!map[task.parentId]) map[task.parentId] = [];
      map[task.parentId].push(task);
    }
    return map;
  }, [allTasks]);

  const toggleSubtaskExpand = useCallback((taskId) => {
    setExpandedSubtaskParents((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  useEffect(() => {
    const ids = tableRootTasks.map((t) => t?.id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const counts = await taskCommentService.fetchTaskCommentCounts({ taskIds: ids });
        if (!cancelled) setCommentCountsByTaskId((prev) => ({ ...prev, ...(counts || {}) }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tableRootTasks]);

  const taskKpis = useMemo(() => {
    const out = { total: allTasks.length, todo: 0, inProgress: 0, completed: 0 };
    for (const task of allTasks) {
      if (task.strapiStatus === 'SCHEDULED') out.todo += 1;
      if (task.strapiStatus === 'IN_PROGRESS') out.inProgress += 1;
      if (task.strapiStatus === 'COMPLETED') out.completed += 1;
    }
    return out;
  }, [allTasks]);

  const loadLookups = useCallback(async () => {
    try {
      const [projectRes, rawUsers] = await Promise.all([
        projectService.getAllProjects({ pageSize: 200, sort: 'name:asc' }),
        fetchPmAssignableUsers(),
      ]);
      setProjects((projectRes?.data || []).map(transformProject).filter(Boolean));
      setUsers(rawUsers.map(transformUser).filter(Boolean));
    } catch (error) {
      console.error('Load lookups error:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    setColumnVisibility(loadColumnVisibility());
    setColumnOrder(loadColumnOrder());
    const widths = loadColumnWidths();
    setColumnWidths(widths);
    persistColumnWidths(widths);
  }, []);

  const handleColumnWidthsChange = useCallback((next) => {
    setColumnWidths(next);
  }, []);

  const handleColumnResizeEnd = useCallback((next) => {
    persistColumnWidths(next);
  }, []);

  const persistTaskView = useCallback((mode) => {
    try {
      window.localStorage.setItem(TASK_VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const handleTaskViewChange = useCallback((mode) => {
    setTaskViewMode(mode);
    persistTaskView(mode);
    if (mode !== 'table') {
      setColumnPickerOpen(false);
      setSortPickerOpen(false);
    }
  }, [persistTaskView]);

  useEffect(() => {
    if (!columnPickerOpen && !sortPickerOpen) return;
    const onDocMouseDown = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setColumnPickerOpen(false);
        setSortPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [columnPickerOpen, sortPickerOpen]);

  const setColumnVisible = useCallback((key, visible) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [key]: visible };
      try {
        window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleColumnDragStart = useCallback((e, key) => {
    columnDragKeyRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    const row = e.currentTarget.closest('[data-column-row]');
    if (row) row.classList.add('opacity-60');
  }, []);

  const handleColumnDragEnd = useCallback((e) => {
    columnDragKeyRef.current = null;
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
    const row = e.currentTarget.closest('[data-column-row]');
    if (row) row.classList.remove('opacity-60');
  }, []);

  const handleColumnRowDragOver = useCallback((e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fromKey = columnDragKeyRef.current || e.dataTransfer.getData('text/plain');
    if (!fromKey || fromKey === key) {
      columnDropIndicatorRef.current = null;
      setColumnDropIndicator(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const place = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    const hint = { targetKey: key, place };
    columnDropIndicatorRef.current = hint;
    setColumnDropIndicator(hint);
  }, []);

  const handleColumnListDragLeave = useCallback((e) => {
    const related = e.relatedTarget;
    if (related && e.currentTarget.contains(related)) return;
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
  }, []);

  const handleColumnDrop = useCallback((e, targetKey) => {
    e.preventDefault();
    const fromKey = columnDragKeyRef.current || e.dataTransfer.getData('text/plain');
    const hint = columnDropIndicatorRef.current;
    const place = hint?.targetKey === targetKey ? hint.place : 'before';
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
    if (!fromKey || fromKey === targetKey) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const fi = next.indexOf(fromKey);
      const ti0 = next.indexOf(targetKey);
      if (fi === -1 || ti0 === -1) return prev;
      next.splice(fi, 1);
      const ti = next.indexOf(targetKey);
      const insertAt = place === 'after' ? ti + 1 : ti;
      next.splice(insertAt, 0, fromKey);
      persistColumnOrder(next);
      return next;
    });
  }, []);

  const resetColumnTablePreferences = useCallback(() => {
    const vis = { ...DEFAULT_COLUMN_VISIBILITY };
    const order = [...REORDERABLE_COLUMN_KEYS];
    const widths = { ...DEFAULT_COLUMN_WIDTHS };
    setColumnVisibility(vis);
    setColumnOrder(order);
    setColumnWidths(widths);
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
    try {
      window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(vis));
      persistColumnOrder(order);
      persistColumnWidths(widths);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const create = searchParams.get('createTask');
    if (create !== '1' && create !== 'true') {
      openedCreateFromQuery.current = false;
      return;
    }
    if (openedCreateFromQuery.current) return;
    openedCreateFromQuery.current = true;
    setTaskModal({ open: true, task: null, parentContext: null });
    router.replace('/my-tasks', { scroll: false });
  }, [router, searchParams]);

  const tabsWithBadges = useMemo(() => {
    const counts = { all: allTasks.length, MY_TASKS: 0, IN_PROGRESS: 0, OVERDUE: 0 };
    for (const task of allTasks) {
      if (isActiveMyTask(task)) counts.MY_TASKS += 1;
      if (task.strapiStatus === 'IN_PROGRESS') counts.IN_PROGRESS += 1;
      if (isTaskOverdue(task)) counts.OVERDUE += 1;
    }
    return STATUS_TABS.map((tab) => ({ ...tab, badge: counts[tab.id] || 0 }));
  }, [allTasks, isActiveMyTask]);

  const updateTask = useCallback(
    async (task, patch) => {
      try {
        setSavingId(task.id);
        await taskService.updateTask(task.id, patch);
        await loadTasks();
      } catch (error) {
        console.error('Update task error:', error);
      } finally {
        setSavingId(null);
      }
    },
    [loadTasks]
  );

  const handleSaveTask = async (payload) => {
    try {
      setSaving(true);
      if (taskModal.task) {
        await taskService.updateTask(taskModal.task.id, payload);
      } else {
        await taskService.createTask(payload);
      }
      setTaskModal({ open: false, task: null, parentContext: null });
      await loadTasks();
    } catch (error) {
      console.error('Save task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteModal.task) return;
    try {
      setSaving(true);
      await taskService.deleteTask(deleteModal.task.id);
      setDeleteModal({ open: false, task: null });
      await loadTasks();
    } catch (error) {
      console.error('Delete task error:', error);
    } finally {
      setSaving(false);
    }
  };

  const copyTaskLink = useCallback(async (task) => {
    await navigator.clipboard?.writeText(`${window.location.origin}/tasks/${task.id}`);
  }, []);

  const openCommentComposer = useCallback(async (taskId, anchor) => {
    setCommentComposerMenu(anchor ? { id: taskId, ...anchor } : { id: taskId });
    setCommentDraft('');
    setCommentError('');
    setCommentLoadingTaskId(taskId);
    try {
      const res = await taskCommentService.fetchTaskComments({ taskId, limit: 20 });
      setCommentsByTask((prev) => ({ ...prev, [taskId]: res?.data || [] }));
    } catch (e) {
      setCommentError(e?.message || 'Could not load comments');
      setCommentsByTask((prev) => ({ ...prev, [taskId]: prev[taskId] || [] }));
    } finally {
      setCommentLoadingTaskId(null);
    }
  }, []);

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft('');
    setCommentError('');
  }, []);

  const submitTaskComment = useCallback(async () => {
    const taskId = commentComposerMenu?.id;
    const text = commentDraft.trim();
    if (!taskId || !text) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await taskCommentService.addTaskComment({ taskId, comment: text });
      const newComment = res?.data;
      if (newComment) {
        setCommentsByTask((prev) => ({
          ...prev,
          [taskId]: [newComment, ...(Array.isArray(prev[taskId]) ? prev[taskId] : [])],
        }));
      }
      setCommentCountsByTaskId((prev) => ({
        ...prev,
        [String(taskId)]: Math.max(
          1,
          (parseInt(prev[String(taskId)] || prev[taskId] || 0, 10) || 0) + 1
        ),
      }));
      setCommentDraft('');
    } catch (e) {
      setCommentError(e?.message || 'Could not post comment');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentComposerMenu, commentDraft]);

  const taskTableDataColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'TASK NAME',
        defaultWidth: '300px',
        className: 'align-top',
        render: (_, row) => {
          const initial = (row.name || 'T').trim().charAt(0).toUpperCase() || 'T';
          const commentCount = Number(commentCountsByTaskId[String(row.id)] || 0);
          return (
            <div className="flex min-w-0 max-w-full items-start gap-3">
              <Avatar fallback={initial} alt={row.name} size="sm" className="flex-shrink-0 bg-gray-600 text-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/tasks/${row.id}`)}
                    className="min-w-0 flex-1 text-left hover:text-orange-600"
                  >
                    <TableCellTitleSubtitle
                      title={row.name}
                      subtitle={`${row.description || 'No description'}${row.recurrenceSummary ? ` · ${row.recurrenceSummary}` : ''}`}
                    />
                  </button>
                  <TaskSubtasksToggleButton
                    row={row}
                    expanded={expandedSubtaskParents.has(row.id)}
                    onToggle={toggleSubtaskExpand}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      openCommentComposer(row.id, {
                        top: r.bottom + 8,
                        left: r.left,
                        triggerEl: e.currentTarget,
                      });
                    }}
                    className={`relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
                      commentCount > 0
                        ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-white hover:text-gray-700'
                    } ${commentComposerMenu?.id === row.id ? 'border-gray-300 bg-white text-gray-700' : ''} ${
                      commentCount > 0 ? '' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={`Comment on ${row.name || 'task'}`}
                    title="Comments"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {commentCount > 0 ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </div>
              </div>
            </div>
          );
        },
      },
    {
      key: 'project',
      visibilityKey: 'project',
      label: 'PROJECT',
      className: 'align-middle',
      headerClassName: 'align-middle',
      render: (_, row) =>
        row.project ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const slugOrId = row.projectSlug || row.projectId;
              if (slugOrId != null && slugOrId !== '') {
                router.push(`/projects/${slugOrId}`);
              }
            }}
            title={`Open project: ${row.project}`}
            className="inline-flex w-full min-w-[140px] max-w-[240px] items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 py-1.5 pl-2.5 pr-2 text-left text-xs font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-100/90"
          >
            <FolderKanban className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{row.project}</span>
            {row.projectSlug || row.projectId ? (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
            ) : null}
          </button>
        ) : (
          <span
            className="inline-flex w-full min-w-[140px] max-w-[240px] items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 py-1.5 px-2.5 text-xs font-medium text-gray-500"
            title="No project linked"
          >
            <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            No project
          </span>
        ),
    },
    {
      key: 'status',
      visibilityKey: 'status',
      label: 'STATUS',
      render: (_, row) => (
        <TableCellTaskStatusSelect
          status={row.strapiStatus}
          onStatusChange={(status) => updateTask(row, { status })}
          saving={savingId === row.id}
          options={PM_TASK_STATUS_OPTIONS}
          fillStyle="pm"
        />
      ),
    },
    {
      key: 'priority',
      visibilityKey: 'priority',
      label: 'PRIORITY',
      render: (_, row) => (
        <div onClick={(event) => event.stopPropagation()}>
          <Select
            value={row.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => updateTask(row, { priority })}
            disabled={savingId === row.id}
            {...pmTableSelectFillProps(row.priority, 'priority')}
            containerClassName="min-w-[130px]"
            placeholder="Priority"
          />
        </div>
      ),
    },
    {
      key: 'assigner',
      visibilityKey: 'assigner',
      label: 'ASSIGNER',
      render: (_, row) => {
        const assignerUser = row.assigner || assignerStrapiShape(row, users);
        const derived = ownerDisplayFromUser(assignerUser);
        const label = assignerTableLabel(row, assignerUser, derived);
        const empty = !label;
        return (
          <div
            className="flex min-w-[180px] max-w-[min(280px,22vw)] items-center gap-2.5 py-0.5"
            onClick={(event) => event.stopPropagation()}
            title={label || 'No assigner'}
          >
            <Avatar
              src={assignerUser?.avatar || undefined}
              fallback={empty ? '?' : derived.avatarFallback}
              alt={label || 'Assigner'}
              size="sm"
              className={`flex-shrink-0 text-white ${empty ? 'bg-gray-300 text-gray-600' : 'bg-gray-600'}`}
            />
            <span className={`min-w-0 flex-1 truncate text-xs font-semibold leading-tight ${empty ? 'text-gray-400' : 'text-gray-900'}`}>
              {empty ? '—' : label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'assignees',
      visibilityKey: 'assignees',
      label: 'ASSIGNEES',
      render: (_, row) => (
        <div className="min-w-[120px] py-0.5" onClick={(event) => event.stopPropagation()}>
          <TaskAssigneesPicker
            userIds={row.assigneeUserIds || []}
            assignees={row.assignees}
            users={users}
            onChange={(assigneeUserIds) => updateTask(row, { assigneeUserIds })}
            disabled={savingId === row.id}
            compact
          />
        </div>
      ),
    },
    {
      key: 'startDate',
      visibilityKey: 'startDate',
      label: 'START DATE',
      render: (_, row) => <TableCellCreated dateString={row.startDate} dateMode="calendar" />,
    },
    {
      key: 'dueDate',
      visibilityKey: 'dueDate',
      label: 'DUE DATE',
      render: (_, row) => (
        <div className={isTaskOverdue(row) ? '[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90' : ''}>
          <TableCellCreated dateString={row.dueDate} dateMode="calendar" />
        </div>
      ),
    },
    {
      key: 'tags',
      visibilityKey: 'tags',
      label: 'TAGS',
      render: (_, row) => {
        const raw = row.tags;
        const bits = Array.isArray(raw)
          ? raw.map((t) => (typeof t === 'string' ? t : t?.name ?? t?.label ?? '')).filter(Boolean)
          : [];
        const text = bits.length ? bits.join(', ') : '';
        return text ? (
          <span className="line-clamp-2 max-w-[200px] text-xs text-gray-700" title={text}>
            {text}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      key: 'description',
      visibilityKey: 'description',
      label: 'DESCRIPTION',
      render: (_, row) => {
        const d = (row.description || '').trim();
        return d ? (
          <span className="line-clamp-2 max-w-[220px] text-xs leading-snug text-gray-600" title={d}>
            {d}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      key: 'createdAt',
      visibilityKey: 'createdAt',
      label: 'CREATED',
      render: (_, row) => <TableCellCreated dateString={row.createdAt} />,
    },
    {
      key: 'updatedAt',
      visibilityKey: 'updatedAt',
      label: 'UPDATED',
      render: (_, row) => <TableCellCreated dateString={row.updatedAt} />,
    },
    {
      key: 'recurrence',
      visibilityKey: 'recurrence',
      label: 'REPEAT',
      render: (_, row) => (
        <span className="line-clamp-2 max-w-[180px] text-xs text-gray-700" title={row.recurrenceSummary || ''}>
          {row.recurrenceSummary?.trim() ? row.recurrenceSummary : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      resizable: false,
      defaultWidth: '220px',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap align-middle',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(event) => event.stopPropagation()}>
          <PMRowActions
            wrapperClassName="flex shrink-0 items-center"
            triggerClassName="inline-flex h-9 w-9 items-center justify-center rounded-md p-2 text-teal-600 transition hover:bg-teal-50"
            items={[
              { label: 'View', icon: Eye, onClick: () => router.push(`/tasks/${row.id}`) },
              { label: 'Edit', icon: Edit3, onClick: () => setTaskModal({ open: true, task: row, parentContext: null }) },
              { label: 'Copy link', icon: Copy, onClick: () => copyTaskLink(row) },
              { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteModal({ open: true, task: row }) },
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-emerald-600 hover:bg-emerald-50"
            title="Edit task"
            onClick={(event) => {
              event.stopPropagation();
              setTaskModal({ open: true, task: row, parentContext: null });
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-orange-600 hover:bg-orange-50"
            title="Copy link"
            onClick={(event) => {
              event.stopPropagation();
              copyTaskLink(row);
            }}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-red-600 hover:bg-red-50"
            title="Delete task"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteModal({ open: true, task: row });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    ],
    [
      router,
      users,
      savingId,
      updateTask,
      copyTaskLink,
      setTaskModal,
      setDeleteModal,
      commentCountsByTaskId,
      commentComposerMenu,
      openCommentComposer,
      expandedSubtaskParents,
      toggleSubtaskExpand,
    ]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(taskTableDataColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.name) out.push(byKey.name);
    for (const key of columnOrder) {
      const col = byKey[key];
      if (!col?.visibilityKey) continue;
      if (!columnVisibility[col.visibilityKey]) continue;
      out.push(col);
    }
    if (byKey.actions) out.push(byKey.actions);
    return taskViewMode === 'table' ? bindSortableColumns(out) : out;
  }, [columnOrder, columnVisibility, taskTableDataColumns, taskViewMode, bindSortableColumns]);

  const taskViewSwitcher = (
    <ViewToggleGroup aria-label="Task layout">
      <ViewToggleButton active={taskViewMode === 'list'} title="List (grouped by status)" onClick={() => handleTaskViewChange('list')}>
        <LayoutList className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
      <ViewToggleButton active={taskViewMode === 'table'} title="Table" onClick={() => handleTaskViewChange('table')}>
        <Table2 className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
      <ViewToggleButton active={taskViewMode === 'kanban'} title="Kanban" onClick={() => handleTaskViewChange('kanban')}>
        <Kanban className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
      <ViewToggleButton active={taskViewMode === 'timeline'} title="Timeline" onClick={() => handleTaskViewChange('timeline')}>
        <GanttChart className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
    </ViewToggleGroup>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PMPageHeader
        title="My Tasks"
        subtitle="Track and manage project work with CRM-style task records"
        breadcrumb={[{ label: 'PM', href: '/' }, { label: 'My Tasks', href: '/my-tasks' }]}
        showProfile
        showActions
        onAddClick={() => setTaskModal({ open: true, task: null, parentContext: null })}
        onFilterClick={() => setFilterOpen(true)}
        hasActiveFilters={Boolean(filters.priority || filters.projectId)}
        onImportClick={() => console.log('Import clicked')}
        onExportClick={() => console.log('Export clicked')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Tasks"
          value={taskKpis.total}
          subtitle={
            taskKpis.total === 0 ? 'No tasks' : `${taskKpis.total} ${taskKpis.total === 1 ? 'task' : 'tasks'}`
          }
          icon={ClipboardList}
          colorScheme="orange"
        />
        <KPICard
          title="To Do"
          value={taskKpis.todo}
          subtitle={taskKpis.todo === 0 ? 'No tasks' : `${taskKpis.todo} ${taskKpis.todo === 1 ? 'task' : 'tasks'}`}
          icon={ListTodo}
          colorScheme="orange"
        />
        <KPICard
          title="In Progress"
          value={taskKpis.inProgress}
          subtitle={
            taskKpis.inProgress === 0 ? 'No tasks' : `${taskKpis.inProgress} ${taskKpis.inProgress === 1 ? 'task' : 'tasks'}`
          }
          icon={PlayCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Completed"
          value={taskKpis.completed}
          subtitle={
            taskKpis.completed === 0 ? 'No tasks' : `${taskKpis.completed} ${taskKpis.completed === 1 ? 'task' : 'tasks'}`
          }
          icon={CheckCircle}
          colorScheme="orange"
        />
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabsWithBadges}
          activeTab={activeTab}
          onTabChange={(id) => {
            setActiveTab(id);
          }}
          afterTabs={taskViewSwitcher}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search tasks..."
          showAdd
          onAddClick={() => setTaskModal({ open: true, task: null, parentContext: null })}
          addTitle="Add Task"
          showFilter
          onFilterClick={() => setFilterOpen(true)}
          showColumnVisibility={taskViewMode === 'table'}
          onColumnVisibilityClick={() => {
            setSortPickerOpen(false);
            setColumnPickerOpen((open) => !open);
          }}
          columnVisibilityTitle="Show or hide columns"
          showSort={taskViewMode === 'table'}
          onSortClick={() => {
            setColumnPickerOpen(false);
            setSortPickerOpen((open) => !open);
          }}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort tasks (Shift+click headers for multi-sort)"
          variant="glass"
        />
        <PmTableSortDropdown
          open={sortPickerOpen && taskViewMode === 'table'}
          sortRules={sortRules}
          columnOptions={sortColumnOptions}
          onAddRule={addSortRule}
          onRemoveRule={removeSortRule}
          onSetDirection={setRuleDirection}
          onMoveRule={moveSortRule}
          onClear={clearSort}
          maxRules={sortMaxRules}
        />
        {columnPickerOpen ? (
          <div
            className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            role="dialog"
            aria-label="Table columns"
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Columns</p>
            <p className="mb-2 text-xs leading-snug text-gray-500">
              Task name and actions stay visible. Toggle fields below; drag the grip to reorder. An orange line shows where the row will land.
            </p>
            <ul
              className="max-h-[min(51vh,18.75rem)] space-y-0 overflow-y-auto pr-1"
              onDragLeave={handleColumnListDragLeave}
            >
              <li data-column-row className="relative flex items-stretch rounded-lg border border-transparent">
                <span className="flex w-8 shrink-0 items-center justify-center text-gray-300" aria-hidden title="Fixed order">
                  —
                </span>
                <div className="flex min-w-0 flex-1 items-center px-2 py-1 text-sm text-gray-700">
                  <span className="font-medium">Task name</span>
                  <span className="ml-1.5 text-xs text-gray-500">(always visible)</span>
                </div>
              </li>
              {columnOrder.map((key) => {
                const def = TOGGLEABLE_COLUMNS.find((c) => c.key === key);
                if (!def) return null;
                const showLineBefore =
                  columnDropIndicator?.targetKey === key && columnDropIndicator.place === 'before';
                const showLineAfter =
                  columnDropIndicator?.targetKey === key && columnDropIndicator.place === 'after';
                return (
                  <li
                    key={key}
                    data-column-row
                    className="relative flex items-stretch rounded-lg border border-transparent hover:border-gray-100"
                    onDragOver={(e) => handleColumnRowDragOver(e, key)}
                    onDrop={(e) => handleColumnDrop(e, key)}
                  >
                    {showLineBefore ? (
                      <div
                        className="pointer-events-none absolute left-1 right-2 top-0 z-10 h-[3px] -translate-y-1 rounded-full bg-orange-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      draggable
                      onDragStart={(e) => handleColumnDragStart(e, key)}
                      onDragEnd={handleColumnDragEnd}
                      className="flex w-8 shrink-0 cursor-grab items-center justify-center rounded-l-lg text-gray-400 active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600"
                      aria-label={`Drag to reorder ${def.label}`}
                    >
                      <GripVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-sm text-gray-800 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        checked={Boolean(columnVisibility[key])}
                        onChange={(e) => setColumnVisible(key, e.target.checked)}
                      />
                      <span>{def.label}</span>
                    </label>
                    {showLineAfter ? (
                      <div
                        className="pointer-events-none absolute bottom-0 left-1 right-2 z-10 h-[3px] translate-y-1 rounded-full bg-orange-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-sm font-medium text-gray-700"
                onClick={resetColumnTablePreferences}
              >
                Reset to default
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{sortedTableRootTasks.length}</span> result
        {sortedTableRootTasks.length !== 1 ? 's' : ''}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading tasks..." />
          </div>
        ) : taskViewMode === 'table' ? (
          <>
            <Table
              columns={visibleTableColumns}
              data={sortedTableRootTasks}
              keyField="id"
              variant="modernEmbedded"
              resizableColumns
              columnWidths={columnWidths}
              onColumnWidthsChange={handleColumnWidthsChange}
              onColumnResizeEnd={handleColumnResizeEnd}
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              renderAfterRow={(row) => (
                <TaskSubtasksAfterRow
                  row={row}
                  expanded={expandedSubtaskParents.has(row.id)}
                  colSpan={visibleTableColumns.length}
                  users={users}
                  savingId={savingId}
                  childrenByParentId={childrenByParentId}
                  onUpdateTask={updateTask}
                  onOpenTask={(subtask) => router.push(`/tasks/${subtask.id}`)}
                  onEditTask={(subtask) => setTaskModal({ open: true, task: subtask, parentContext: null })}
                  onCopyTaskLink={copyTaskLink}
                  onDeleteTask={(subtask) => setDeleteModal({ open: true, task: subtask })}
                  onAddSubtask={(r) =>
                    setTaskModal({
                      open: true,
                      task: null,
                      parentContext: {
                        id: r.id,
                        name: r.name,
                        projectId: r.projectId,
                      },
                    })
                  }
                />
              )}
            />
            {tableRootTasks.length === 0 && (
              <div className="border-t border-gray-200 p-12 text-center">
                <div className="mb-2 text-gray-400">
                  <CheckSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No tasks found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first task to get started'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <Button variant="primary" onClick={() => setTaskModal({ open: true, task: null, parentContext: null })} className="gap-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                )}
              </div>
            )}
          </>
        ) : taskViewMode === 'list' ? (
          <MyTasksListByStatus
            tasks={tableRootTasks}
            router={router}
            updateTask={updateTask}
            savingId={savingId}
          />
        ) : taskViewMode === 'kanban' ? (
          tableRootTasks.length === 0 ? (
            <div className="p-12 text-center">
              <CheckSquare className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700">No tasks found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery || activeTab !== 'all' ? 'Try adjusting your filters' : 'Create your first task to get started'}
              </p>
            </div>
          ) : (
            <MyTasksKanbanBoard
              tasks={tableRootTasks}
              router={router}
              updateTask={updateTask}
              activeTab={activeTab}
            />
          )
        ) : (
          <MyTasksTimelineView tasks={tableRootTasks} router={router} />
        )}
      </div>

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Tasks" size="md">
        <div className="space-y-5">
          <Select
            label="Priority"
            value={filters.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => setFilters((prev) => ({ ...prev, priority }))}
            placeholder="Any priority"
          />
          <Select
            label="Project"
            value={filters.projectId}
            options={projects.map((project) => ({ value: String(project.id), label: project.name }))}
            onChange={(projectId) => setFilters((prev) => ({ ...prev, projectId }))}
            placeholder="Any project"
          />
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button variant="outline" onClick={() => setFilters({ priority: '', projectId: '' })}>
              Clear
            </Button>
            <Button onClick={() => setFilterOpen(false)}>Apply Filters</Button>
          </div>
        </div>
      </Modal>

      <QuickCreateTaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, parentContext: null })}
        onSubmit={handleSaveTask}
        task={taskModal.task}
        parentContext={taskModal.parentContext}
        projects={projects}
        users={users}
        defaultAssignerId={getUserId() ? String(getUserId()) : ''}
        defaultStatus={activeTab === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'SCHEDULED'}
        saving={saving}
      />

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, task: null })} title="Delete Task" size="sm">
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Delete <span className="font-semibold text-gray-900">{deleteModal.task?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, task: null })} disabled={saving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTask} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {commentComposerMenu &&
        (() => {
          const taskRow =
            filteredTasks.find((t) => t.id === commentComposerMenu.id) ||
            allTasks.find((t) => t.id === commentComposerMenu.id);
          if (!taskRow) return null;
          const taskComments = Array.isArray(commentsByTask[taskRow.id]) ? commentsByTask[taskRow.id] : [];
          return (
            <TableRowActionMenuPortal
              open
              anchor={{
                top: commentComposerMenu.top,
                left: commentComposerMenu.left,
                triggerEl: commentComposerMenu.triggerEl,
              }}
              onClose={closeCommentComposer}
              menuClassName="w-[360px] rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl"
              menuWidthPx={360}
            >
              <div className="overflow-hidden rounded-2xl">
                <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Comments</p>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {taskComments.length}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{taskRow.name || 'Task'}</p>
                </div>

                <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
                  {commentLoadingTaskId === taskRow.id ? (
                    <div className="py-4">
                      <LoadingSpinner size="sm" message="Loading comments..." />
                    </div>
                  ) : taskComments.length > 0 ? (
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute bottom-3 left-3 top-3 w-px bg-gradient-to-b from-orange-400/90 via-orange-200 to-gray-200"
                        aria-hidden
                      />
                      <ul className="relative m-0 list-none space-y-3 p-0 pr-1" role="list">
                        {taskComments.map((row) => (
                          <li key={row.id} className="relative flex gap-3">
                            <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-0.5">
                              <Avatar
                                size="xs"
                                alt={actorDisplay(row.actor)}
                                fallback={actorDisplay(row.actor).charAt(0).toUpperCase()}
                                className="shadow-sm ring-2 ring-white"
                              />
                            </div>
                            <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                              <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <p className="text-xs font-semibold text-gray-800">{actorDisplay(row.actor)}</p>
                                <span className="text-xs text-gray-400">• {formatCommentTime(row.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                                <ChatMessageText text={commentTextFromMeta(row.meta)} />
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-xs text-gray-500">
                      No comments yet. Start the thread.
                    </p>
                  )}
                </div>

                <div className="space-y-2.5 border-t border-gray-100 bg-white px-4 py-3">
                  {commentError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{commentError}</p>
                  ) : null}

                  <Textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={2}
                    resize="none"
                    autoFocus
                    placeholder="Add a comment..."
                    className="rounded-xl border-orange-200 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-orange-500/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        closeCommentComposer();
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitTaskComment();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-400">Enter to post, Shift+Enter for new line</p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="muted" size="sm" onClick={closeCommentComposer}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={submitTaskComment}
                        disabled={!commentDraft.trim() || commentSubmitting}
                        aria-label={`Send comment for ${taskRow.name || 'task'}`}
                        className="inline-flex items-center gap-1.5"
                      >
                        <SendHorizontal className="h-3.5 w-3.5" />
                        <span>{commentSubmitting ? 'Posting...' : 'Post'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TableRowActionMenuPortal>
          );
        })()}
    </div>
  );
}
