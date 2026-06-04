'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  GitBranch,
  Play,
  Pause,
  Trash2,
  Pencil,
  MoreHorizontal,
  Link2,
  ExternalLink,
  Zap,
  Building2,
  PhoneCall,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  KPICard,
  Table,
  TabsWithActions,
  LoadingSpinner,
  Modal,
  WorkflowStatusBadge,
  Pagination,
  TableCellCreated,
  TableCellDateOnly,
  TableRowActionMenuPortal,
} from '@webfudge/ui';
import CRMPageHeader from '../../components/CRMPageHeader';
import { getWorkflows, deleteWorkflow, publishWorkflow, pauseWorkflow } from './services/automationService';

// ─── Column visibility (localStorage) ───────────────────────────────────────

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.automations.tableColumnVisibility';

const TOGGLEABLE_COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'trigger', label: 'Trigger' },
  { key: 'version', label: 'Version' },
  { key: 'updatedAt', label: 'Last modified' },
  { key: 'createdAt', label: 'Created' },
  { key: 'runStats', label: 'Runs / last run' },
];

const DEFAULT_ON_KEYS = new Set(['status', 'trigger', 'version', 'updatedAt', 'createdAt']);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_KEYS.has(key);
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getTriggerLabel(workflow) {
  if (!workflow) return '—';
  const startNode = (workflow.nodes || []).find((n) => n.isStart || n.type === 'trigger');
  return startNode?.label || '—';
}

function workflowSearchHaystack(w) {
  const name = (w.name || '').toLowerCase();
  const desc = (w.description || '').toLowerCase();
  const trigger = getTriggerLabel(w).toLowerCase();
  return `${name} ${desc} ${trigger}`;
}

// ─── Automations list page ────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 15;

