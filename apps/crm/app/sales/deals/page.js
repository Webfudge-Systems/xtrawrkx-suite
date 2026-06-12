'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Briefcase,
  TrendingUp,
  Target,
  Users,
  MessageSquarePlus,
  SendHorizontal,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  ClipboardList,
  LayoutGrid,
  Building2,
  Mail,
  Kanban,
  Table2,
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
  Textarea,
  ChatMessageText,
  TableRowActionMenuPortal,
  TableCellOwner,
  TableCellCreated,
  TableCellDateOnly,
  TableCellText,
  TableCellOrangePill,
  TableCellSource,
  TableCellMultiline,
  TableCellPrimaryContact,
  TableCellTitleSubtitle,
  TableCellProbability,
  TableCellDealStageSelect,
  ViewToggleGroup,
  ViewToggleButton,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import { DealsKanbanBoard, DEAL_PIPELINE_STAGES } from '../../../components/DealsKanbanBoard';
import WonDealProjectModal from '../../../components/WonDealProjectModal';
import dealService from '../../../lib/api/dealService';
import { shouldPromptDeliveryProjectOnWon } from '../../../lib/wonDealProjectPrompt';
import crmActivityService from '../../../lib/api/crmActivityService';
import { contactDisplayName } from '../../../lib/dealFormOptions';
import { canEditCRMRecord, canManageCRM, canWriteCRM } from '../../../lib/rbac';
import { TableSortDropdown as CrmTableSortDropdown } from '@webfudge/ui';
import { useCrmTableSort } from '../../../hooks/useCrmTableSort';

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.deals.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.deals.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'crm.deals.tableColumnWidths';
const DEAL_VIEW_STORAGE_KEY = 'crm.deals.viewMode';
const TABLE_SORT_STORAGE_KEY = 'crm.deals.tableSort';

function readStoredDealView() {
  if (typeof window === 'undefined') return 'table';
  try {
    const v = window.localStorage.getItem(DEAL_VIEW_STORAGE_KEY);
    if (v === 'table' || v === 'kanban') return v;
  } catch {
    /* ignore */
  }
  return 'table';
}

const TOGGLEABLE_COLUMNS = [
  { key: 'company', label: 'Company' },
  { key: 'value', label: 'Value' },
  { key: 'stage', label: 'Stage' },
  { key: 'probability', label: 'Probability' },
  { key: 'expectedCloseDate', label: 'Close date' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'priority', label: 'Priority' },
  { key: 'createdAt', label: 'Created' },
  { key: 'source', label: 'Source' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'dealGroup', label: 'Deal group' },
  { key: 'primaryContact', label: 'Primary contact' },
  { key: 'notes', label: 'Notes' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'description', label: 'Description' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key).filter((k) => k !== 'company');

const DEFAULT_ON_KEYS = new Set([
  'company',
  'value',
  'stage',
  'probability',
  'expectedCloseDate',
  'assignedTo',
  'priority',
  'createdAt',
]);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_KEYS.has(key);
  return acc;
}, {});

