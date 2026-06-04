'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Mail,
  Phone,
  PhoneCall,
  Building2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Pencil,
  Video,
  ClipboardList,
  Link2,
  Trash2,
  UserPlus,
  MessageSquarePlus,
  SendHorizontal,
  Globe,
  MapPin,
  GripVertical,
  Calendar,
} from 'lucide-react';
import {
  Button,
  Card,
  Table,
  Pagination,
  Avatar,
  LoadingSpinner,
  TabsWithActions,
  KPICard,
  Modal,
  Textarea,
  Input,
  ChatMessageText,
  TableCellCreated,
  TableCellDateOnly,
  TableCellOwner,
  TableCellText,
  TableCellOrangePill,
  TableCellSource,
  TableCellMultiline,
  TableRowActionMenuPortal,
  toDateInputValue,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import { TableCellLeadStatusSelect } from '@webfudge/ui';
import { LeadNextConnectCell } from '../../../components/LeadNextConnectCell';
import { TableSortDropdown as CrmTableSortDropdown } from '@webfudge/ui';
import { useCrmTableSort } from '../../../hooks/useCrmTableSort';
import leadCompanyService from '../../../lib/api/leadCompanyService';
import crmActivityService from '../../../lib/api/crmActivityService';
import { canEditCRMRecord, canManageCRM } from '../../../lib/rbac';
import { commentTextFromMeta } from '../../../lib/leadCompanyComments';

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.leadCompanies.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.leadCompanies.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'crm.leadCompanies.tableColumnWidths';
const TABLE_SORT_STORAGE_KEY = 'crm.leadCompanies.tableSort';

/** Default pixel widths for resizable table columns (keyed by column `key`). */
const DEFAULT_COLUMN_WIDTHS = {
  company: 300,
  nextConnectDate: 190,
  primaryContact: 260,
  status: 170,
  source: 120,
  segment: 120,
  dealValue: 120,
  contactsCount: 110,
  assignedTo: 180,
  createdAt: 150,
  updatedAt: 130,
  industry: 140,
  type: 140,
  website: 160,
  companyPhone: 140,
  companyEmail: 180,
  address: 200,
  city: 120,
  state: 120,
  country: 120,
  zipCode: 100,
  employees: 120,
  founded: 100,
  description: 200,
  linkedIn: 100,
  twitter: 120,
  score: 90,
  healthScore: 100,
  notes: 180,
  organization: 160,
  actions: 220,
};

/** Enforced minimums when loading saved widths (e.g. after layout updates). */
const MIN_COLUMN_WIDTHS = {
  company: 260,
  nextConnectDate: 110,
  primaryContact: 220,
  status: 160,
  actions: 200,
};

/** Toggleable column keys and default visibility (extra fields off until user enables them). */
const TOGGLEABLE_COLUMNS = [
  { key: 'primaryContact', label: 'Primary contact' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'segment', label: 'Segment' },
  { key: 'dealValue', label: 'Deal value' },
  { key: 'contactsCount', label: 'Contacts count' },
  { key: 'assignedTo', label: 'Assigned to' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'industry', label: 'Industry' },
  { key: 'type', label: 'Type' },
  { key: 'website', label: 'Website' },
  { key: 'companyPhone', label: 'Company phone' },
  { key: 'companyEmail', label: 'Company email' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'zipCode', label: 'ZIP / postal' },
  { key: 'employees', label: 'Employees' },
  { key: 'founded', label: 'Founded' },
  { key: 'description', label: 'Description' },
  { key: 'linkedIn', label: 'LinkedIn' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'score', label: 'Score' },
  { key: 'healthScore', label: 'Health score' },
  { key: 'notes', label: 'Notes' },
  { key: 'organization', label: 'Organization' },
];

/** Keys that appear after primary contact in the table; primary contact + company + actions stay fixed. */
const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key).filter((k) => k !== 'primaryContact');

const DEFAULT_ON_KEYS = new Set([
  'primaryContact',
  'status',
  'source',
  'dealValue',
  'contactsCount',
  'assignedTo',
  'createdAt',
]);

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

function orgDisplayName(org) {
  if (!org) return '—';
  if (typeof org === 'object') {
    return org.name || org.companyName || org.title || org.slug || `ID ${org.id ?? ''}`.trim() || '—';
  }
  return String(org);
}

