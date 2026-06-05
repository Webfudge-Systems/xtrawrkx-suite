'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@webfudge/auth';
import {
  Avatar,
  Button,
  Card,
  KPICard,
  LoadingSpinner,
  Modal,
  Pagination,
  Select,
  Table,
  TableCellCreated,
  TableCellTitleSubtitle,
  TableRowActionMenuPortal,
  TabsWithActions,
  Textarea,
  ChatMessageText,
  ViewToggleButton,
  ViewToggleGroup,
  ownerDisplayFromUser,
  TableCellProjectStatusSelect,
  PROJECT_STATUS_OPTIONS,
} from '@webfudge/ui';
import { clsx } from 'clsx';
import {
  CheckCircle,
  Copy,
  Edit3,
  Eye,
  FolderOpen,
  Link2,
  ListTodo,
  MessageSquarePlus,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  Table2,
  SendHorizontal,
  Trash2,
  GripVertical,
  Kanban,
} from 'lucide-react';
import PMPageHeader from '../../components/PMPageHeader';
import { ProgressBar as PMProgress } from '@webfudge/ui';
import PMRowActions from '../../components/PMRowActions';
import ProjectsKanbanBoard from '../../components/ProjectsKanbanBoard';
import { fetchPmAssignableUsers } from '../../lib/api/messageService';
import {
  addProjectComment,
  fetchProjectCommentCounts,
  fetchProjectComments,
} from '../../lib/api/projectActivityService';
import projectService from '../../lib/api/projectService';
import { transformProject, transformUser } from '../../lib/api/dataTransformers';
import { canWritePM } from '../../lib/rbac';
import { canCreateProjectsInPm, canEditProjectInPm } from '../../lib/pmOrgRoles';
import { usePmTableSort } from '../../hooks/usePmTableSort';
import { TableSortDropdown as PmTableSortDropdown } from '@webfudge/ui';

const TABLE_SORT_STORAGE_KEY = 'pm.projects.tableSort';

const STATUS_TABS = [
  { id: 'all', label: 'All Projects' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PLANNING', label: 'Planning' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'ON_HOLD', label: 'On Hold' },
  { id: 'COMPLETED', label: 'Completed' },
];

const COLUMN_VISIBILITY_STORAGE_KEY = 'pm.projects.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'pm.projects.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'pm.projects.tableColumnWidths';

/** Default pixel widths for resizable table columns (keyed by column `key`). */
const DEFAULT_COLUMN_WIDTHS = {
  name: 280,
  status: 170,
  progress: 150,
  projectManager: 200,
  endDate: 130,
  startDate: 130,
  tasks: 110,
  team: 130,
  client: 170,
  budget: 120,
  description: 200,
  createdAt: 120,
  updatedAt: 120,
  actions: 220,
};

const MIN_COLUMN_WIDTHS = {
  actions: 220,
};

const TOGGLEABLE_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'progress', label: 'Progress %' },
  { key: 'projectManager', label: 'Owner' },
  { key: 'endDate', label: 'Due date' },
  { key: 'startDate', label: 'Start date' },
  { key: 'tasks', label: 'Tasks (done / total)' },
  { key: 'team', label: 'Team' },
  { key: 'client', label: 'Client' },
  { key: 'budget', label: 'Budget' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Last updated' },
];

const DEFAULT_ON_COLUMN_KEYS = new Set(['status', 'progress', 'projectManager', 'endDate']);

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

/** Same badge chrome as My Tasks / CRM status selects */
function isProjectOverdue(project) {
  if (!project?.endDate) return false;
  const due = new Date(project.endDate);
  if (Number.isNaN(due.getTime())) return false;
  return due < new Date() && project.strapiStatus !== 'COMPLETED' && project.strapiStatus !== 'CANCELLED';
}

function ownerLabel(user) {
  return user?.name || user?.username || user?.email || 'Unassigned';
}

