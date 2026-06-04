'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
  LayoutGrid,
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Video,
  GripVertical,
} from 'lucide-react';
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
  TableRowActionMenuPortal,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import projectService from '../../../lib/api/projectService';

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.clientsProjects.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.clientsProjects.tableColumnOrder';

const TOGGLEABLE_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'projectManager', label: 'Project manager' },
  { key: 'clientAccount', label: 'Client account' },
  { key: 'startDate', label: 'Start date' },
  { key: 'endDate', label: 'End date' },
  { key: 'budget', label: 'Budget' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'sourceDeal', label: 'Source deal' },
  { key: 'description', label: 'Description' },
  { key: 'organization', label: 'Organization' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_ON_KEYS = new Set(['status', 'projectManager', 'clientAccount', 'startDate', 'endDate', 'budget', 'tasks']);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_KEYS.has(key);
  return acc;
}, {});

const ITEMS_PER_PAGE = 15;

const formatCurrency = (value) => {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
};

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

function accountLabel(acc) {
  if (!acc || typeof acc !== 'object') return '';
  return acc.companyName || acc.name || '';
}

function dealLabel(deal) {
  if (!deal || typeof deal !== 'object') return '';
  return deal.name || '';
}

function orgDisplayName(org) {
  if (!org) return '';
  if (typeof org === 'object') {
    return org.name || org.companyName || org.title || org.slug || `ID ${org.id ?? ''}`.trim() || '';
  }
  return String(org);
}