export default function AutomationsPage() {
  const router = useRouter();
  const initialFilters = useMemo(
    () => ({
      nameQuery: '',
      triggerQuery: '',
      dateRange: '',
    }),
    []
  );

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [moreActionMenu, setMoreActionMenu] = useState(null);

  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY }));
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const toolbarRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    getWorkflows()
      .then(setWorkflows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setColumnVisibility(loadColumnVisibility());
  }, []);

  useEffect(() => {
    if (!columnPickerOpen) return undefined;
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

  const resetColumnTablePreferences = useCallback(() => {
    const vis = { ...DEFAULT_COLUMN_VISIBILITY };
    setColumnVisibility(vis);
    try {
      window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(vis));
    } catch {
      /* ignore */
    }
  }, []);

  const counts = useMemo(
    () => ({
      total: workflows.length,
      active: workflows.filter((w) => w.status === 'active').length,
      draft: workflows.filter((w) => w.status === 'draft').length,
      paused: workflows.filter((w) => w.status === 'paused').length,
    }),
    [workflows]
  );

  const tabFiltered = useMemo(() => {
    if (activeTab === 'active') return workflows.filter((w) => w.status === 'active');
    if (activeTab === 'draft') return workflows.filter((w) => w.status === 'draft');
    if (activeTab === 'paused') return workflows.filter((w) => w.status === 'paused');
    return workflows;
  }, [workflows, activeTab]);

  const filteredWorkflows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tabFiltered.filter((w) => {
      if (!w) return false;
      if (q && !workflowSearchHaystack(w).includes(q)) return false;

      const name = (w.name || '').toLowerCase();
      const trigger = getTriggerLabel(w).toLowerCase();
      if (
        appliedFilters.nameQuery &&
        !name.includes(appliedFilters.nameQuery.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        appliedFilters.triggerQuery &&
        !trigger.includes(appliedFilters.triggerQuery.trim().toLowerCase())
      ) {
        return false;
      }

      const createdAt = w.createdAt ? new Date(w.createdAt) : null;
      const now = new Date();
      const daysSinceCreated =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;

      if (appliedFilters.dateRange) {
        if (
          daysSinceCreated == null ||
          !(
            (appliedFilters.dateRange === 'last7' && daysSinceCreated <= 7) ||
            (appliedFilters.dateRange === 'last30' && daysSinceCreated <= 30) ||
            (appliedFilters.dateRange === 'last90' && daysSinceCreated <= 90) ||
            (appliedFilters.dateRange === 'thisYear' &&
              createdAt &&
              createdAt.getFullYear() === now.getFullYear())
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tabFiltered, searchQuery, appliedFilters]);

  const totalPages = Math.ceil(filteredWorkflows.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  const handleExportFiltered = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(filteredWorkflows, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automations-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  }, [filteredWorkflows]);

  const handleEdit = useCallback((wf) => router.push(`/automations/${wf.id}`), [router]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteWorkflow(deleteTarget.id);
      setWorkflows((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = useCallback(async (wf, action) => {
    if (!wf?.id) return;
    try {
      const updated =
        action === 'publish' ? await publishWorkflow(wf.id) : await pauseWorkflow(wf.id);
      setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const tabItems = [
    { key: 'all', label: 'All Workflows', count: counts.total },
    { key: 'active', label: 'Active', count: counts.active },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'paused', label: 'Paused', count: counts.paused },
  ];

  const allTableColumns = useMemo(
    () => [
      {
        key: 'name',
        label: 'WORKFLOW',
        fixed: true,
        render: (_, row) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-orange-100 bg-orange-50">
              <GitBranch className="h-4 w-4 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{row?.name || 'Untitled'}</p>
              {row?.description ? (
                <p className="truncate text-xs text-gray-400">{row.description}</p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, row) =>
          row ? <WorkflowStatusBadge status={row.status || 'draft'} /> : null,
      },
      {
        key: 'trigger',
        visibilityKey: 'trigger',
        label: 'TRIGGER',
        render: (_, row) => (
          <span className="text-sm text-gray-600">{getTriggerLabel(row)}</span>
        ),
      },
      {
        key: 'version',
        visibilityKey: 'version',
        label: 'VERSION',
        render: (_, row) => (
          <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
            v{row?.version || 1}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'LAST MODIFIED',
        render: (_, row) => <TableCellDateOnly dateString={row?.updatedAt} />,
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, row) => <TableCellCreated dateString={row?.createdAt} />,
      },
      {
        key: 'runStats',
        visibilityKey: 'runStats',
        label: 'RUNS',
        render: (_, row) => {
          const runs = row?.runCount ?? 0;
          const last = row?.lastRunAt
            ? formatRelative(row.lastRunAt)
            : 'Never';
          return (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">{runs}</span>
              <span className="text-gray-400"> · </span>
              <span className="text-gray-500">{last}</span>
            </div>
          );
        },
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, row) => {
          if (!row) return null;
          const isActive = row.status === 'active';
          return (
            <div
              className="flex min-w-[200px] items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-teal-600 hover:bg-teal-50"
                title="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  setMoreActionMenu((prev) =>
                    prev?.id === row.id
                      ? null
                      : { id: row.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                  );
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-indigo-600 hover:bg-indigo-50"
                title={isActive ? 'Pause workflow' : 'Activate workflow'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus(row, isActive ? 'pause' : 'publish');
                }}
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-emerald-600 hover:bg-emerald-50"
                title="Edit workflow"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-red-600 hover:bg-red-50"
                title="Delete workflow"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleToggleStatus]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.name) out.push(byKey.name);
    for (const { key } of TOGGLEABLE_COLUMNS) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return out;
  }, [allTableColumns, columnVisibility]);

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Automations' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Automations"
        subtitle="Build, manage, and monitor your CRM automation workflows"
        breadcrumb={breadcrumb}
        showSearch={false}
        showActions
        hasActiveFilters={hasActiveFilters}
        onAddClick={() => router.push('/automations/new')}
        onFilterClick={openFilterModal}
        onImportClick={() => console.log('Import automations')}
        onExportClick={handleExportFiltered}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Workflows"
          value={counts.total}
          subtitle={
            counts.total === 0
              ? 'No workflows'
              : `${counts.total} ${counts.total === 1 ? 'workflow' : 'workflows'}`
          }
          icon={Building2}
          colorScheme="orange"
        />
        <KPICard
          title="Active"
          value={counts.active}
          subtitle={
            counts.active === 0
              ? 'None active'
              : `${counts.active} ${counts.active === 1 ? 'workflow' : 'workflows'}`
          }
          icon={CheckCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Draft"
          value={counts.draft}
          subtitle={
            counts.draft === 0
              ? 'No drafts'
              : `${counts.draft} ${counts.draft === 1 ? 'workflow' : 'workflows'}`
          }
          icon={PhoneCall}
          colorScheme="orange"
        />
        <KPICard
          title="Paused"
          value={counts.paused}
          subtitle={
            counts.paused === 0
              ? 'None paused'
              : `${counts.paused} ${counts.paused === 1 ? 'workflow' : 'workflows'}`
          }
          icon={XCircle}
          colorScheme="orange"
        />
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabItems.map((item) => ({
            key: item.key,
            label: item.label,
            badge: String(item.count),
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search workflows..."
          showAdd
          onAddClick={() => router.push('/automations/new')}
          addTitle="New Automation"
          showFilter
          onFilterClick={openFilterModal}
          showColumnVisibility
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show or hide columns"
          showExport
          onExportClick={handleExportFiltered}
          exportTitle="Export"
        />
        {columnPickerOpen ? (
          <div
            className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            role="dialog"
            aria-label="Table columns"
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Columns
            </p>
            <p className="mb-2 text-xs leading-snug text-gray-500">
              Workflow name and actions stay visible. Toggle optional columns below.
            </p>
            <ul className="max-h-[min(51vh,18.75rem)] space-y-0 overflow-y-auto pr-1">
              {TOGGLEABLE_COLUMNS.map(({ key, label }) => (
                <li
                  key={key}
                  className="flex items-stretch rounded-lg border border-transparent hover:border-gray-100"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      checked={Boolean(columnVisibility[key])}
                      onChange={(e) => setColumnVisible(key, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
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
        Showing <span className="font-semibold text-gray-900">{filteredWorkflows.length}</span>{' '}
        result{filteredWorkflows.length !== 1 ? 's' : ''}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading automations..." />
          </div>
        ) : (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedWorkflows}
              keyField="id"
              variant="modern"
              onRowClick={(row) => handleEdit(row)}
            />
            {paginatedWorkflows.length === 0 ? (
              <div className="border-t border-gray-200 p-12 text-center">
                <div className="mb-2 text-gray-400">
                  <Zap className="mx-auto mb-3 h-12 w-12 opacity-50" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-700">
                  {activeTab === 'all' ? 'No automations found' : `No ${activeTab} workflows`}
                </h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || hasActiveFilters || activeTab !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Create your first automation workflow to get started'}
                </p>
                {!searchQuery && !hasActiveFilters && activeTab === 'all' ? (
                  <Button variant="primary" onClick={() => router.push('/automations/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Automation
                  </Button>
                ) : null}
              </div>
            ) : null}
            {totalPages > 1 ? (
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredWorkflows.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <Card
        variant="outlined"
        className="border-dashed border-orange-200 bg-orange-50/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Workflow Templates</p>
              <p className="text-xs text-gray-500">
                Pre-built automations for common CRM workflows — coming soon
              </p>
            </div>
          </div>
          <span className="rounded-full border border-orange-200 bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-600">
            Coming Soon
          </span>
        </div>
      </Card>

      <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Workflows" size="lg">
        <div className="space-y-5">
          <p className="text-sm text-gray-600">Refine the workflow list (tabs and search still apply).</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Name contains</span>
              <input
                type="text"
                value={draftFilters.nameQuery}
                onChange={(e) => setDraftFilters((p) => ({ ...p, nameQuery: e.target.value }))}
                placeholder="Filter by workflow name"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Trigger contains</span>
              <input
                type="text"
                value={draftFilters.triggerQuery}
                onChange={(e) => setDraftFilters((p) => ({ ...p, triggerQuery: e.target.value }))}
                placeholder="Filter by trigger label"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
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
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={clearAllFilters}>
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="muted" onClick={() => setShowFilterModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Workflow">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Trash2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">This action cannot be undone</p>
              <p className="mt-1 text-sm text-red-600">
                The workflow <strong>&quot;{deleteTarget?.name || 'Untitled'}&quot;</strong> and all its
                configuration will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete Workflow'}
            </Button>
          </div>
        </div>
      </Modal>

      {moreActionMenu &&
        (() => {
          const wf = workflows.find((w) => w.id === moreActionMenu.id);
          if (!wf) return null;
          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/automations/${wf.id}`;
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
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  handleEdit(wf);
                }}
              >
                <Pencil className="h-4 w-4 shrink-0 text-teal-600" />
                Open builder
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-teal-600" />
                Open in new tab
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                    void navigator.clipboard.writeText(url);
                  }
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Copy link
              </button>
            </TableRowActionMenuPortal>
          );
        })()}
    </div>
  );
}