function actorDisplay(actor) {
  if (!actor || typeof actor !== 'object') return 'Unknown user';
  if (actor.username) return actor.username;
  if (actor.email) return actor.email;
  if (actor.id != null) return `User ${actor.id}`;
  return 'Unknown user';
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

// Utility function to format currency
const formatCurrency = (value) => {
  if (!value) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

export default function LeadCompaniesPage() {
  const initialFilters = useMemo(
    () => ({
      status: '',
      source: '',
      type: '',
      assignedToId: '',
      companyQuery: '',
      dateRange: '',
      valueRange: '',
    }),
    []
  );
  const router = useRouter();
  const [leadCompanies, setLeadCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [companyToConvert, setCompanyToConvert] = useState(null);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [loadingActions, setLoadingActions] = useState({});
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY }));
  const [columnOrder, setColumnOrder] = useState(() => [...REORDERABLE_COLUMN_KEYS]);
  const [columnWidths, setColumnWidths] = useState(() => ({ ...DEFAULT_COLUMN_WIDTHS }));
  const [columnDropIndicator, setColumnDropIndicator] = useState(null);
  const [moreActionMenu, setMoreActionMenu] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [commentComposerMenu, setCommentComposerMenu] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsByCompany, setCommentsByCompany] = useState({});
  const [nextConnectReasonsByCompany, setNextConnectReasonsByCompany] = useState({});
  const [commentCountsByCompanyId, setCommentCountsByCompanyId] = useState({});
  const [nextConnectReasonCountsByCompanyId, setNextConnectReasonCountsByCompanyId] = useState({});
  const [commentLoadingCompanyId, setCommentLoadingCompanyId] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [nextConnectDraft, setNextConnectDraft] = useState('');
  const [nextConnectSaving, setNextConnectSaving] = useState(false);
  const columnDragKeyRef = useRef(null);
  const columnDropIndicatorRef = useRef(null);
  const toolbarRef = useRef(null);
  const itemsPerPage = 15;

  useEffect(() => {
    setColumnVisibility(loadColumnVisibility());
    setColumnOrder(loadColumnOrder());
    const widths = loadColumnWidths();
    setColumnWidths(widths);
    persistColumnWidths(widths);
  }, []);

  const handleColumnResizeEnd = useCallback((next) => {
    persistColumnWidths(next);
  }, []);

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
    const fromKey =
      columnDragKeyRef.current || e.dataTransfer.getData('text/plain');
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
    const fromKey =
      columnDragKeyRef.current || e.dataTransfer.getData('text/plain');
    const hint = columnDropIndicatorRef.current;
    const place =
      hint?.targetKey === targetKey ? hint.place : 'before';
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

  const fetchLeadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadCompanyService.getAll({
        sort: 'createdAt:desc',
        'pagination[pageSize]': 100,
        populate: ['assignedTo', 'organization', 'contacts', 'convertedAccount'],
        mergeContactsFromContactsApi: true,
      });
      setLeadCompanies(response.data || []);
    } catch (err) {
      console.error('Error fetching lead companies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await leadCompanyService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeadCompanies();
    fetchStats();
  }, [fetchLeadCompanies, fetchStats]);

  // Calculate statistics from visible lead rows to avoid stale server-side aggregates.
  const leadStats = useMemo(() => {
    const out = { new: 0, contacted: 0, qualified: 0, lost: 0 };
    for (const c of leadCompanies) {
      if (!c) continue;
      const status = (c.status || '').toString().toUpperCase();
      if (status === 'NEW') out.new += 1;
      else if (status === 'CONTACTED') out.contacted += 1;
      else if (status === 'QUALIFIED') out.qualified += 1;
      else if (status === 'LOST') out.lost += 1;
    }
    return out;
  }, [leadCompanies]);

  const statusFilterOptions = useMemo(
    () => [
      { value: 'NEW', label: 'New' },
      { value: 'CONTACTED', label: 'Contacted' },
      { value: 'QUALIFIED', label: 'Qualified' },
      { value: 'LOST', label: 'Lost' },
      { value: 'CONVERTED', label: 'Converted' },
      { value: 'CLIENT', label: 'Client' },
    ],
    []
  );

  const sourceFilterOptions = useMemo(() => {
    const values = new Set();
    for (const company of leadCompanies) {
      const src = company?.source;
      if (src) values.add(String(src).toUpperCase());
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [leadCompanies]);

  const companyTypeFilterOptions = useMemo(() => {
    const values = new Set();
    for (const company of leadCompanies) {
      const type = company?.type;
      if (type) values.add(String(type));
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value }));
  }, [leadCompanies]);

  const assigneeFilterOptions = useMemo(() => {
    const map = new Map();
    for (const company of leadCompanies) {
      const user = company?.assignedTo;
      if (!user || typeof user !== 'object') continue;
      const id = user.id ?? user.documentId;
      if (id == null) continue;
      const name =
        user.username ||
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
        user.email ||
        `User ${id}`;
      map.set(String(id), name);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [leadCompanies]);

  // Filter companies based on search and tab
  const filteredCompanies = leadCompanies.filter((company) => {
    if (!company) return false;

    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.contacts?.some(
        (c) =>
          c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Tab filter
    const matchesTab = activeTab === 'all' || company.status?.toLowerCase() === activeTab.toLowerCase();

    const status = String(company.status || '').toUpperCase();
    const source = String(company.source || '').toUpperCase();
    const companyType = String(company.type || '').toLowerCase();
    const assignedId =
      company.assignedTo && typeof company.assignedTo === 'object'
        ? String(company.assignedTo.id ?? company.assignedTo.documentId ?? '')
        : String(company.assignedTo || '');
    const companyName = String(company.companyName || '').toLowerCase();
    const createdAt = company.createdAt ? new Date(company.createdAt) : null;
    const now = new Date();
    const daysSinceCreated =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const dealValue = Number(company.dealValue || 0);

    const matchesAdvanced =
      (!appliedFilters.status || status === appliedFilters.status) &&
      (!appliedFilters.source || source === appliedFilters.source) &&
      (!appliedFilters.type || companyType === appliedFilters.type.toLowerCase()) &&
      (!appliedFilters.assignedToId || assignedId === appliedFilters.assignedToId) &&
      (!appliedFilters.companyQuery ||
        companyName.includes(appliedFilters.companyQuery.toLowerCase())) &&
      (!appliedFilters.dateRange ||
        (daysSinceCreated != null &&
          ((appliedFilters.dateRange === 'last7' && daysSinceCreated <= 7) ||
            (appliedFilters.dateRange === 'last30' && daysSinceCreated <= 30) ||
            (appliedFilters.dateRange === 'last90' && daysSinceCreated <= 90) ||
            (appliedFilters.dateRange === 'thisYear' &&
              createdAt &&
              createdAt.getFullYear() === now.getFullYear())))) &&
      (!appliedFilters.valueRange ||
        (appliedFilters.valueRange === 'lt100k' && dealValue < 100000) ||
        (appliedFilters.valueRange === '100k_1m' && dealValue >= 100000 && dealValue <= 1000000) ||
        (appliedFilters.valueRange === '1m_5m' && dealValue > 1000000 && dealValue <= 5000000) ||
        (appliedFilters.valueRange === 'gt5m' && dealValue > 5000000));

    return matchesSearch && matchesTab && matchesAdvanced;
  });

  // Multi-column sort (client-side, applied after filter)
  const {
    sortRules,
    columnOptions: sortColumnOptions,
    sortedData: sortedCompanies,
    hasActiveSort,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    bindSortableColumns,
  } = useCrmTableSort({ entity: 'leadCompany', storageKey: TABLE_SORT_STORAGE_KEY, data: filteredCompanies });

  // Calculate pagination (after sort)
  const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = sortedCompanies.slice(startIndex, endIndex);

  useEffect(() => {
    if (!paginatedCompanies?.length) return;
    const ids = paginatedCompanies.map((c) => c?.id).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      try {
        const [generalCounts, reasonCounts] = await Promise.all([
          crmActivityService.fetchLeadCompanyCommentCounts({
            leadCompanyIds: ids,
            commentKind: 'general',
          }),
          crmActivityService.fetchLeadCompanyCommentCounts({
            leadCompanyIds: ids,
            commentKind: 'next_connect',
          }),
        ]);
        if (cancelled) return;
        setCommentCountsByCompanyId((prev) => ({ ...prev, ...(generalCounts || {}) }));
        setNextConnectReasonCountsByCompanyId((prev) => ({ ...prev, ...(reasonCounts || {}) }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paginatedCompanies]);

  // Reset to page 1 when filters change
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

  // Tab items
  const tabItems = [
    { key: 'all', label: 'All Companies', count: leadCompanies.length },
    { key: 'new', label: 'New', count: leadStats.new },
    { key: 'contacted', label: 'Contacted', count: leadStats.contacted },
    { key: 'qualified', label: 'Qualified', count: leadStats.qualified },
    { key: 'lost', label: 'Lost', count: leadStats.lost },
  ];

  const handleStatusUpdate = useCallback(
    async (companyId, newStatus) => {
      if (!companyId) return;
      const targetCompany = leadCompanies.find((company) => company?.id === companyId);
      if (!canEditCRMRecord('leads', targetCompany)) {
        alert('You can only update lead companies assigned to you.');
        return;
      }
      const loadingKey = `${companyId}-${newStatus.toLowerCase()}`;
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

      try {
        await leadCompanyService.update(companyId, {
          status: newStatus.toUpperCase(),
        });
        setLeadCompanies((prevCompanies) =>
          prevCompanies.map((company) =>
            company?.id === companyId ? { ...company, status: newStatus.toLowerCase() } : company
          )
        );
        await fetchStats();
      } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status. Please try again.');
      } finally {
        setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
      }
    },
    [fetchStats, leadCompanies]
  );

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    if (!canManageCRM('leads')) {
      alert('You do not have permission to delete lead companies.');
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      return;
    }
    const loadingKey = `${companyToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      await leadCompanyService.delete(companyToDelete.id);
      setLeadCompanies((prev) => prev.filter((company) => company.id !== companyToDelete.id));
      await fetchStats();
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company. Please try again.');
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleConvertToClient = useCallback(async () => {
    if (!companyToConvert?.id || converting) return;
    if (!canEditCRMRecord('leads', companyToConvert)) {
      setConvertError('You can only convert lead companies assigned to you.');
      return;
    }
    setConverting(true);
    setConvertError('');
    try {
      const res = await leadCompanyService.convertToClient(companyToConvert.id);
      const clientAccount = res?.data?.clientAccount ?? null;
      setLeadCompanies((prev) =>
        prev.map((company) =>
          company?.id === companyToConvert.id
            ? { ...company, status: 'CONVERTED', convertedAccount: clientAccount }
            : company
        )
      );
      await fetchStats();
      setConvertModalOpen(false);
      setCompanyToConvert(null);
      if (clientAccount?.id) {
        router.push(`/clients/accounts/${clientAccount.id}`);
      }
    } catch (err) {
      setConvertError(err?.message || 'Failed to convert. Please try again.');
    } finally {
      setConverting(false);
    }
  }, [companyToConvert, converting, fetchStats, router]);

  const openCommentComposer = useCallback(async (companyId, anchor) => {
    const mode = anchor?.mode === 'nextConnect' ? 'nextConnect' : 'general';
    const company = leadCompanies.find((c) => c?.id === companyId);
    if (mode === 'nextConnect') {
      setNextConnectDraft(toDateInputValue(company?.nextConnectDate) || '');
    } else {
      setNextConnectDraft('');
    }
    setCommentComposerMenu(
      anchor ? { id: companyId, mode, ...anchor } : { id: companyId, mode }
    );
    setCommentDraft('');
    setCommentError('');
    setCommentLoadingCompanyId(companyId);
    try {
      if (mode === 'nextConnect') {
        const res = await crmActivityService.fetchLeadCompanyNextConnectReasons({
          leadCompanyId: companyId,
          limit: 20,
        });
        setNextConnectReasonsByCompany((prev) => ({ ...prev, [companyId]: res?.data || [] }));
      } else {
        const res = await crmActivityService.fetchLeadCompanyComments({
          leadCompanyId: companyId,
          limit: 20,
          commentKind: 'general',
        });
        setCommentsByCompany((prev) => ({ ...prev, [companyId]: res?.data || [] }));
      }
    } catch (e) {
      setCommentError(e?.message || 'Could not load messages');
      if (mode === 'nextConnect') {
        setNextConnectReasonsByCompany((prev) => ({ ...prev, [companyId]: prev[companyId] || [] }));
      } else {
        setCommentsByCompany((prev) => ({ ...prev, [companyId]: prev[companyId] || [] }));
      }
    } finally {
      setCommentLoadingCompanyId(null);
    }
  }, [leadCompanies]);

  const saveNextConnectDate = useCallback(
    async (companyId, dateValue) => {
      const company = leadCompanies.find((c) => c?.id === companyId);
      if (!company || !canEditCRMRecord('leads', company)) return;
      const normalized = (dateValue || '').trim();
      const current = toDateInputValue(company.nextConnectDate) || '';
      if (normalized === current) return;

      setNextConnectSaving(true);
      setCommentError('');
      try {
        await leadCompanyService.update(companyId, {
          nextConnectDate: normalized || null,
        });
        setLeadCompanies((prev) =>
          prev.map((c) =>
            c?.id === companyId ? { ...c, nextConnectDate: normalized || null } : c
          )
        );
        setNextConnectDraft(normalized);
      } catch (e) {
        setCommentError(e?.message || 'Could not update next connect date');
      } finally {
        setNextConnectSaving(false);
      }
    },
    [leadCompanies]
  );

  const closeCommentComposer = useCallback(() => {
    setCommentComposerMenu(null);
    setCommentDraft('');
    setCommentError('');
    setNextConnectDraft('');
  }, []);

  const submitComment = useCallback(async () => {
    const companyId = commentComposerMenu?.id;
    const mode = commentComposerMenu?.mode === 'nextConnect' ? 'nextConnect' : 'general';
    const text = commentDraft.trim();
    if (!companyId || !text) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const res =
        mode === 'nextConnect'
          ? await crmActivityService.addLeadCompanyNextConnectReason({
              leadCompanyId: companyId,
              comment: text,
            })
          : await crmActivityService.addLeadCompanyComment({
              leadCompanyId: companyId,
              comment: text,
              commentKind: 'general',
            });
      const newComment = res?.data;
      if (newComment) {
        if (mode === 'nextConnect') {
          setNextConnectReasonsByCompany((prev) => ({
            ...prev,
            [companyId]: [newComment, ...(Array.isArray(prev[companyId]) ? prev[companyId] : [])],
          }));
          setNextConnectReasonCountsByCompanyId((prev) => ({
            ...prev,
            [String(companyId)]: Math.max(
              1,
              (parseInt(prev[String(companyId)] || prev[companyId] || 0, 10) || 0) + 1
            ),
          }));
        } else {
          setCommentsByCompany((prev) => ({
            ...prev,
            [companyId]: [newComment, ...(Array.isArray(prev[companyId]) ? prev[companyId] : [])],
          }));
          setCommentCountsByCompanyId((prev) => ({
            ...prev,
            [String(companyId)]: Math.max(
              1,
              (parseInt(prev[String(companyId)] || prev[companyId] || 0, 10) || 0) + 1
            ),
          }));
        }
      }
      setCommentDraft('');
    } catch (e) {
      setCommentError(e?.message || 'Could not post message');
    } finally {
      setCommentSubmitting(false);
    }
  }, [commentComposerMenu, commentDraft]);

  const allTableColumns = useMemo(
    () => [
      {
        key: 'company',
        label: 'COMPANY',
        fixed: true,
        defaultWidth: '300px',
        render: (_, company) => (
          <div className="flex items-start gap-3 min-w-[240px] w-full">
            <Avatar fallback={company.companyName?.[0] || 'C'} alt={company.companyName} size="sm" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">{company.companyName || 'Unnamed'}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {company.contacts && company.contacts.length > 0
                      ? `${company.contacts[0].firstName || ''} ${company.contacts[0].lastName || ''}`.trim()
                      : 'No primary contact'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    openCommentComposer(company.id, {
                      mode: 'general',
                      top: r.bottom + 8,
                      left: r.left,
                      triggerEl: e.currentTarget,
                    });
                  }}
                  className={`relative mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${Number(commentCountsByCompanyId[String(company.id)] || 0) > 0
                    ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white hover:border-gray-300'
                    } ${commentComposerMenu?.id === company.id && commentComposerMenu?.mode === 'general' ? 'bg-white border-gray-300 text-gray-700' : ''} ${Number(commentCountsByCompanyId[String(company.id)] || 0) > 0 ? '' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  aria-label={`Add comment for ${company.companyName || 'company'}`}
                  title="Add comment"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  {Number(commentCountsByCompanyId[String(company.id)] || 0) > 0 ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'nextConnectDate',
        label: 'NEXT CONNECT',
        fixed: true,
        defaultWidth: '190px',
        render: (_, company) => (
          <LeadNextConnectCell
            company={company}
            reasonCount={nextConnectReasonCountsByCompanyId[String(company.id)] || 0}
            onOpenPopover={openCommentComposer}
            canEdit={canEditCRMRecord('leads', company)}
            active={
              commentComposerMenu?.id === company.id &&
              commentComposerMenu?.mode === 'nextConnect'
            }
          />
        ),
      },
      {
        key: 'primaryContact',
        visibilityKey: 'primaryContact',
        label: 'PRIMARY CONTACT',
        defaultWidth: '260px',
        render: (_, company) => (
          <div className="space-y-1 min-w-[200px]">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {company.contacts && company.contacts.length > 0
                  ? company.contacts[0].email
                  : company.email || 'No email'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {company.contacts && company.contacts.length > 0
                  ? company.contacts[0].phone || 'No contact'
                  : company.phone || 'No contact'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        defaultWidth: '180px',
        render: (_, company) => {
          const saving = Object.entries(loadingActions).some(
            ([key, active]) =>
              active && key.startsWith(`${company.id}-`) && !key.endsWith('-delete')
          );
          return (
            <TableCellLeadStatusSelect
              company={company}
              onStatusChange={handleStatusUpdate}
              saving={saving}
              canEdit={canEditCRMRecord('leads', company)}
            />
          );
        },
      },
      {
        key: 'source',
        visibilityKey: 'source',
        label: 'SOURCE',
        render: (_, company) => <TableCellSource value={company.source} />,
      },
      {
        key: 'segment',
        visibilityKey: 'segment',
        label: 'SEGMENT',
        render: (_, company) => <TableCellText value={company.segment} nowrap />,
      },
      {
        key: 'dealValue',
        visibilityKey: 'dealValue',
        label: 'DEAL VALUE',
        render: (_, company) => {
          const totalDealValue = company.deals?.length
            ? company.deals.reduce((total, deal) => total + (parseFloat(deal.value) || 0), 0)
            : company.dealValue || 0;
          return <TableCellText value={formatCurrency(totalDealValue)} emphasized />;
        },
      },
      {
        key: 'contactsCount',
        visibilityKey: 'contactsCount',
        label: 'CONTACTS',
        render: (_, company) => (
          <div className="flex items-center gap-2 min-w-[100px]">
            <UserPlus className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{company.contacts ? company.contacts.length : 0}</span>
          </div>
        ),
      },
      {
        key: 'assignedTo',
        visibilityKey: 'assignedTo',
        label: 'ASSIGNED TO',
        render: (_, company) => <TableCellOwner user={company.assignedTo} />,
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, company) => <TableCellCreated dateString={company.createdAt} />,
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_, company) => <TableCellDateOnly dateString={company.updatedAt} />,
      },
      {
        key: 'industry',
        visibilityKey: 'industry',
        label: 'INDUSTRY',
        render: (_, company) => <TableCellOrangePill value={company.industry} />,
      },
      {
        key: 'type',
        visibilityKey: 'type',
        label: 'TYPE',
        render: (_, company) => <TableCellText value={company.type} />,
      },
      {
        key: 'website',
        visibilityKey: 'website',
        label: 'WEBSITE',
        render: (_, company) =>
          company.website ? (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-orange-600 hover:underline max-w-[180px] truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{company.website}</span>
            </a>
          ) : (
            <TableCellText value="" />
          ),
      },
      {
        key: 'companyPhone',
        visibilityKey: 'companyPhone',
        label: 'CO. PHONE',
        render: (_, company) => (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{company.phone || '—'}</span>
          </div>
        ),
      },
      {
        key: 'companyEmail',
        visibilityKey: 'companyEmail',
        label: 'CO. EMAIL',
        render: (_, company) => (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[160px]">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{company.email || '—'}</span>
          </div>
        ),
      },
      {
        key: 'address',
        visibilityKey: 'address',
        label: 'ADDRESS',
        render: (_, company) => (
          <div className="flex items-start gap-2 text-sm text-gray-600 max-w-[220px]">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2" title={company.address || ''}>
              {company.address || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'city',
        visibilityKey: 'city',
        label: 'CITY',
        render: (_, company) => <TableCellText value={company.city} />,
      },
      {
        key: 'state',
        visibilityKey: 'state',
        label: 'STATE',
        render: (_, company) => <TableCellText value={company.state} />,
      },
      {
        key: 'country',
        visibilityKey: 'country',
        label: 'COUNTRY',
        render: (_, company) => <TableCellText value={company.country} />,
      },
      {
        key: 'zipCode',
        visibilityKey: 'zipCode',
        label: 'ZIP',
        render: (_, company) => <TableCellText value={company.zipCode} />,
      },
      {
        key: 'employees',
        visibilityKey: 'employees',
        label: 'EMPLOYEES',
        render: (_, company) => <TableCellText value={company.employees} />,
      },
      {
        key: 'founded',
        visibilityKey: 'founded',
        label: 'FOUNDED',
        render: (_, company) => <TableCellText value={company.founded} />,
      },
      {
        key: 'description',
        visibilityKey: 'description',
        label: 'DESCRIPTION',
        render: (_, company) => (
          <TableCellMultiline text={company.description} maxChars={120} maxWidthClass="max-w-[240px]" />
        ),
      },
      {
        key: 'linkedIn',
        visibilityKey: 'linkedIn',
        label: 'LINKEDIN',
        render: (_, company) =>
          company.linkedIn ? (
            <a
              href={company.linkedIn.startsWith('http') ? company.linkedIn : `https://${company.linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:underline truncate max-w-[160px] inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Link
            </a>
          ) : (
            <TableCellText value="" />
          ),
      },
      {
        key: 'twitter',
        visibilityKey: 'twitter',
        label: 'TWITTER / X',
        render: (_, company) => <TableCellText value={company.twitter} />,
      },
      {
        key: 'score',
        visibilityKey: 'score',
        label: 'SCORE',
        render: (_, company) => (
          <span className="text-sm text-gray-900 tabular-nums">{company.score != null ? company.score : '—'}</span>
        ),
      },
      {
        key: 'healthScore',
        visibilityKey: 'healthScore',
        label: 'HEALTH',
        render: (_, company) => (
          <span className="text-sm text-gray-900 tabular-nums">{company.healthScore != null ? company.healthScore : '—'}</span>
        ),
      },
      {
        key: 'notes',
        visibilityKey: 'notes',
        label: 'NOTES',
        render: (_, company) => (
          <TableCellMultiline text={company.notes} maxChars={100} maxWidthClass="max-w-[200px]" />
        ),
      },
      {
        key: 'organization',
        visibilityKey: 'organization',
        label: 'ORGANIZATION',
        render: (_, company) => <TableCellText value={orgDisplayName(company.organization)} />,
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, company) => {
          const canEditLeadCompany = canEditCRMRecord('leads', company);
          const canDeleteLeadCompany = canManageCRM('leads');
          const currentStatus = (company.status || 'NEW').toUpperCase();
          const isClient =
            currentStatus === 'CLIENT' ||
            currentStatus === 'CONVERTED' ||
            Boolean(company?.convertedAccount);
          const convertedAccountId =
            company?.convertedAccount && typeof company.convertedAccount === 'object'
              ? company.convertedAccount.id ?? company.convertedAccount.documentId
              : company?.convertedAccount;
          return (
            <div className="flex min-w-[220px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {/* Order matches contacts table: More → Edit → Mail → Delete */}
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
                      prev?.id === company.id
                        ? null
                        : { id: company.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                    );
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              {isClient ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                  title={convertedAccountId ? 'Open client account' : 'Client account not linked yet'}
                  disabled={!convertedAccountId}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!convertedAccountId) return;
                    router.push(`/clients/accounts/${convertedAccountId}`);
                  }}
                >
                  <Building2 className="h-4 w-4" />
                </Button>
              ) : null}
              {canEditLeadCompany ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-emerald-600 hover:bg-emerald-50"
                  title="Edit Company"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/sales/lead-companies/${company.id}/edit`);
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
                disabled={!company.email}
                onClick={(e) => {
                  e.stopPropagation();
                  if (company.email) window.location.href = `mailto:${company.email}`;
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
              {canDeleteLeadCompany ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  title="Delete Company"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompanyToDelete(company);
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
    [router, commentComposerMenu, commentCountsByCompanyId, nextConnectReasonCountsByCompanyId, openCommentComposer, handleStatusUpdate, loadingActions]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.company) out.push(byKey.company);
    if (byKey.nextConnectDate) out.push(byKey.nextConnectDate);
    if (columnVisibility.primaryContact && byKey.primaryContact) {
      out.push(byKey.primaryContact);
    }
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return bindSortableColumns(out);
  }, [allTableColumns, columnVisibility, columnOrder, bindSortableColumns]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <CRMPageHeader
        title="Lead Companies"
        subtitle="Track and manage potential client companies"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
          { label: 'Lead Companies', href: '/sales/lead-companies' },
        ]}
        showActions={true}
        onAddClick={() => router.push('/sales/lead-companies/new')}
        onFilterClick={openFilterModal}
        onImportClick={() => console.log('Import clicked')}
        onExportClick={() => console.log('Export clicked')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="New Leads"
          value={leadStats.new}
          subtitle={leadStats.new === 0 ? 'No leads' : `${leadStats.new} ${leadStats.new === 1 ? 'lead' : 'leads'}`}
          icon={Building2}
          colorScheme="orange"
        />
        <KPICard
          title="Contacted Leads"
          value={leadStats.contacted}
          subtitle={leadStats.contacted === 0 ? 'No leads' : `${leadStats.contacted} ${leadStats.contacted === 1 ? 'lead' : 'leads'}`}
          icon={PhoneCall}
          colorScheme="orange"
        />
        <KPICard
          title="Qualified Leads"
          value={leadStats.qualified}
          subtitle={leadStats.qualified === 0 ? 'No leads' : `${leadStats.qualified} ${leadStats.qualified === 1 ? 'lead' : 'leads'}`}
          icon={CheckCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Lost Leads"
          value={leadStats.lost}
          subtitle={leadStats.lost === 0 ? 'No leads' : `${leadStats.lost} ${leadStats.lost === 1 ? 'lead' : 'leads'}`}
          icon={XCircle}
          colorScheme="orange"
        />
      </div>

      {/* Tabs + column visibility (eye) */}
      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabItems.map((item) => ({
            key: item.key,
            label: item.label,
            badge: item.count.toString(),
          }))}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search..."
          showAdd={true}
          onAddClick={() => router.push('/sales/lead-companies/new')}
          addTitle="Add Lead Company"
          showFilter={true}
          onFilterClick={openFilterModal}
          showColumnVisibility={true}
          onColumnVisibilityClick={() => { setColumnPickerOpen((o) => !o); setSortOpen(false); }}
          columnVisibilityTitle="Show or hide columns"
          showSort={true}
          onSortClick={() => { setSortOpen((o) => !o); setColumnPickerOpen(false); }}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort columns"
          showExport={true}
          onExportClick={() => console.log('Export clicked')}
          exportTitle="Export"
        />
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
        {columnPickerOpen && (
          <div
            className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl"
            role="dialog"
            aria-label="Table columns"
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Columns</p>
            <p className="mb-2 text-xs leading-snug text-gray-500">
              Company and actions stay visible. Primary contact stays first. Drag the grip to reorder; an orange line shows where the row will land.
            </p>
            <ul
              className="max-h-[min(51vh,18.75rem)] space-y-0 overflow-y-auto pr-1"
              onDragLeave={handleColumnListDragLeave}
            >
              <li
                data-column-row
                className="relative flex items-stretch rounded-lg border border-transparent"
              >
                <span
                  className="flex w-8 shrink-0 items-center justify-center text-gray-300"
                  aria-hidden
                  title="Fixed order"
                >
                  —
                </span>
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-sm text-gray-800 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    checked={Boolean(columnVisibility.primaryContact)}
                    onChange={(e) => setColumnVisible('primaryContact', e.target.checked)}
                  />
                  <span>Primary contact</span>
                </label>
              </li>
              {columnOrder.map((key) => {
                const def = TOGGLEABLE_COLUMNS.find((c) => c.key === key);
                if (!def) return null;
                const showLineBefore =
                  columnDropIndicator?.targetKey === key &&
                  columnDropIndicator.place === 'before';
                const showLineAfter =
                  columnDropIndicator?.targetKey === key &&
                  columnDropIndicator.place === 'after';
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

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{sortedCompanies.length}</span> result
        {sortedCompanies.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Loading lead companies..." />
          </div>
        ) : (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedCompanies}
              keyField="id"
              variant="modern"
              onRowClick={(row) => router.push(`/sales/lead-companies/${row.id}`)}
              resizableColumns
              columnWidths={columnWidths}
              onColumnWidthsChange={setColumnWidths}
              onColumnResizeEnd={handleColumnResizeEnd}
            />
            {paginatedCompanies.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <div className="text-gray-400 mb-2">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No lead companies found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeTab !== 'all' ? 'Try adjusting your filters' : 'Add your first lead company to get started'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <Button variant="primary" onClick={() => router.push('/sales/lead-companies/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead Company
                  </Button>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={sortedCompanies.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal && !!companyToDelete}
        onClose={() => {
          if (companyToDelete && loadingActions[`${companyToDelete.id}-delete`]) return;
          setShowDeleteModal(false);
          setCompanyToDelete(null);
        }}
        title="Delete Lead Company"
        size="md"
        closeOnBackdrop={!(companyToDelete && loadingActions[`${companyToDelete.id}-delete`])}
      >
        {companyToDelete ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-900">
                <span className="font-semibold">This action cannot be undone</span>
              </p>
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">{companyToDelete.companyName}</span>?
            </p>
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                This will permanently delete:
              </p>
              <ul className="space-y-1 text-sm text-red-900">
                <li>• Company information and details</li>
                <li>• All associated contacts</li>
                <li>• All deals and proposals</li>
                <li>• Activity history and notes</li>
              </ul>
            </div>
            <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="muted"
                disabled={loadingActions[`${companyToDelete.id}-delete`]}
                onClick={() => {
                  setShowDeleteModal(false);
                  setCompanyToDelete(null);
                }}
                className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteCompany}
                disabled={loadingActions[`${companyToDelete.id}-delete`]}
                variant="danger"
                className="w-full min-w-[10rem] rounded-xl py-2.5 sm:w-auto"
              >
                {loadingActions[`${companyToDelete.id}-delete`] ? 'Deleting…' : 'Delete Company'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Convert to Client confirmation modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => {
          if (!converting) {
            setConvertModalOpen(false);
            setCompanyToConvert(null);
            setConvertError('');
          }
        }}
        title="Convert to Client Account"
        size="md"
        closeOnBackdrop={!converting}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <p className="text-sm text-orange-900">
              <span className="font-semibold">This action cannot be undone</span>
            </p>
          </div>
          <p className="text-sm text-gray-700">
            Are you sure you want to convert{' '}
            <span className="font-semibold text-gray-900">
              {companyToConvert?.companyName || 'this lead company'}
            </span>{' '}
            to a client account?
          </p>
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-700">
              ✨ This will:
            </p>
            <ul className="space-y-1 text-sm text-orange-900">
              <li>• Move the company to Client Accounts section</li>
              <li>• Preserve all contacts and their information</li>
              <li>• Maintain all deals and proposals</li>
              <li>• Keep activity history and notes</li>
              <li>• Enable client-specific features and billing</li>
            </ul>
          </div>
          {convertError ? (
            <p className="text-sm text-red-600 text-center" role="alert">
              {convertError}
            </p>
          ) : null}
          <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={converting}
              onClick={() => {
                if (converting) return;
                setConvertModalOpen(false);
                setCompanyToConvert(null);
                setConvertError('');
              }}
              className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={converting}
              onClick={handleConvertToClient}
              rounded="default"
              className="w-full min-w-[10rem] rounded-xl border-0 bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60 sm:w-auto"
            >
              {converting ? (
                'Converting…'
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Convert to Client
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Lead Companies"
        size="xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">Refine your lead company search</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <select
                value={draftFilters.status}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select status</option>
                {statusFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Source</span>
              <select
                value={draftFilters.source}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, source: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select source</option>
                {sourceFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Company Type</span>
              <select
                value={draftFilters.type}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select company type</option>
                {companyTypeFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Assigned To</span>
              <select
                value={draftFilters.assignedToId}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, assignedToId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select assignee</option>
                {assigneeFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Company</span>
              <input
                value={draftFilters.companyQuery}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, companyQuery: e.target.value }))
                }
                placeholder="Filter by company..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Date Range</span>
              <select
                value={draftFilters.dateRange}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select date range</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="thisYear">This year</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Value Range</span>
              <select
                value={draftFilters.valueRange}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, valueRange: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select value range</option>
                <option value="lt100k">Below 1 lakh</option>
                <option value="100k_1m">1 lakh to 10 lakh</option>
                <option value="1m_5m">10 lakh to 50 lakh</option>
                <option value="gt5m">Above 50 lakh</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={clearAllFilters}>
              Clear All
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="muted" onClick={() => setShowFilterModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
          {hasActiveFilters ? (
            <p className="text-xs text-orange-700">Active filters are applied to results.</p>
          ) : null}
        </div>
      </Modal>

      {moreActionMenu &&
        (() => {
          const company = leadCompanies.find((c) => c.id === moreActionMenu.id);
          if (!company) return null;
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
                  console.log('Create meet for lead company', company.id);
                }}
              >
                <Video className="h-4 w-4 shrink-0 text-teal-600" />
                Create Meet
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  console.log('Create task for lead company', company.id);
                }}
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
                Create Task
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setMoreActionMenu(null);
                  navigator.clipboard.writeText(
                    `${window.location.origin}/sales/lead-companies/${company.id}`
                  );
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Copy URL
              </button>
            </TableRowActionMenuPortal>
          );
        })()}

      {commentComposerMenu &&
        (() => {
          const company = leadCompanies.find((c) => c.id === commentComposerMenu.id);
          if (!company) return null;
          const isNextConnectMode = commentComposerMenu.mode === 'nextConnect';
          const threadItems = isNextConnectMode
            ? Array.isArray(nextConnectReasonsByCompany[company.id])
              ? nextConnectReasonsByCompany[company.id]
              : []
            : Array.isArray(commentsByCompany[company.id])
              ? commentsByCompany[company.id]
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
                    <p className="text-sm font-semibold text-gray-900">
                      {isNextConnectMode ? 'Next connect' : 'Comments'}
                    </p>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      {threadItems.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 truncate">{company.companyName || 'Lead company'}</p>
                </div>

                {isNextConnectMode && canEditCRMRecord('leads', company) ? (
                  <div className="border-b border-gray-100 bg-white px-4 py-3">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Calendar className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                      Next connect date
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={nextConnectDraft}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNextConnectDraft(v);
                          void saveNextConnectDate(company.id, v);
                        }}
                        disabled={nextConnectSaving}
                        className="flex-1 text-sm"
                        autoFocus={commentComposerMenu?.focus === 'date'}
                      />
                      {nextConnectDraft ? (
                        <Button
                          type="button"
                          variant="muted"
                          size="sm"
                          disabled={nextConnectSaving}
                          onClick={() => {
                            setNextConnectDraft('');
                            void saveNextConnectDate(company.id, '');
                          }}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    {nextConnectSaving ? (
                      <p className="mt-1.5 text-xs text-gray-400">Saving date…</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="max-h-56 overflow-y-auto bg-gray-50/50 px-4 py-3">
                  {commentLoadingCompanyId === company.id ? (
                    <div className="py-4">
                      <LoadingSpinner size="sm" message={isNextConnectMode ? 'Loading reasons...' : 'Loading comments...'} />
                    </div>
                  ) : threadItems.length > 0 ? (
                    <div className="relative">
                      <div
                        className="pointer-events-none absolute left-3 top-3 bottom-3 w-px bg-gradient-to-b from-orange-400/90 via-orange-200 to-gray-200"
                        aria-hidden
                      />
                      <ul className="relative m-0 list-none space-y-3 p-0 pr-1" role="list">
                        {threadItems.map((row) => (
                          <li key={row.id} className="relative flex gap-3">
                            <div className="relative z-[1] flex w-6 shrink-0 justify-center pt-0.5">
                              <Avatar
                                size="xs"
                                alt={actorDisplay(row.actor)}
                                fallback={actorDisplay(row.actor).charAt(0).toUpperCase()}
                                className="ring-2 ring-white shadow-sm"
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
                      {isNextConnectMode
                        ? 'No reasons yet. Add why you are scheduling this follow-up.'
                        : 'No comments yet. Start the thread.'}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-2.5">
                  {commentError ? (
                    <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">{commentError}</p>
                  ) : null}

                  <Textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    rows={2}
                    resize="none"
                    autoFocus={isNextConnectMode ? commentComposerMenu?.focus !== 'date' : true}
                    placeholder={
                      isNextConnectMode
                        ? 'Reason for this follow-up…'
                        : 'Add a comment…'
                    }
                    className="rounded-xl text-sm text-gray-900 placeholder:text-gray-400 border-orange-200 focus:ring-orange-500/20"
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
                        aria-label={
                          isNextConnectMode
                            ? `Add next connect reason for ${company.companyName || 'company'}`
                            : `Send comment for ${company.companyName || 'company'}`
                        }
                        className="inline-flex items-center gap-1.5"
                      >
                        <SendHorizontal className="w-3.5 h-3.5" />
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