/** Roster-first user shape for owner cell (matches assigner column on My Tasks). */
function projectManagerUserForRow(row, users) {
  const pmId = row.projectManager?.id;
  if (!pmId) return null;
  const fromRoster = users.find((x) => Number(x.id) === Number(pmId));
  if (fromRoster) return fromRoster;
  const pm = row.projectManager;
  if (!pm) return null;
  const parts = String(pm.name || '').trim().split(/\s+/);
  return {
    id: pm.id,
    name: pm.name,
    avatar: pm.avatar,
    firstName: pm.firstName || parts[0] || '',
    lastName: pm.lastName || parts.slice(1).join(' ') || '',
    email: pm.email || '',
    username: pm.name || pm.email || '',
  };
}

function ownerTableLabel(pmUser, derived) {
  const n = pmUser?.name?.trim();
  if (n) return n;
  if (pmUser?.email?.trim()) return pmUser.email.trim();
  const lbl = derived?.label;
  if (lbl && lbl !== 'Unassigned') return lbl;
  if (pmUser?.id != null) return `User ${pmUser.id}`;
  return '';
}

/** Company / client name → avatar initials (aligned with owner column UX). */
function clientNameInitials(name) {
  const n = String(name || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return n.slice(0, 2).toUpperCase() || '?';
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

function formatShortDate(iso) {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'No due date';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Overlapping avatar rings — same vocabulary as TaskAssigneesPicker */
const TEAM_STACK_RINGS = [
  'ring-2 ring-sky-400 ring-offset-[2px] ring-offset-white',
  'ring-2 ring-amber-400 ring-offset-[2px] ring-offset-white',
  'ring-2 ring-rose-400 ring-offset-[2px] ring-offset-white',
];

function TeamAvatarStack({ members, maxShown = 4, className }) {
  const list = Array.isArray(members) ? members.filter(Boolean) : [];
  if (list.length === 0) {
    return <span className={clsx('text-xs text-gray-400', className)}>—</span>;
  }
  const shown = list.slice(0, maxShown);
  const overflow = list.length - shown.length;
  const title = list
    .map((m) => m?.name || m?.username || m?.email)
    .filter(Boolean)
    .join(', ');
  return (
    <div className={clsx('flex items-center pt-0.5', className)} title={title}>
      {shown.map((m, i) => {
        const derived = ownerDisplayFromUser(m);
        return (
          <Avatar
            key={m.id ?? `t-${i}`}
            src={m.avatar || undefined}
            alt={derived.label}
            fallback={derived.avatarFallback}
            size="sm"
            className={clsx(
              'relative border-2 border-white bg-gray-600 text-white',
              TEAM_STACK_RINGS[i % TEAM_STACK_RINGS.length],
              i > 0 && '-ml-2'
            )}
            style={{ zIndex: 10 + i }}
          />
        );
      })}
      {overflow > 0 ? (
        <span
          className="-ml-2 inline-flex h-7 min-w-[1.625rem] items-center justify-center rounded-full border-2 border-white bg-gray-200 px-1 text-[10px] font-bold text-gray-800 ring-2 ring-gray-300 ring-offset-2 ring-offset-white"
          style={{ zIndex: 20 + shown.length }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const currentUserId = useMemo(() => {
    const u = authUser?.attributes || authUser;
    return u?.id ?? authUser?.id ?? null;
  }, [authUser]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [kpiRows, setKpiRows] = useState([]);
  const [kpiTotal, setKpiTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeView, setActiveView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ status: '', ownerId: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, project: null });
  const [savingId, setSavingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY }));
  const [columnOrder, setColumnOrder] = useState(() => [...REORDERABLE_COLUMN_KEYS]);
  const [columnWidths, setColumnWidths] = useState(() => ({ ...DEFAULT_COLUMN_WIDTHS }));
  const [columnDropIndicator, setColumnDropIndicator] = useState(null);
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsByProject, setCommentsByProject] = useState({});
  const [commentCountsByProjectId, setCommentCountsByProjectId] = useState({});
  const [commentLoadingProjectId, setCommentLoadingProjectId] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [ownerMenuProjectId, setOwnerMenuProjectId] = useState(null);
  const toolbarRef = useRef(null);
  const columnDragKeyRef = useRef(null);
  const columnDropIndicatorRef = useRef(null);
  const projectOwnerMenuRef = useRef(null);
  const pageSize = 12;

  const canShowAddProject = useMemo(() => canWritePM('projects') && canCreateProjectsInPm(), []);

  const {
    sortedData: sortedProjects,
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
    entity: 'project',
    storageKey: TABLE_SORT_STORAGE_KEY,
    data: projects,
  });

  const loadUsers = useCallback(async () => {
    try {
      const raw = await fetchPmAssignableUsers();
      setUsers(raw.map(transformUser).filter(Boolean));
    } catch (error) {
      console.error('Load users error:', error);
      setUsers([]);
    }
  }, []);

  const loadKpiData = useCallback(async () => {
    try {
      const res = await projectService.getAllProjects({ page: 1, pageSize: 500, sort: 'updatedAt:desc' });
      const rows = (res?.data || []).map(transformProject).filter(Boolean);
      setKpiRows(rows);
      setKpiTotal(res?.meta?.pagination?.total ?? rows.length);
    } catch (error) {
      console.error('Load KPI projects error:', error);
      setKpiRows([]);
      setKpiTotal(0);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize,
        sort: 'updatedAt:desc',
        search: searchQuery,
      };
      const status = filters.status || (activeTab !== 'all' ? activeTab : '');
      if (status) params.status = status;
      if (filters.ownerId) params.ownerId = filters.ownerId;
      const res = await projectService.getAllProjects(params);
      const transformed = (res?.data || []).map(transformProject).filter(Boolean);
      setProjects(transformed);
      setTotalProjects(res?.meta?.pagination?.total || transformed.length);
    } catch (error) {
      console.error('Load projects error:', error);
      setProjects([]);
      setTotalProjects(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, filters.ownerId, filters.status, searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const ids = projects.map((p) => p?.id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const counts = await fetchProjectCommentCounts({ projectIds: ids });
        if (!cancelled) setCommentCountsByProjectId((prev) => ({ ...prev, ...(counts || {}) }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projects]);

  useEffect(() => {
    if (ownerMenuProjectId == null) return;
    const fn = (e) => {
      if (projectOwnerMenuRef.current && !projectOwnerMenuRef.current.contains(e.target)) {
        setOwnerMenuProjectId(null);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ownerMenuProjectId]);

  useEffect(() => {
    loadKpiData();
  }, [loadKpiData]);

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

  const tabCounts = useMemo(() => {
    const counts = { all: kpiTotal };
    for (const project of kpiRows) {
      counts[project.strapiStatus] = (counts[project.strapiStatus] || 0) + 1;
    }
    return counts;
  }, [kpiRows, kpiTotal]);

  const projectKpis = useMemo(() => {
    const out = { total: kpiTotal, active: 0, inProgress: 0, completed: 0 };
    for (const p of kpiRows) {
      if (p.strapiStatus === 'ACTIVE') out.active += 1;
      if (p.strapiStatus === 'IN_PROGRESS') out.inProgress += 1;
      if (p.strapiStatus === 'COMPLETED') out.completed += 1;
    }
    return out;
  }, [kpiRows, kpiTotal]);

  const tabsWithBadges = STATUS_TABS.map((tab) => ({ ...tab, badge: tabCounts[tab.id] || 0 }));
  const totalPages = Math.max(1, Math.ceil(totalProjects / pageSize));
  const hasActiveFilters = Boolean(filters.status || filters.ownerId);

  const updateProjectStatus = useCallback(
    async (project, status) => {
      try {
        setSavingId(project.id);
        await projectService.updateProject(project.id, { status });
        await loadProjects();
        await loadKpiData();
      } catch (error) {
        console.error('Update project status error:', error);
      } finally {
        setSavingId(null);
      }
    },
    [loadProjects, loadKpiData]
  );

  const updateProjectManager = useCallback(
    async (project, userId) => {
      try {
        setSavingId(project.id);
        await projectService.updateProject(project.id, {
          projectManager: userId ? Number(userId) : null,
        });
        await loadProjects();
        await loadKpiData();
      } catch (error) {
        console.error('Update project manager error:', error);
      } finally {
        setSavingId(null);
      }
    },
    [loadProjects, loadKpiData]
  );

  const handleDelete = async () => {
    if (!deleteModal.project) return;
    try {
      setDeleting(true);
      await projectService.deleteProject(deleteModal.project.id);
      setDeleteModal({ open: false, project: null });
      await loadProjects();
      await loadKpiData();
    } catch (error) {
      console.error('Delete project error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const copyProjectLink = useCallback(async (project) => {
    const href = `${window.location.origin}/projects/${project.slug || project.id}`;
    await navigator.clipboard?.writeText(href);
  }, []);

  const openCommentComposer = useCallback(async (projectId, anchor) => {
    setCommentComposerMenu(anchor ? { id: projectId, ...anchor } : { id: projectId });
    setCommentDraft('');
    setCommentError('');
    setCommentLoadingProjectId(projectId);
    try {
      const res = await fetchProjectComments({ projectId, limit: 20 });
      setCommentsByProject((prev) => ({ ...prev, [projectId]: res?.data || [] }));
    } catch (e) {
      setCommentError(e?.message || 'Could not load comments');
      setCommentsByProject((prev) => ({ ...prev, [projectId]: prev[projectId] || [] }));
    } finally {
      setCommentLoadingProjectId(null);
    }
  }, []);

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft('');
    setCommentError('');
  }, []);

  const submitProjectComment = useCallback(async () => {
    const projectId = commentComposerMenu?.id;
    const text = commentDraft.trim();
    if (!projectId || !text) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await addProjectComment({ projectId, comment: text });
      const newComment = res?.data;
      if (newComment) {
        setCommentsByProject((prev) => ({
          ...prev,
          [projectId]: [newComment, ...(Array.isArray(prev[projectId]) ? prev[projectId] : [])],
        }));
      }
      setCommentCountsByProjectId((prev) => ({
        ...prev,
        [String(projectId)]: Math.max(
          1,
          (parseInt(prev[String(projectId)] || prev[projectId] || 0, 10) || 0) + 1
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
        label: 'PROJECT NAME',
        defaultWidth: '280px',
        className: 'align-top',
        render: (_, row) => {
          const initial = (row.name || 'P').trim().charAt(0).toUpperCase() || 'P';
          const commentCount = Number(commentCountsByProjectId[String(row.id)] || 0);
          return (
            <div className="flex min-w-0 max-w-full items-start gap-3">
              <Avatar fallback={initial} alt={row.name} size="sm" className="flex-shrink-0 bg-gray-600 text-white" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/${row.slug || row.id}`)}
                    className="min-w-0 flex-1 text-left hover:text-orange-600"
                  >
                    <TableCellTitleSubtitle
                      title={
                        <span className="inline-flex items-center gap-1.5">
                          {row.name}
                          {row.isPrivate && (
                            <Lock className="inline h-3 w-3 text-gray-400 shrink-0" title="Private project" />
                          )}
                        </span>
                      }
                      subtitle={row.description || row.clientName || 'No description'}
                    />
                  </button>
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
                    aria-label={`Comment on ${row.name || 'project'}`}
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
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, row) => {
          const canEditRow = canEditProjectInPm(row, currentUserId);
          return (
            <TableCellProjectStatusSelect
              status={row.strapiStatus}
              onStatusChange={(status) => updateProjectStatus(row, status)}
              saving={savingId === row.id}
              canEdit={canEditRow}
            />
          );
        },
      },
      {
        key: 'progress',
        visibilityKey: 'progress',
        label: 'PROGRESS %',
        render: (_, row) => <PMProgress value={row.progress} />,
      },
      {
        key: 'projectManager',
        visibilityKey: 'projectManager',
        label: 'OWNER',
        render: (_, row) => {
          const canEditRow = canEditProjectInPm(row, currentUserId);
          const pmUser = projectManagerUserForRow(row, users);
          const derived = ownerDisplayFromUser(pmUser);
          const label = ownerTableLabel(pmUser, derived);
          const empty = !label;
          const menuOpen = ownerMenuProjectId === row.id;
          return (
            <div
              ref={menuOpen ? projectOwnerMenuRef : undefined}
              className="relative min-w-[180px] max-w-[min(280px,22vw)] py-0.5"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                disabled={savingId === row.id || !canEditRow}
                onClick={() => setOwnerMenuProjectId((id) => (id === row.id ? null : row.id))}
                className="flex w-full min-w-0 items-center gap-2.5 rounded-lg text-left transition hover:bg-gray-50 disabled:opacity-45"
                title={canEditRow ? label || 'Choose owner' : 'Only admins or this project’s manager can change owner'}
              >
                <Avatar
                  src={pmUser?.avatar || undefined}
                  fallback={empty ? '?' : derived.avatarFallback}
                  alt={label || 'Owner'}
                  size="sm"
                  className={`flex-shrink-0 text-white ${empty ? 'bg-gray-300 text-gray-600' : 'bg-gray-600'}`}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-xs font-semibold leading-tight ${
                    empty ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {empty ? '—' : label}
                </span>
              </button>
              {menuOpen ? (
                <div
                  className="absolute left-0 top-full z-50 mt-1 max-h-60 w-[min(100%,16rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  role="listbox"
                  aria-label="Project owner"
                >
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium ${
                      !row.projectManager?.id ? 'bg-orange-50 text-orange-900' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setOwnerMenuProjectId(null);
                      updateProjectManager(row, '');
                    }}
                  >
                    Unassigned
                  </button>
                  {users.map((u) => {
                    const selected = Number(row.projectManager?.id) === Number(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
                          selected ? 'bg-orange-50 font-semibold text-orange-900' : 'text-gray-800 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setOwnerMenuProjectId(null);
                          updateProjectManager(row, String(u.id));
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate">{ownerLabel(u)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        key: 'endDate',
        visibilityKey: 'endDate',
        label: 'DUE DATE',
        render: (_, row) => (
          <div
            className={
              isProjectOverdue(row) ? '[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90' : ''
            }
          >
            <TableCellCreated dateString={row.endDate} dateMode="calendar" />
          </div>
        ),
      },
      {
        key: 'startDate',
        visibilityKey: 'startDate',
        label: 'START',
        render: (_, row) => <TableCellCreated dateString={row.startDate} dateMode="calendar" />,
      },
      {
        key: 'tasks',
        visibilityKey: 'tasks',
        label: 'TASKS',
        render: (_, row) => (
          <span className="text-xs font-semibold tabular-nums text-gray-800">
            {row.completedTasks ?? 0}/{row.totalTasks ?? 0}
          </span>
        ),
      },
      {
        key: 'team',
        visibilityKey: 'team',
        label: 'TEAM',
        render: (_, row) => (
          <div onClick={(event) => event.stopPropagation()}>
            <TeamAvatarStack members={row.teamMembers ?? row.team ?? []} maxShown={4} />
          </div>
        ),
      },
      {
        key: 'client',
        visibilityKey: 'client',
        label: 'CLIENT',
        render: (_, row) => {
          const label = row.clientName?.trim() || '';
          const empty = !label;
          const initials = clientNameInitials(label);
          return (
            <div
              className="flex min-w-0 max-w-[min(220px,24vw)] items-center gap-2.5 py-0.5"
              onClick={(event) => event.stopPropagation()}
            >
              <Avatar
                fallback={empty ? '?' : initials}
                alt={label || 'Client account'}
                size="sm"
                className={`flex-shrink-0 text-white ${empty ? 'bg-gray-300 text-gray-600' : 'bg-gray-600'}`}
              />
              <span
                className={`min-w-0 flex-1 truncate text-xs font-semibold leading-tight ${
                  empty ? 'text-gray-400' : 'text-gray-900'
                }`}
                title={empty ? 'No client linked to this project' : label}
              >
                {empty ? '—' : label}
              </span>
            </div>
          );
        },
      },
      {
        key: 'budget',
        visibilityKey: 'budget',
        label: 'BUDGET',
        render: (_, row) => {
          const b = row.budget;
          if (b == null || b === '') return <span className="text-xs text-gray-500">—</span>;
          const n = Number(b);
          const text = Number.isFinite(n) ? n.toLocaleString('en-IN') : String(b);
          return <span className="text-xs font-semibold tabular-nums text-gray-800">{text}</span>;
        },
      },
      {
        key: 'description',
        visibilityKey: 'description',
        label: 'DESCRIPTION',
        render: (_, row) => (
          <span className="line-clamp-2 max-w-[200px] text-xs text-gray-600" title={row.description || ''}>
            {row.description?.trim() || '—'}
          </span>
        ),
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
        key: 'actions',
        label: 'ACTIONS',
        resizable: false,
        className: 'whitespace-nowrap',
        render: (_, row) => {
          const canMutateProject = canEditProjectInPm(row, currentUserId);
          return (
          <div className="flex min-w-[220px] items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
            <PMRowActions
              wrapperClassName="flex shrink-0 items-center"
              triggerClassName="inline-flex h-9 w-9 items-center justify-center rounded-md p-2 text-teal-600 transition hover:bg-teal-50"
              items={[
                { label: 'View', icon: Eye, onClick: () => router.push(`/projects/${row.slug || row.id}`) },
                ...(canMutateProject
                  ? [
                      {
                        label: 'Edit',
                        icon: Edit3,
                        onClick: () => router.push(`/projects/${row.slug || row.id}?edit=1`),
                      },
                    ]
                  : []),
                { label: 'Copy link', icon: Copy, onClick: () => copyProjectLink(row) },
                ...(canMutateProject
                  ? [
                      {
                        label: 'Delete',
                        icon: Trash2,
                        danger: true,
                        onClick: () => setDeleteModal({ open: true, project: row }),
                      },
                    ]
                  : []),
              ]}
            />
            {canMutateProject ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-emerald-600 hover:bg-emerald-50"
              title="Edit project"
              onClick={(event) => {
                event.stopPropagation();
                router.push(`/projects/${row.slug || row.id}?edit=1`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="Copy link"
              onClick={(event) => {
                event.stopPropagation();
                copyProjectLink(row);
              }}
            >
              <Link2 className="h-4 w-4" />
            </Button>
            {canMutateProject ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete project"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteModal({ open: true, project: row });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            ) : null}
          </div>
          );
        },
      },
    ],
    [
      router,
      users,
      savingId,
      currentUserId,
      updateProjectStatus,
      updateProjectManager,
      copyProjectLink,
      commentCountsByProjectId,
      commentComposerMenu,
      openCommentComposer,
      ownerMenuProjectId,
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
    return activeView === 'list' ? bindSortableColumns(out) : out;
  }, [columnOrder, columnVisibility, taskTableDataColumns, activeView, bindSortableColumns]);

  const projectViewSwitcher = (
    <ViewToggleGroup aria-label="Project layout">
      <ViewToggleButton
        active={activeView === 'list'}
        title="Table"
        onClick={() => setActiveView('list')}
      >
        <Table2 className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
      <ViewToggleButton
        active={activeView === 'kanban'}
        title="Kanban"
        onClick={() => setActiveView('kanban')}
      >
        <Kanban className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
    </ViewToggleGroup>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PMPageHeader
        title="Projects"
        subtitle="Manage delivery work with CRM-style project records"
        breadcrumb={[{ label: 'PM', href: '/' }, { label: 'Projects', href: '/projects' }]}
        showProfile
        showActions
        onAddClick={canShowAddProject ? () => router.push('/projects/add') : undefined}
        onFilterClick={() => setFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onImportClick={() => console.log('Import clicked')}
        onExportClick={() => console.log('Export clicked')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Projects"
          value={projectKpis.total}
          subtitle={
            projectKpis.total === 0
              ? 'No projects'
              : `${projectKpis.total} ${projectKpis.total === 1 ? 'project' : 'projects'}`
          }
          icon={FolderOpen}
          colorScheme="orange"
        />
        <KPICard
          title="Active"
          value={projectKpis.active}
          subtitle={
            projectKpis.active === 0
              ? 'No projects'
              : `${projectKpis.active} ${projectKpis.active === 1 ? 'project' : 'projects'}`
          }
          icon={ListTodo}
          colorScheme="orange"
        />
        <KPICard
          title="In Progress"
          value={projectKpis.inProgress}
          subtitle={
            projectKpis.inProgress === 0
              ? 'No projects'
              : `${projectKpis.inProgress} ${projectKpis.inProgress === 1 ? 'project' : 'projects'}`
          }
          icon={PlayCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Completed"
          value={projectKpis.completed}
          subtitle={
            projectKpis.completed === 0
              ? 'No projects'
              : `${projectKpis.completed} ${projectKpis.completed === 1 ? 'project' : 'projects'}`
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
            setFilters((prev) => ({ ...prev, status: '' }));
            setCurrentPage(1);
          }}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search projects..."
          showAdd={canShowAddProject}
          onAddClick={() => router.push('/projects/add')}
          addTitle="Create Project"
          showFilter
          onFilterClick={() => setFilterOpen(true)}
          filterTitle={hasActiveFilters ? 'Filters active' : 'Filter projects'}
          afterTabs={projectViewSwitcher}
          showColumnVisibility={activeView === 'list'}
          onColumnVisibilityClick={() => {
            setSortPickerOpen(false);
            setColumnPickerOpen((open) => !open);
          }}
          columnVisibilityTitle="Show or hide columns"
          showSort={activeView === 'list'}
          onSortClick={() => {
            setColumnPickerOpen(false);
            setSortPickerOpen((open) => !open);
          }}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort projects (Shift+click headers for multi-sort)"
          variant="glass"
        />
        <PmTableSortDropdown
          open={sortPickerOpen && activeView === 'list'}
          sortRules={sortRules}
          columnOptions={sortColumnOptions}
          onAddRule={addSortRule}
          onRemoveRule={removeSortRule}
          onSetDirection={setRuleDirection}
          onMoveRule={moveSortRule}
          onClear={clearSort}
          maxRules={sortMaxRules}
        />
        {columnPickerOpen && activeView === 'list' ? (
          <div
            className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            role="dialog"
            aria-label="Table columns"
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Columns</p>
            <p className="mb-2 text-xs leading-snug text-gray-500">
              Project name and actions stay visible. Toggle fields below; drag the grip to reorder. An orange line
              shows where the row will land.
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
                  <span className="font-medium">Project name</span>
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
                        onChange={(event) => setColumnVisible(key, event.target.checked)}
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
        Showing <span className="font-semibold text-gray-900">{totalProjects}</span> result
        {totalProjects !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading projects..." />
          </div>
        </div>
      ) : activeView === 'kanban' ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50/60">
          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700">No projects found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery || activeTab !== 'all' || hasActiveFilters
                  ? 'Try adjusting your filters or search'
                  : 'Create your first project to get started'}
              </p>
            </div>
          ) : (
            <ProjectsKanbanBoard
              projects={projects}
              router={router}
              currentUserId={currentUserId}
              onStatusChange={updateProjectStatus}
            />
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <>
            <Table
              columns={visibleTableColumns}
              data={sortedProjects}
              keyField="id"
              variant="modern"
              resizableColumns
              columnWidths={columnWidths}
              onColumnWidthsChange={handleColumnWidthsChange}
              onColumnResizeEnd={handleColumnResizeEnd}
              onRowClick={(row) => router.push(`/projects/${row.slug || row.id}`)}
            />
            {projects.length === 0 ? (
              <div className="border-t border-gray-200 p-12 text-center">
                <div className="mb-2 text-gray-400">
                  <FolderOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No projects found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all' || hasActiveFilters
                    ? 'Try adjusting your filters or search'
                    : 'Create your first project to get started'}
                </p>
                {!searchQuery && activeTab === 'all' && !hasActiveFilters && canShowAddProject ? (
                  <Button variant="primary" onClick={() => router.push('/projects/add')} className="gap-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                ) : null}
              </div>
            ) : null}
            {totalPages > 1 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProjects}
                itemsPerPage={pageSize}
                onPageChange={setCurrentPage}
                className="border-t border-gray-200 bg-gray-50"
              />
            ) : null}
          </>
        </div>
      )}

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Projects" size="md">
        <div className="space-y-5">
          <Select
            label="Status"
            value={filters.status}
            options={PROJECT_STATUS_OPTIONS}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            placeholder="Any status"
          />
          <Select
            label="Owner"
            value={filters.ownerId}
            options={users.map((user) => ({ value: String(user.id), label: ownerLabel(user) }))}
            onChange={(value) => setFilters((prev) => ({ ...prev, ownerId: value }))}
            placeholder="Any owner"
          />
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
            <Button variant="outline" onClick={() => setFilters({ status: '', ownerId: '' })}>
              Clear
            </Button>
            <Button
              onClick={() => {
                setFilterOpen(false);
                setCurrentPage(1);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, project: null })}
        title="Delete Project"
        size="sm"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-700">
            Delete <span className="font-semibold text-gray-900">{deleteModal.project?.name}</span>? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, project: null })} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {commentComposerMenu &&
        (() => {
          const projectRow = projects.find((p) => p.id === commentComposerMenu.id);
          if (!projectRow) return null;
          const projectComments = Array.isArray(commentsByProject[projectRow.id])
            ? commentsByProject[projectRow.id]
            : [];
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
                      {projectComments.length}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{projectRow.name || 'Project'}</p>
                </div>

                <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
                  {commentLoadingProjectId === projectRow.id ? (
                    <div className="py-4">
                      <LoadingSpinner size="sm" message="Loading comments..." />
                    </div>
                  ) : projectComments.length > 0 ? (
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute bottom-3 left-3 top-3 w-px bg-gradient-to-b from-orange-400/90 via-orange-200 to-gray-200"
                        aria-hidden
                      />
                      <ul className="relative m-0 list-none space-y-3 p-0 pr-1" role="list">
                        {projectComments.map((cRow) => (
                          <li key={cRow.id} className="relative flex gap-3">
                            <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-0.5">
                              <Avatar
                                size="xs"
                                alt={actorDisplay(cRow.actor)}
                                fallback={actorDisplay(cRow.actor).charAt(0).toUpperCase()}
                                className="shadow-sm ring-2 ring-white"
                              />
                            </div>
                            <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                              <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <p className="text-xs font-semibold text-gray-800">{actorDisplay(cRow.actor)}</p>
                                <span className="text-xs text-gray-400">• {formatCommentTime(cRow.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                                <ChatMessageText text={commentTextFromMeta(cRow.meta)} />
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
                        submitProjectComment();
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
                        onClick={submitProjectComment}
                        disabled={!commentDraft.trim() || commentSubmitting}
                        aria-label={`Send comment for ${projectRow.name || 'project'}`}
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