function truncateText(text, max = 72) {
  if (text == null || text === '') return '';
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function formatCurrency(value) {
  if (value == null || value === '') return '₹0';
  const n = Number(value);
  if (Number.isNaN(n)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function dealInitial(deal) {
  const n = (deal?.name || 'D').trim();
  return n.charAt(0).toUpperCase();
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

function companyLine(deal) {
  return (
    deal.leadCompany?.companyName ||
    deal.leadCompany?.name ||
    deal.clientAccount?.companyName ||
    deal.clientAccount?.name ||
    '—'
  );
}

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [sortOpen, setSortOpen] = useState(false);

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stageSavingId, setStageSavingId] = useState(null);
  const [wonDealPrompt, setWonDealPrompt] = useState(null);
  const [wonDealBusy, setWonDealBusy] = useState(false);

  const [moreActionMenu, setMoreActionMenu] = useState(null);
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsByDeal, setCommentsByDeal] = useState({});
  const [commentCountsByDealId, setCommentCountsByDealId] = useState({});
  const [commentLoadingDealId, setCommentLoadingDealId] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const [dealViewMode, setDealViewMode] = useState(() =>
    typeof window === 'undefined' ? 'table' : readStoredDealView()
  );
  const canCreateDeals = canWriteCRM('deals');

  const persistDealView = useCallback((mode) => {
    try {
      window.localStorage.setItem(DEAL_VIEW_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const handleDealViewChange = useCallback((mode) => {
    setDealViewMode(mode);
    persistDealView(mode);
    if (mode === 'kanban') { setColumnPickerOpen(false); setSortOpen(false); }
  }, [persistDealView]);

  useEffect(() => {
    if (!columnPickerOpen && !sortOpen) return;
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false);
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [columnPickerOpen, sortOpen]);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dealService.getAll({
        sort: 'createdAt:desc',
        'pagination[pageSize]': 100,
        populate: ['leadCompany', 'clientAccount', 'contact', 'assignedTo', 'deliveryProject'],
      });
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const dealStats = {
    all: deals.length,
    prospect: deals.filter((d) => d.stage?.toLowerCase() === 'prospect').length,
    proposal: deals.filter((d) => d.stage?.toLowerCase() === 'proposal').length,
    negotiation: deals.filter((d) => d.stage?.toLowerCase() === 'negotiation').length,
    won: deals.filter((d) => d.stage?.toLowerCase() === 'won').length,
    lost: deals.filter((d) => d.stage?.toLowerCase() === 'lost').length,
  };

  const filteredDeals = deals.filter((deal) => {
    if (!deal) return false;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      deal.name?.toLowerCase().includes(q) ||
      deal.description?.toLowerCase().includes(q) ||
      deal.leadCompany?.companyName?.toLowerCase().includes(q) ||
      deal.leadCompany?.name?.toLowerCase().includes(q) ||
      deal.clientAccount?.companyName?.toLowerCase().includes(q) ||
      deal.clientAccount?.name?.toLowerCase().includes(q) ||
      deal.contact?.email?.toLowerCase().includes(q) ||
      contactDisplayName(deal.contact).toLowerCase().includes(q);
    const matchesTab = activeTab === 'all' || deal.stage?.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  // Multi-column sort (only applied in table view)
  const {
    sortRules,
    columnOptions: sortColumnOptions,
    sortedData: sortedDeals,
    hasActiveSort,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    bindSortableColumns,
  } = useCrmTableSort({ entity: 'deal', storageKey: TABLE_SORT_STORAGE_KEY, data: filteredDeals });

  const totalPages = Math.ceil(sortedDeals.length / itemsPerPage);
  const paginatedDeals = sortedDeals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    if (!paginatedDeals?.length) return;
    const ids = paginatedDeals.map((d) => d?.id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const counts = await crmActivityService.fetchDealCommentCounts({ dealIds: ids });
        if (cancelled) return;
        setCommentCountsByDealId((prev) => ({ ...prev, ...(counts || {}) }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paginatedDeals]);

  const handleStageChange = useCallback(
    async (dealId, newStage) => {
      const row = deals.find((d) => d.id === dealId);
      if (!canEditCRMRecord('deals', row)) {
        alert('You can only update deals assigned to you.');
        return;
      }
      if (row && shouldPromptDeliveryProjectOnWon(row, newStage)) {
        setWonDealPrompt({ dealId, dealName: row.name });
        return;
      }
      setStageSavingId(dealId);
      try {
        await dealService.update(dealId, { stage: newStage });
        setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
      } catch (e) {
        alert(e?.message || 'Failed to update stage');
      } finally {
        setStageSavingId(null);
      }
    },
    [deals]
  );

  const kanbanStageColumns = useMemo(() => {
    const by = {};
    DEAL_PIPELINE_STAGES.forEach(({ key }) => {
      by[key] = [];
    });
    filteredDeals.forEach((d) => {
      const k = (d.stage || 'discovery').toLowerCase();
      if (!by[k]) by[k] = [];
      by[k].push(d);
    });
    const cols = DEAL_PIPELINE_STAGES.map(({ key, label }) => ({ key, label, deals: by[key] || [] }));
    if (activeTab === 'all') return cols;
    return cols.filter((c) => c.key === activeTab);
  }, [filteredDeals, activeTab]);

  const handleKanbanDealMove = useCallback(
    async (dealIdStr, newStage) => {
      const row = deals.find((d) => String(d.id) === String(dealIdStr));
      if (!row) return;
      await handleStageChange(row.id, newStage);
    },
    [deals, handleStageChange]
  );

  const goToPipelineRoute = useCallback(() => {
    try {
      window.localStorage.setItem(DEAL_VIEW_STORAGE_KEY, 'kanban');
    } catch {
      /* ignore */
    }
    router.push('/sales/deals/pipeline');
  }, [router]);

  const dealsViewSwitcher = (
    <ViewToggleGroup aria-label="Deals layout">
      <ViewToggleButton active={dealViewMode === 'table'} title="Table view" onClick={() => handleDealViewChange('table')}>
        <Table2 className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
      <ViewToggleButton active={dealViewMode === 'kanban'} title="Kanban view" onClick={() => handleDealViewChange('kanban')}>
        <Kanban className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
    </ViewToggleGroup>
  );

  const closeWonDealPrompt = useCallback(() => {
    if (!wonDealBusy) setWonDealPrompt(null);
  }, [wonDealBusy]);

  const confirmWonSkipProject = useCallback(async () => {
    if (!wonDealPrompt) return;
    const { dealId } = wonDealPrompt;
    setWonDealBusy(true);
    setStageSavingId(dealId);
    try {
      await dealService.update(dealId, { stage: 'won' });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: 'won' } : d)));
      setWonDealPrompt(null);
    } catch (e) {
      alert(e?.message || 'Failed to update stage');
    } finally {
      setWonDealBusy(false);
      setStageSavingId(null);
    }
  }, [wonDealPrompt]);

  const confirmWonWithProject = useCallback(async () => {
    if (!wonDealPrompt) return;
    const { dealId } = wonDealPrompt;
    setWonDealBusy(true);
    setStageSavingId(dealId);
    try {
      await dealService.update(dealId, { stage: 'won' });
      let project = null;
      try {
        const pr = await dealService.createDeliveryProject(dealId);
        project = pr?.data ?? null;
      } catch (pe) {
        if (typeof window !== 'undefined') {
          window.alert(pe?.message || 'Deal is won, but the project could not be created.');
        }
      }
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId ? { ...d, stage: 'won', deliveryProject: project || d.deliveryProject } : d
        )
      );
      setWonDealPrompt(null);
    } catch (e) {
      alert(e?.message || 'Could not mark deal as won');
    } finally {
      setWonDealBusy(false);
      setStageSavingId(null);
    }
  }, [wonDealPrompt]);

  const openCommentComposer = useCallback(async (dealId, anchor) => {
    if (!canCreateDeals) return;
    setCommentComposerMenu(anchor ? { id: dealId, ...anchor } : { id: dealId });
    setCommentDraft('');
    setCommentError('');
    setCommentLoadingDealId(dealId);
    try {
      const res = await crmActivityService.fetchDealComments({ dealId, limit: 25 });
      setCommentsByDeal((prev) => ({ ...prev, [dealId]: res?.data || [] }));
    } catch (e) {
      setCommentError(e?.message || 'Could not load comments');
      setCommentsByDeal((prev) => ({ ...prev, [dealId]: prev[dealId] || [] }));
    } finally {
      setCommentLoadingDealId(null);
    }
  }, [canCreateDeals]);

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft('');
    setCommentError('');
  }, []);

  const submitComment = useCallback(async () => {
    const dealId = commentComposerMenu?.id;
    const text = commentDraft.trim();
    if (!dealId || !text) return;
    if (!canCreateDeals) {
      setCommentError('You only have read access to deals.');
      return;
    }
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res = await crmActivityService.addDealComment({ dealId, comment: text });
      const newComment = res?.data;
      if (newComment) {
        setCommentsByDeal((prev) => ({
          ...prev,
          [dealId]: [newComment, ...(Array.isArray(prev[dealId]) ? prev[dealId] : [])],
        }));
      }
      setCommentCountsByDealId((prev) => ({
        ...prev,
        [String(dealId)]: Math.max(1, (parseInt(prev[String(dealId)] || 0, 10) || 0) + 1),
      }));
      setCommentDraft('');
    } catch (e) {
      setCommentError(e?.message || 'Could not post comment');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentComposerMenu, commentDraft, canCreateDeals]);

  const handleDeleteDeal = async () => {
    if (!dealToDelete?.id) return;
    if (!canManageCRM('deals')) return;
    setDeleting(true);
    try {
      await dealService.delete(dealToDelete.id);
      setDeals((prev) => prev.filter((d) => d.id !== dealToDelete.id));
      setShowDeleteModal(false);
      setDealToDelete(null);
    } catch (e) {
      alert(e?.message || 'Failed to delete deal');
    } finally {
      setDeleting(false);
    }
  };

  const tabItems = [
    { key: 'all', label: 'All Deals', count: dealStats.all },
    { key: 'prospect', label: 'Prospect', count: dealStats.prospect },
    { key: 'proposal', label: 'Proposal', count: dealStats.proposal },
    { key: 'negotiation', label: 'Negotiation', count: dealStats.negotiation },
    { key: 'won', label: 'Won', count: dealStats.won },
    { key: 'lost', label: 'Lost', count: dealStats.lost },
  ];

  const allTableColumns = useMemo(
    () => [
      {
        key: 'deal',
        label: 'DEAL',
        fixed: true,
        render: (_, deal) => (
          <div className="flex w-full min-w-[240px] items-start gap-3">
            <Avatar fallback={dealInitial(deal)} alt={deal.name} size="sm" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <TableCellTitleSubtitle
                  title={deal.name || 'Unnamed deal'}
                  subtitle={deal.description ? truncateText(deal.description, 120) : '—'}
                  subtitleTitle={deal.description || ''}
                />
                {canCreateDeals ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      openCommentComposer(deal.id, {
                        top: r.bottom + 8,
                        left: r.left,
                        triggerEl: e.currentTarget,
                      });
                    }}
                    className={`relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
                      Number(commentCountsByDealId[String(deal.id)] || 0) > 0
                        ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white hover:border-gray-300'
                    } ${commentComposerMenu?.id === deal.id ? 'bg-white border-gray-300 text-gray-700' : ''} ${
                      Number(commentCountsByDealId[String(deal.id)] || 0) > 0 ? '' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={`Add comment for ${deal.name || 'deal'}`}
                    title="Add comment"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {Number(commentCountsByDealId[String(deal.id)] || 0) > 0 ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'company',
        visibilityKey: 'company',
        label: 'COMPANY',
        render: (_, deal) => <TableCellText value={companyLine(deal)} className="text-gray-800" />,
      },
      {
        key: 'value',
        visibilityKey: 'value',
        label: 'VALUE',
        render: (_, deal) => <TableCellText value={formatCurrency(deal.value || 0)} emphasized />,
      },
      {
        key: 'stage',
        visibilityKey: 'stage',
        label: 'STAGE',
        render: (_, deal) => (
          <TableCellDealStageSelect
            stage={deal.stage}
            onStageChange={(next) => handleStageChange(deal.id, next)}
            saving={stageSavingId === deal.id}
            canEdit={canEditCRMRecord('deals', deal)}
          />
        ),
      },
      {
        key: 'probability',
        visibilityKey: 'probability',
        label: 'PROBABILITY',
        render: (_, deal) => <TableCellProbability value={deal.probability} />,
      },
      {
        key: 'expectedCloseDate',
        visibilityKey: 'expectedCloseDate',
        label: 'CLOSE DATE',
        render: (_, deal) => <TableCellDateOnly dateString={deal.expectedCloseDate} />,
      },
      {
        key: 'assignedTo',
        visibilityKey: 'assignedTo',
        label: 'ASSIGNED TO',
        render: (_, deal) => <TableCellOwner user={deal.assignedTo} />,
      },
      {
        key: 'priority',
        visibilityKey: 'priority',
        label: 'PRIORITY',
        render: (_, deal) => <TableCellOrangePill value={deal.priority || 'medium'} />,
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, deal) => <TableCellCreated dateString={deal.createdAt} />,
      },
      {
        key: 'source',
        visibilityKey: 'source',
        label: 'SOURCE',
        render: (_, deal) => <TableCellSource value={deal.source} />,
      },
      {
        key: 'visibility',
        visibilityKey: 'visibility',
        label: 'VISIBILITY',
        render: (_, deal) => <TableCellText value={deal.visibility} nowrap capitalize />,
      },
      {
        key: 'dealGroup',
        visibilityKey: 'dealGroup',
        label: 'DEAL GROUP',
        render: (_, deal) => <TableCellText value={deal.dealGroup} maxWidthClass="max-w-[140px]" />,
      },
      {
        key: 'primaryContact',
        visibilityKey: 'primaryContact',
        label: 'PRIMARY CONTACT',
        render: (_, deal) => (
          <TableCellPrimaryContact
            email={
              deal.contact && typeof deal.contact === 'object' ? deal.contact.email : undefined
            }
            phone={
              deal.contact && typeof deal.contact === 'object' ? deal.contact.phone : undefined
            }
          />
        ),
      },
      {
        key: 'notes',
        visibilityKey: 'notes',
        label: 'NOTES',
        render: (_, deal) => <TableCellMultiline text={deal.notes} maxChars={100} maxWidthClass="max-w-[200px]" />,
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_, deal) => <TableCellDateOnly dateString={deal.updatedAt} />,
      },
      {
        key: 'description',
        visibilityKey: 'description',
        label: 'DESCRIPTION',
        render: (_, deal) => (
          <TableCellMultiline text={deal.description} maxChars={120} maxWidthClass="max-w-[240px]" />
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, deal) => {
          const canEditDeal = canEditCRMRecord('deals', deal);
          const canDeleteDeal = canManageCRM('deals');
          const contactEmail =
            deal.contact && typeof deal.contact === 'object' ? deal.contact.email : '';
          return (
            <div className="flex min-w-[220px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
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
                      prev?.id === deal.id
                        ? null
                        : { id: deal.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                    );
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              {canEditDeal ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-emerald-600 hover:bg-emerald-50"
                  title="Edit deal"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/sales/deals/${deal.id}/edit`);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                title="Send mail"
                disabled={!contactEmail}
                onClick={(e) => {
                  e.stopPropagation();
                  if (contactEmail) window.location.href = `mailto:${contactEmail}`;
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
              {canDeleteDeal ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-red-600 hover:bg-red-50"
                  title="Delete deal"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDealToDelete(deal);
                    setShowDeleteModal(true);
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
      commentComposerMenu,
      commentCountsByDealId,
      canCreateDeals,
      openCommentComposer,
      handleStageChange,
      stageSavingId,
    ]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.deal) out.push(byKey.deal);
    if (columnVisibility.company && byKey.company) out.push(byKey.company);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return bindSortableColumns(out);
  }, [allTableColumns, columnVisibility, columnOrder, bindSortableColumns]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Deals"
        subtitle="Manage opportunities and sales pipeline"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
          { label: 'Deals', href: '/sales/deals' },
        ]}
        showActions
        onAddClick={canCreateDeals ? () => router.push('/sales/deals/new') : undefined}
        onFilterClick={() => {}}
        onImportClick={() => {}}
        onExportClick={() => {}}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="New Deals"
          value={dealStats.all}
          subtitle={`${dealStats.all} ${dealStats.all === 1 ? 'deal' : 'deals'}`}
          icon={Briefcase}
          colorScheme="orange"
        />
        <KPICard
          title="Contacted Deals"
          value={dealStats.prospect}
          subtitle={`${dealStats.prospect} ${dealStats.prospect === 1 ? 'deal' : 'deals'}`}
          icon={Target}
          colorScheme="orange"
        />
        <KPICard
          title="Qualified Deals"
          value={dealStats.proposal}
          subtitle={
            dealStats.proposal === 0 ? 'No deals' : `${dealStats.proposal} ${dealStats.proposal === 1 ? 'deal' : 'deals'}`
          }
          icon={TrendingUp}
          colorScheme="orange"
        />
        <KPICard
          title="Lost Deals"
          value={dealStats.lost}
          subtitle={dealStats.lost === 0 ? 'No deals' : `${dealStats.lost} ${dealStats.lost === 1 ? 'deal' : 'deals'}`}
          icon={Users}
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
          afterTabs={dealsViewSwitcher}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search deals or companies…"
          showAdd={canCreateDeals}
          onAddClick={canCreateDeals ? () => router.push('/sales/deals/new') : undefined}
          addTitle="Add Deal"
          showFilter
          onFilterClick={() => {}}
          showColumnVisibility={dealViewMode === 'table'}
          onColumnVisibilityClick={() => { setColumnPickerOpen((o) => !o); setSortOpen(false); }}
          columnVisibilityTitle="Show or hide columns"
          showSort={dealViewMode === 'table'}
          onSortClick={() => { setSortOpen((o) => !o); setColumnPickerOpen(false); }}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort columns"
        />
        {dealViewMode === 'table' && (
          <CrmTableSortDropdown
            open={sortOpen}
            sortRules={sortRules}
            columnOptions={sortColumnOptions}
            onAddRule={addSortRule}
            onRemoveRule={removeSortRule}
            onSetDirection={setRuleDirection}
            onMoveRule={moveSortRule}
            onClear={clearSort}
          />
        )}
        <TableColumnPicker
          open={dealViewMode === 'table' && columnPickerOpen}
          description="Deal name and actions stay visible. Company stays first in the list. Drag column edges in the table to resize."
          pinnedRows={[{ key: 'company', label: 'Company' }]}
          reorderableRows={TOGGLEABLE_COLUMNS.filter((c) => c.key !== 'company')}
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
        Showing <span className="font-semibold text-gray-900">{sortedDeals.length}</span> result
        {sortedDeals.length !== 1 ? 's' : ''}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading deals..." />
          </div>
        ) : dealViewMode === 'table' ? (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedDeals}
              keyField="id"
              variant="modern"
              getRowClassName={() => 'group'}
              onRowClick={(row) => router.push(`/sales/deals/${row.id}`)}
              {...tableResizeProps}
            />
            {paginatedDeals.length === 0 && (
              <div className="border-t border-gray-200 p-12 text-center">
                <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-400 opacity-50" />
                <h3 className="mb-2 text-lg font-semibold text-gray-700">No deals found</h3>
                <p className="mb-4 text-sm text-gray-500">
                  {searchQuery || activeTab !== 'all'
                    ? 'Try adjusting your filters'
                    : canCreateDeals
                      ? 'Create your first deal to get started'
                      : 'No deals are available yet.'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {canCreateDeals ? (
                      <Button variant="primary" onClick={() => router.push('/sales/deals/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Deal
                      </Button>
                    ) : null}
                    <Button variant="outline" onClick={() => handleDealViewChange('kanban')}>
                      Board view
                    </Button>
                    <Button variant="outline" onClick={goToPipelineRoute}>
                      Full pipeline
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
                  totalItems={sortedDeals.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        ) : sortedDeals.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-400 opacity-50" />
            <h3 className="mb-2 text-lg font-semibold text-gray-700">No deals found</h3>
            <p className="mb-4 text-sm text-gray-500">
              {searchQuery || activeTab !== 'all'
                ? 'Try adjusting your filters'
                : canCreateDeals
                  ? 'Create your first deal to get started'
                  : 'No deals are available yet.'}
            </p>
            {!searchQuery && activeTab === 'all' && (
              <div className="flex flex-wrap justify-center gap-3">
                {canCreateDeals ? (
                  <Button variant="primary" onClick={() => router.push('/sales/deals/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deal
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => handleDealViewChange('table')}>
                  Table view
                </Button>
              </div>
            )}
          </div>
        ) : (
          <DealsKanbanBoard
            stageColumns={kanbanStageColumns}
            dealsLookup={deals}
            onMoveDeal={handleKanbanDealMove}
            getDealHref={(id) => `/sales/deals/${id}`}
            canMoveDeal={(deal) => canEditCRMRecord('deals', deal)}
          />
        )}
      </div>

      <Modal
        isOpen={showDeleteModal && !!dealToDelete}
        onClose={() => {
          if (deleting) return;
          setShowDeleteModal(false);
          setDealToDelete(null);
        }}
        title="Delete Deal"
        size="md"
        closeOnBackdrop={!deleting}
      >
        {dealToDelete ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-900">
                <span className="font-semibold">This action cannot be undone</span>
              </p>
            </div>
            <p className="text-sm text-gray-700">Are you sure you want to delete this deal?</p>
            <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="muted"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDealToDelete(null);
                }}
                className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleting}
                onClick={handleDeleteDeal}
                className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
              >
                {deleting ? 'Deleting…' : 'Delete Deal'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {moreActionMenu &&
        (() => {
          const deal = deals.find((d) => d.id === moreActionMenu.id);
          if (!deal) return null;
          const leadId =
            deal.leadCompany && typeof deal.leadCompany === 'object'
              ? deal.leadCompany.id ?? deal.leadCompany.documentId
              : null;
          const accountId =
            deal.clientAccount && typeof deal.clientAccount === 'object'
              ? deal.clientAccount.id ?? deal.clientAccount.documentId
              : null;
          return (
            <TableRowActionMenuPortal
              open
              anchor={{
                top: moreActionMenu.top,
                left: moreActionMenu.left,
                triggerEl: moreActionMenu.triggerEl,
              }}
              onClose={() => setMoreActionMenu(null)}
              menuClassName="w-52"
              menuWidthPx={208}
            >
              {leadId ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                  onClick={() => {
                    setMoreActionMenu(null);
                    router.push(`/sales/lead-companies/${leadId}`);
                  }}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
                  Open lead company
                </button>
              ) : null}
              {accountId ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                  onClick={() => {
                    setMoreActionMenu(null);
                    router.push(`/clients/accounts/${accountId}`);
                  }}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
                  Open client account
                </button>
              ) : null}
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                onClick={() => {
                  setMoreActionMenu(null);
                  router.push('/sales/deals/pipeline');
                }}
              >
                <LayoutGrid className="h-4 w-4 shrink-0 text-teal-600" />
                View pipeline
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                }}
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
                Create task
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  if (typeof window !== 'undefined') {
                    void navigator.clipboard?.writeText(`${window.location.origin}/sales/deals/${deal.id}`);
                  }
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Copy link
              </button>
            </TableRowActionMenuPortal>
          );
        })()}

      {commentComposerMenu &&
        (() => {
          const deal = deals.find((d) => d.id === commentComposerMenu.id);
          if (!deal) return null;
          const list = Array.isArray(commentsByDeal[deal.id]) ? commentsByDeal[deal.id] : [];
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
                      {list.length}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{deal.name || 'Deal'}</p>
                </div>
                <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
                  {commentLoadingDealId === deal.id ? (
                    <div className="py-4">
                      <LoadingSpinner size="sm" message="Loading comments…" />
                    </div>
                  ) : list.length > 0 ? (
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute bottom-3 left-3 top-3 w-px bg-gradient-to-b from-orange-400/90 via-orange-200 to-gray-200"
                        aria-hidden
                      />
                      <ul className="relative m-0 list-none space-y-3 p-0 pr-1" role="list">
                        {list.map((row) => (
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
                    placeholder="Add a comment…"
                    className="rounded-xl border-orange-200 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-orange-500/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        closeCommentComposer();
                      }
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitComment();
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
                        onClick={submitComment}
                        disabled={!commentDraft.trim() || commentSubmitting}
                        className="inline-flex items-center gap-1.5"
                      >
                        <SendHorizontal className="h-3.5 w-3.5" />
                        <span>{commentSubmitting ? 'Posting…' : 'Post'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TableRowActionMenuPortal>
          );
        })()}

      <WonDealProjectModal
        open={!!wonDealPrompt}
        dealName={wonDealPrompt?.dealName}
        busy={wonDealBusy}
        onClose={closeWonDealPrompt}
        onSkipProject={() => void confirmWonSkipProject()}
        onCreateProject={() => void confirmWonWithProject()}
      />
    </div>
  );
}