export default function ClientsProjectsPage() {
  const router = useRouter();
  const initialFilters = useMemo(
    () => ({
      status: '',
      managerId: '',
      clientQuery: '',
      dateRange: '',
      budgetRange: '',
    }),
    []
  );

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY }));
  const [columnOrder, setColumnOrder] = useState(() => [...REORDERABLE_COLUMN_KEYS]);
  const [columnDropIndicator, setColumnDropIndicator] = useState(null);
  const [moreActionMenu, setMoreActionMenu] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSaving, setCreateSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('PLANNING');
  const [editBudget, setEditBudget] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const columnDragKeyRef = useRef(null);
  const columnDropIndicatorRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    setColumnVisibility(loadColumnVisibility());
    setColumnOrder(loadColumnOrder());
  }, []);

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
    setColumnVisibility(vis);
    setColumnOrder(order);
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
    try {
      window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(vis));
      persistColumnOrder(order);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await projectService.getAll({
        sort: 'updatedAt:desc',
        'pagination[pageSize]': 500,
        populate: ['projectManager', 'clientAccount', 'tasks', 'sourceDeal', 'organization'],
      });
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const distinctStatuses = useMemo(() => {
    const set = new Set();
    for (const p of projects) {
      if (p?.status) set.add(String(p.status).toUpperCase());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [projects]);

  useEffect(() => {
    if (activeTab === 'all') return;
    if (!distinctStatuses.includes(activeTab)) {
      setActiveTab('all');
    }
  }, [activeTab, distinctStatuses]);

  const tabCounts = useMemo(() => {
    const c = { all: projects.length };
    for (const s of distinctStatuses) {
      c[s] = 0;
    }
    for (const p of projects) {
      if (!p?.status) continue;
      const key = String(p.status).toUpperCase();
      if (c[key] != null) c[key] += 1;
    }
    return c;
  }, [projects, distinctStatuses]);

  const projectStats = useMemo(() => {
    let planning = 0;
    let active = 0;
    let done = 0;
    for (const p of projects) {
      const s = (p?.status || 'PLANNING').toUpperCase();
      if (s === 'COMPLETED' || s === 'DONE' || s === 'CLOSED') done += 1;
      else if (s === 'PLANNING' || s === 'DRAFT') planning += 1;
      else active += 1;
    }
    return { planning, active, done, total: projects.length };
  }, [projects]);

  const managerFilterOptions = useMemo(() => {
    const map = new Map();
    for (const p of projects) {
      const u = p?.projectManager;
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
  }, [projects]);

  const statusFilterOptions = useMemo(
    () => distinctStatuses.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
    [distinctStatuses]
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (!project) return false;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (project.name || '').toLowerCase().includes(q) ||
        (project.slug || '').toLowerCase().includes(q) ||
        (project.description || '').toLowerCase().includes(q) ||
        accountLabel(project.clientAccount).toLowerCase().includes(q) ||
        dealLabel(project.sourceDeal).toLowerCase().includes(q);

      const st = (project.status || '').toUpperCase();
      const matchesTab = activeTab === 'all' || st === activeTab.toUpperCase();

      const managerId =
        project.projectManager && typeof project.projectManager === 'object'
          ? String(project.projectManager.id ?? project.projectManager.documentId ?? '')
          : '';

      const clientLower = accountLabel(project.clientAccount).toLowerCase();
      const createdAt = project.createdAt ? new Date(project.createdAt) : null;
      const now = new Date();
      const daysSinceCreated =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

      const budget = Number(project.budget || 0);

      const matchesAdvanced =
        (!appliedFilters.status || st === appliedFilters.status) &&
        (!appliedFilters.managerId || managerId === appliedFilters.managerId) &&
        (!appliedFilters.clientQuery || clientLower.includes(appliedFilters.clientQuery.toLowerCase())) &&
        (!appliedFilters.dateRange ||
          (daysSinceCreated != null &&
            ((appliedFilters.dateRange === 'last7' && daysSinceCreated <= 7) ||
              (appliedFilters.dateRange === 'last30' && daysSinceCreated <= 30) ||
              (appliedFilters.dateRange === 'last90' && daysSinceCreated <= 90) ||
              (appliedFilters.dateRange === 'thisYear' &&
                createdAt &&
                createdAt.getFullYear() === now.getFullYear())))) &&
        (!appliedFilters.budgetRange ||
          (appliedFilters.budgetRange === 'unset' && (!project.budget || budget === 0)) ||
          (appliedFilters.budgetRange === 'lt5l' && budget > 0 && budget < 500000) ||
          (appliedFilters.budgetRange === '5l_50l' && budget >= 500000 && budget <= 5000000) ||
          (appliedFilters.budgetRange === 'gt50l' && budget > 5000000));

      return matchesSearch && matchesTab && matchesAdvanced;
    });
  }, [projects, searchQuery, activeTab, appliedFilters]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const tabItems = useMemo(() => {
    const items = [{ key: 'all', label: 'All projects', count: tabCounts.all }];
    for (const s of distinctStatuses) {
      items.push({
        key: s,
        label: s.replace(/_/g, ' '),
        count: tabCounts[s] ?? 0,
      });
    }
    return items;
  }, [tabCounts, distinctStatuses]);

  const handleDeleteProject = async () => {
    if (!projectToDelete?.id) return;
    const loadingKey = `${projectToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      await projectService.delete(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (e) {
      console.error(e);
      alert('Failed to delete project.');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const openCreate = () => {
    setCreateName('');
    setCreateDescription('');
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const name = createName.trim();
    if (!name || createSaving) return;
    setCreateSaving(true);
    try {
      const payload = { name, status: 'PLANNING' };
      if (createDescription.trim()) payload.description = createDescription.trim();
      const { data } = await projectService.create(payload);
      if (data) setProjects((prev) => [data, ...prev]);
      setCreateOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not create project.');
    } finally {
      setCreateSaving(false);
    }
  };

  const openEdit = useCallback((project) => {
    setEditProject(project);
    setEditName(project.name || '');
    setEditDescription(project.description || '');
    setEditStatus((project.status || 'PLANNING').toUpperCase());
    setEditBudget(project.budget != null && project.budget !== '' ? String(project.budget) : '');
    const fmtDate = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    setEditStart(fmtDate(project.startDate));
    setEditEnd(fmtDate(project.endDate));
    setEditOpen(true);
  }, []);

  const submitEdit = async () => {
    if (!editProject?.id || editSaving) return;
    const name = editName.trim();
    if (!name) return;
    setEditSaving(true);
    try {
      const payload = {
        name,
        description: editDescription.trim() || null,
        status: editStatus,
      };
      const b = editBudget.trim();
      if (b === '') payload.budget = null;
      else {
        const n = Number(b);
        if (!Number.isNaN(n)) payload.budget = n;
      }
      payload.startDate = editStart ? new Date(editStart).toISOString() : null;
      payload.endDate = editEnd ? new Date(editEnd).toISOString() : null;
      const { data } = await projectService.update(editProject.id, payload);
      if (data) {
        setProjects((prev) => prev.map((p) => (p.id === editProject.id ? { ...p, ...data } : p)));
      } else {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === editProject.id
              ? {
                  ...p,
                  ...payload,
                }
              : p
          )
        );
      }
      setEditOpen(false);
      setEditProject(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Could not save project.');
    } finally {
      setEditSaving(false);
    }
  };

  const dealIdForRow = (project) => {
    const d = project?.sourceDeal;
    if (!d) return null;
    if (typeof d === 'object') return d.id ?? d.documentId;
    return d;
  };

  const accountIdForRow = (project) => {
    const a = project?.clientAccount;
    if (!a || typeof a !== 'object') return null;
    return a.id ?? a.documentId;
  };

  const taskCount = (project) => {
    const t = project?.tasks;
    if (Array.isArray(t)) return t.length;
    return 0;
  };

  const allTableColumns = useMemo(
    () => [
      {
        key: 'project',
        label: 'PROJECT',
        fixed: true,
        render: (_, project) => (
          <div className="flex min-w-[220px] items-start gap-3">
            <Avatar fallback={(project.name || 'P')[0]} alt={project.name} size="sm" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">{project.name || 'Untitled'}</div>
              <div className="truncate text-sm text-gray-500">{project.slug || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, project) => <TableCellOrangePill value={project.status} />,
      },
      {
        key: 'projectManager',
        visibilityKey: 'projectManager',
        label: 'MANAGER',
        render: (_, project) => <TableCellOwner user={project.projectManager} />,
      },
      {
        key: 'clientAccount',
        visibilityKey: 'clientAccount',
        label: 'CLIENT',
        render: (_, project) => {
          const id = accountIdForRow(project);
          const label = accountLabel(project.clientAccount);
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
        key: 'startDate',
        visibilityKey: 'startDate',
        label: 'START',
        render: (_, project) => <TableCellDateOnly dateString={project.startDate} />,
      },
      {
        key: 'endDate',
        visibilityKey: 'endDate',
        label: 'END',
        render: (_, project) => <TableCellDateOnly dateString={project.endDate} />,
      },
      {
        key: 'budget',
        visibilityKey: 'budget',
        label: 'BUDGET',
        render: (_, project) => <TableCellText value={formatCurrency(project.budget)} emphasized />,
      },
      {
        key: 'tasks',
        visibilityKey: 'tasks',
        label: 'TASKS',
        render: (_, project) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-gray-700">{taskCount(project)}</span>
        ),
      },
      {
        key: 'sourceDeal',
        visibilityKey: 'sourceDeal',
        label: 'SOURCE DEAL',
        render: (_, project) => {
          const id = dealIdForRow(project);
          const label = dealLabel(project.sourceDeal);
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
        key: 'description',
        visibilityKey: 'description',
        label: 'DESCRIPTION',
        render: (_, project) => (
          <TableCellMultiline text={project.description} maxChars={100} maxWidthClass="max-w-[220px]" />
        ),
      },
      {
        key: 'organization',
        visibilityKey: 'organization',
        label: 'ORG',
        render: (_, project) => <TableCellText value={orgDisplayName(project.organization)} />,
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, project) => <TableCellCreated dateString={project.createdAt} />,
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_, project) => <TableCellDateOnly dateString={project.updatedAt} />,
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, project) => {
          const did = dealIdForRow(project);
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
                      prev?.id === project.id
                        ? null
                        : { id: project.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
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
                title="Edit project"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(project);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-indigo-600 hover:bg-indigo-50"
                title="Board view"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/clients/projects/board');
                }}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                title="Open source deal"
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
                title="Delete project"
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete(project);
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
    if (byKey.project) out.push(byKey.project);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return out;
  }, [allTableColumns, columnVisibility, columnOrder]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Projects"
        subtitle="Delivery projects for client work"
        breadcrumb={[
          { label: 'Clients', href: '/clients' },
          { label: 'Projects', href: '/clients/projects' },
        ]}
        showActions
        hasActiveFilters={hasActiveFilters}
        onAddClick={openCreate}
        onFilterClick={openFilterModal}
        onImportClick={() => console.log('Import projects')}
        onExportClick={() => console.log('Export projects')}
      >
        <Button variant="outline" type="button" onClick={() => router.push('/clients/projects/board')}>
          Board view
        </Button>
      </CRMPageHeader>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total projects"
          value={projectStats.total}
          subtitle="In your organization"
          icon={FolderKanban}
          colorScheme="orange"
        />
        <KPICard
          title="Planning / draft"
          value={projectStats.planning}
          subtitle="Early stage"
          icon={Clock}
          colorScheme="orange"
        />
        <KPICard
          title="Active"
          value={projectStats.active}
          subtitle="In motion"
          icon={AlertCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Completed"
          value={projectStats.done}
          subtitle="Done / closed"
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
          onTabChange={(key) => setActiveTab(key)}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search projects..."
          showAdd
          onAddClick={openCreate}
          addTitle="Add project"
          showFilter
          onFilterClick={openFilterModal}
          showColumnVisibility
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show or hide columns"
          showExport
          onExportClick={() => console.log('Export projects')}
          exportTitle="Export"
        />
        {columnPickerOpen && (
          <div
            className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            role="dialog"
            aria-label="Table columns"
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Columns</p>
            <p className="mb-2 text-xs leading-snug text-gray-500">
              Project name and actions stay visible. Drag the grip to reorder columns.
            </p>
            <ul
              className="max-h-[min(51vh,18.75rem)] space-y-0 overflow-y-auto pr-1"
              onDragLeave={handleColumnListDragLeave}
            >
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
        )}
      </div>

      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> result
        {filteredProjects.length !== 1 ? 's' : ''}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading projects..." />
          </div>
        ) : (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedProjects}
              keyField="id"
              variant="modern"
            />
            {paginatedProjects.length === 0 && (
              <div className="border-t border-gray-200 p-12 text-center">
                <FolderKanban className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No projects found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all' || hasActiveFilters
                    ? 'Try adjusting search or filters'
                    : 'Create a project or add one from a won deal'}
                </p>
                {!searchQuery && activeTab === 'all' && !hasActiveFilters && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button variant="primary" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add project
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/clients/projects/board')}>
                      Open board
                    </Button>
                  </div>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredProjects.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showDeleteModal && !!projectToDelete}
        onClose={() => {
          if (projectToDelete && loadingActions[`${projectToDelete.id}-delete`]) return;
          setShowDeleteModal(false);
          setProjectToDelete(null);
        }}
        title="Delete Project"
        size="md"
        closeOnBackdrop={!(projectToDelete && loadingActions[`${projectToDelete.id}-delete`])}
      >
        {projectToDelete ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-900">
                <span className="font-semibold">This action cannot be undone</span>
              </p>
            </div>
            <p className="text-sm text-gray-700">Are you sure you want to delete this project?</p>
            <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="muted"
                disabled={!!loadingActions[`${projectToDelete.id}-delete`]}
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteProject}
                disabled={!!loadingActions[`${projectToDelete.id}-delete`]}
                className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
              >
                {loadingActions[`${projectToDelete.id}-delete`] ? 'Deleting…' : 'Delete Project'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => !createSaving && setCreateOpen(false)} title="New project" size="md">
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              placeholder="Project name"
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

      <Modal isOpen={editOpen && !!editProject} onClose={() => !editSaving && setEditOpen(false)} title="Edit project" size="lg">
        {editProject ? (
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
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <input
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="e.g. PLANNING, ACTIVE"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Budget (INR)</span>
                <input
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Optional"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">Start date</span>
                <input
                  type="date"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-gray-700">End date</span>
                <input
                  type="date"
                  value={editEnd}
                  onChange={(e) => setEditEnd(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </label>
            </div>
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

      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter projects" size="xl">
        <div className="space-y-5">
          <p className="text-sm text-gray-600">Refine projects by status, manager, client, dates, and budget</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((p) => ({ ...p, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Any status</option>
                {statusFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Project manager</span>
              <select
                value={draftFilters.managerId}
                onChange={(e) => setDraftFilters((p) => ({ ...p, managerId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Anyone</option>
                {managerFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Client name contains</span>
              <input
                value={draftFilters.clientQuery}
                onChange={(e) => setDraftFilters((p) => ({ ...p, clientQuery: e.target.value }))}
                placeholder="Filter by client account…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Created</span>
              <select
                value={draftFilters.dateRange}
                onChange={(e) => setDraftFilters((p) => ({ ...p, dateRange: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Any time</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="thisYear">This year</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Budget</span>
              <select
                value={draftFilters.budgetRange}
                onChange={(e) => setDraftFilters((p) => ({ ...p, budgetRange: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Any</option>
                <option value="unset">Not set / zero</option>
                <option value="lt5l">Under ₹5 lakh</option>
                <option value="5l_50l">₹5 lakh – ₹50 lakh</option>
                <option value="gt50l">Above ₹50 lakh</option>
              </select>
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
          const row = projects.find((p) => p.id === moreActionMenu.id);
          if (!row) return null;
          const did = dealIdForRow(row);
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
                  console.log('Create meet for project', row.id);
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
                  router.push('/clients/projects/board');
                }}
              >
                <LayoutGrid className="h-4 w-4 shrink-0 text-teal-600" />
                Open board
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:opacity-40"
                disabled={!did}
                onClick={() => {
                  setMoreActionMenu(null);
                  if (did) router.push(`/sales/deals/${did}`);
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Open source deal
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  void navigator.clipboard.writeText(`${window.location.origin}/clients/projects`);
                }}
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
                Copy projects page link
              </button>
            </TableRowActionMenuPortal>
          );
        })()}
    </div>
  );
}
