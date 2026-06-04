'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Mail,
  Phone,
  Building2,
  Users,
  MoreHorizontal,
  Video,
  ClipboardList,
  Link2,
  Pencil,
  Trash2,
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
  TableCellCreated,
  TableCellDateOnly,
  TableCellOwner,
  TableCellStatusPill,
  TableCellRole,
  TableRowActionMenuPortal,
  Modal,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import { TableSortDropdown as CrmTableSortDropdown } from '@webfudge/ui';
import { useCrmTableSort } from '../../../hooks/useCrmTableSort';
import contactService from '../../../lib/api/contactService';
import { canEditCRMRecord, canManageCRM } from '../../../lib/rbac';

function contactDisplayName(contact) {
  if (!contact) return 'Unnamed';
  if (contact.firstName && contact.lastName) return `${contact.firstName} ${contact.lastName}`;
  if (contact.name) return contact.name;
  return contact.email || 'Unnamed';
}

function contactInitials(contact) {
  const fn = contact?.firstName?.trim();
  const ln = contact?.lastName?.trim();
  if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
  const name = contactDisplayName(contact);
  if (name && name.length >= 2) return name.slice(0, 2).toUpperCase();
  return (name?.[0] || contact?.email?.[0] || 'C').toUpperCase();
}

function companyLabel(contact) {
  return (
    contact.companyName ||
    contact.company ||
    contact.leadCompany?.companyName ||
    contact.leadCompany?.name ||
    null
  );
}

function humanizeField(value) {
  if (value == null || value === '') return '';
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tableTextCell(value) {
  const display = value != null && value !== '' ? String(value) : null;
  return (
    <span
      className="inline-block max-w-[200px] truncate whitespace-nowrap text-sm text-gray-600"
      title={display || ''}
    >
      {display || '—'}
    </span>
  );
}

function truncateText(text, max = 100) {
  if (text == null || text === '') return '—';
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.contacts.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.contacts.tableColumnOrder';
const TABLE_SORT_STORAGE_KEY = 'crm.contacts.tableSort';

const TOGGLEABLE_COLUMNS = [
  { key: 'contactInfo', label: 'Contact info' },
  { key: 'role', label: 'Role' },
  { key: 'owner', label: 'Owner' },
  { key: 'createdAt', label: 'Created' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'department', label: 'Department' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'source', label: 'Source' },
  { key: 'preferredContactMethod', label: 'Preferred contact method' },
  { key: 'companyName', label: 'Company name (text)' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'zipCode', label: 'ZIP / postal' },
  { key: 'linkedIn', label: 'LinkedIn' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'notes', label: 'Notes' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_ON_KEYS = new Set([
  'contactInfo',
  'role',
  'owner',
  'createdAt',
  'status',
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

export default function ContactsPage() {
  const initialFilters = useMemo(
    () => ({
      status: '',
      source: '',
      preferredContactMethod: '',
      assignedToId: '',
      companyQuery: '',
      hasEmail: '',
      hasPhone: '',
      dateRange: '',
    }),
    []
  );
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteContactId, setDeleteContactId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...DEFAULT_COLUMN_VISIBILITY }));
  const [columnOrder, setColumnOrder] = useState(() => [...REORDERABLE_COLUMN_KEYS]);
  const [columnWidths, setColumnWidths] = useState({});
  const [columnDropIndicator, setColumnDropIndicator] = useState(null);
  /** More-options menu; portal anchor so dropdown is not clipped by table overflow */
  const [actionMenu, setActionMenu] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const columnDragKeyRef = useRef(null);
  const columnDropIndicatorRef = useRef(null);
  const toolbarRef = useRef(null);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    setColumnVisibility(loadColumnVisibility());
    setColumnOrder(loadColumnOrder());
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

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await contactService.getAll({
        sort: 'createdAt:desc',
        'pagination[pageSize]': 100,
        populate: ['leadCompany', 'assignedTo'],
      });
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const contactStats = {
    all: contacts.length,
    withEmail: contacts.filter((c) => c.email).length,
    withPhone: contacts.filter((c) => c.phone).length,
    withCompany: contacts.filter((c) => c.companyName || c.company || c.leadCompany).length,
  };

  const statusFilterOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
      { value: 'LEAD', label: 'Lead' },
    ],
    []
  );

  const sourceFilterOptions = useMemo(() => {
    const values = new Set();
    for (const contact of contacts) {
      const src = contact?.source;
      if (src) values.add(String(src).toUpperCase());
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: humanizeField(value) }));
  }, [contacts]);

  const preferredContactOptions = useMemo(() => {
    const values = new Set();
    for (const contact of contacts) {
      const method = contact?.preferredContactMethod || contact?.preferredChannel;
      if (method) values.add(String(method).toUpperCase());
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: humanizeField(value) }));
  }, [contacts]);

  const assigneeFilterOptions = useMemo(() => {
    const map = new Map();
    for (const contact of contacts) {
      const user = contact?.assignedTo;
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
  }, [contacts]);

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    if (!contact) return false;

    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.companyName || contact.company)?.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter
    let matchesTab = true;
    if (activeTab === 'withEmail') {
      matchesTab = !!contact.email;
    } else if (activeTab === 'withPhone') {
      matchesTab = !!contact.phone;
    } else if (activeTab === 'withCompany') {
      matchesTab = !!(contact.companyName || contact.company || contact.leadCompany);
    }
    // 'all' tab shows everything

    const status = String(contact.status || '').toUpperCase();
    const source = String(contact.source || '').toUpperCase();
    const preferredMethod = String(
      contact.preferredContactMethod || contact.preferredChannel || ''
    ).toUpperCase();
    const assignedId =
      contact.assignedTo && typeof contact.assignedTo === 'object'
        ? String(contact.assignedTo.id ?? contact.assignedTo.documentId ?? '')
        : String(contact.assignedTo || '');
    const company = String(companyLabel(contact) || '').toLowerCase();
    const createdAt = contact.createdAt ? new Date(contact.createdAt) : null;
    const now = new Date();
    const daysSinceCreated =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const matchesAdvanced =
      (!appliedFilters.status || status === appliedFilters.status) &&
      (!appliedFilters.source || source === appliedFilters.source) &&
      (!appliedFilters.preferredContactMethod ||
        preferredMethod === appliedFilters.preferredContactMethod) &&
      (!appliedFilters.assignedToId || assignedId === appliedFilters.assignedToId) &&
      (!appliedFilters.companyQuery ||
        company.includes(appliedFilters.companyQuery.toLowerCase())) &&
      (!appliedFilters.hasEmail ||
        (appliedFilters.hasEmail === 'yes' ? Boolean(contact.email) : !contact.email)) &&
      (!appliedFilters.hasPhone ||
        (appliedFilters.hasPhone === 'yes' ? Boolean(contact.phone) : !contact.phone)) &&
      (!appliedFilters.dateRange ||
        (daysSinceCreated != null &&
          ((appliedFilters.dateRange === 'last7' && daysSinceCreated <= 7) ||
            (appliedFilters.dateRange === 'last30' && daysSinceCreated <= 30) ||
            (appliedFilters.dateRange === 'last90' && daysSinceCreated <= 90) ||
            (appliedFilters.dateRange === 'thisYear' &&
              createdAt &&
              createdAt.getFullYear() === now.getFullYear()))));

    return matchesSearch && matchesTab && matchesAdvanced;
  });

  // Multi-column sort
  const {
    sortRules,
    columnOptions: sortColumnOptions,
    sortedData: sortedContacts,
    hasActiveSort,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    bindSortableColumns,
  } = useCrmTableSort({ entity: 'contact', storageKey: TABLE_SORT_STORAGE_KEY, data: filteredContacts });

  // Pagination (after sort)
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, appliedFilters]);

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
    { key: 'all', label: 'All Contacts', count: contactStats.all },
    { key: 'withEmail', label: 'With Email', count: contactStats.withEmail },
    { key: 'withPhone', label: 'With Phone', count: contactStats.withPhone },
    { key: 'withCompany', label: 'With Company', count: contactStats.withCompany },
  ];

  const handleDeleteContact = useCallback(async (e, contactId) => {
    e.stopPropagation();
    if (!contactId || deletingId) return;
    if (!canManageCRM('contacts')) return;
    setDeleteContactId(contactId);
  }, [deletingId]);

  const confirmDeleteContact = useCallback(async () => {
    if (!deleteContactId || deletingId) return;
    try {
      setDeletingId(deleteContactId);
      await contactService.delete(deleteContactId);
      setContacts((prev) => prev.filter((c) => c.id !== deleteContactId));
      setDeleteContactId(null);
    } catch (err) {
      console.error('Error deleting contact:', err);
    } finally {
      setDeletingId(null);
    }
  }, [deleteContactId, deletingId]);

  const allTableColumns = useMemo(
    () => [
      {
        key: 'contact',
        label: 'CONTACT',
        fixed: true,
        render: (_, contact) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar
              fallback={contactInitials(contact)}
              alt={contactDisplayName(contact)}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{contactDisplayName(contact)}</div>
              <div className="truncate text-sm text-gray-500">
                {contact.jobTitle || contact.contactRole || '—'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'company',
        label: 'COMPANY',
        fixed: true,
        render: (_, contact) => {
          const name = companyLabel(contact);
          const isLead = !!contact.leadCompany;
          return (
            <div className="min-w-[160px]">
              <div className="truncate font-semibold text-gray-900">{name || '—'}</div>
              <div className="text-sm text-gray-500">{isLead ? 'Lead' : name ? 'Company' : '—'}</div>
            </div>
          );
        },
      },
      {
        key: 'contactInfo',
        visibilityKey: 'contactInfo',
        label: 'CONTACT INFO',
        render: (_, contact) => (
          <div className="min-w-[220px] space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{contact.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate">{contact.phone || 'No phone'}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        visibilityKey: 'role',
        label: 'ROLE',
        render: (_, contact) => (
          <TableCellRole
            isPrimaryContact={contact.isPrimaryContact}
            roleLabel={contact.contactRole}
          />
        ),
      },
      {
        key: 'owner',
        visibilityKey: 'owner',
        label: 'OWNER',
        render: (_, contact) => <TableCellOwner user={contact.assignedTo} />,
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, contact) => <TableCellCreated dateString={contact.createdAt} />,
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, contact) => <TableCellStatusPill status={contact.status} />,
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_, contact) => <TableCellDateOnly dateString={contact.updatedAt} />,
      },
      {
        key: 'department',
        visibilityKey: 'department',
        label: 'DEPARTMENT',
        render: (_, contact) => tableTextCell(contact.department),
      },
      {
        key: 'jobTitle',
        visibilityKey: 'jobTitle',
        label: 'JOB TITLE',
        render: (_, contact) => tableTextCell(contact.jobTitle),
      },
      {
        key: 'source',
        visibilityKey: 'source',
        label: 'SOURCE',
        render: (_, contact) => (
          <span className="whitespace-nowrap text-sm capitalize text-gray-600">
            {humanizeField(contact.source) || '—'}
          </span>
        ),
      },
      {
        key: 'preferredContactMethod',
        visibilityKey: 'preferredContactMethod',
        label: 'PREFERRED METHOD',
        render: (_, contact) => (
          <span className="whitespace-nowrap text-sm text-gray-600">
            {humanizeField(contact.preferredContactMethod || contact.preferredChannel) || '—'}
          </span>
        ),
      },
      {
        key: 'companyName',
        visibilityKey: 'companyName',
        label: 'CO. NAME (TEXT)',
        render: (_, contact) => tableTextCell(contact.companyName),
      },
      {
        key: 'city',
        visibilityKey: 'city',
        label: 'CITY',
        render: (_, contact) => tableTextCell(contact.city),
      },
      {
        key: 'state',
        visibilityKey: 'state',
        label: 'STATE',
        render: (_, contact) => tableTextCell(contact.state),
      },
      {
        key: 'country',
        visibilityKey: 'country',
        label: 'COUNTRY',
        render: (_, contact) => tableTextCell(contact.country),
      },
      {
        key: 'zipCode',
        visibilityKey: 'zipCode',
        label: 'ZIP',
        render: (_, contact) => tableTextCell(contact.zipCode),
      },
      {
        key: 'linkedIn',
        visibilityKey: 'linkedIn',
        label: 'LINKEDIN',
        render: (_, contact) => {
          const url = contact.linkedIn || contact.linkedinUrl || contact.linkedin;
          return url ? (
            <a
              href={url.startsWith('http') ? url : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block max-w-[140px] truncate text-sm text-orange-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Link
            </a>
          ) : (
            tableTextCell(null)
          );
        },
      },
      {
        key: 'twitter',
        visibilityKey: 'twitter',
        label: 'TWITTER / X',
        render: (_, contact) => tableTextCell(contact.twitter),
      },
      {
        key: 'notes',
        visibilityKey: 'notes',
        label: 'NOTES',
        render: (_, contact) => (
          <span
            className="inline-block max-w-[200px] line-clamp-2 text-sm text-gray-600"
            title={contact.notes || ''}
          >
            {truncateText(contact.notes, 80)}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, contact) => {
          const canEditContact = canEditCRMRecord('contacts', contact);
          const canDeleteContact = canManageCRM('contacts');
          return (
          <div className="flex min-w-[148px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {/* More options dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-teal-600 hover:bg-teal-50"
                title="More options"
                onClick={(e) => {
                  e.stopPropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  setActionMenu((prev) =>
                    prev?.id === contact.id
                      ? null
                      : { id: contact.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                  );
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            {canEditContact ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-emerald-600 hover:bg-emerald-50"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/sales/contacts/${contact.id}/edit`);
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
              disabled={!contact.email}
              onClick={(e) => {
                e.stopPropagation();
                if (contact.email) window.location.href = `mailto:${contact.email}`;
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
            {canDeleteContact ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                title="Delete"
                disabled={deletingId === contact.id}
                onClick={(e) => handleDeleteContact(e, contact.id)}
              >
                {deletingId === contact.id ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
          );
        },
      },
    ],
    [router, deletingId, handleDeleteContact]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.contact) out.push(byKey.contact);
    if (byKey.company) out.push(byKey.company);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return bindSortableColumns(out);
  }, [allTableColumns, columnVisibility, columnOrder, bindSortableColumns]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Contacts"
        subtitle="Manage your contacts and relationships"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sales', href: '/sales' },
          { label: 'Contacts', href: '/sales/contacts' },
        ]}
        showActions={true}
        onAddClick={() => router.push('/sales/contacts/new')}
        onFilterClick={openFilterModal}
        onImportClick={() => console.log('Import clicked')}
        onExportClick={() => console.log('Export clicked')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Contacts"
          value={contactStats.all}
          subtitle={contactStats.all === 0 ? 'No contacts' : `${contactStats.all} ${contactStats.all === 1 ? 'contact' : 'contacts'}`}
          icon={Users}
          colorScheme="orange"
        />
        <KPICard
          title="With Email"
          value={contactStats.withEmail}
          subtitle={`${Math.round((contactStats.withEmail / contactStats.all) * 100) || 0}% of total`}
          icon={Mail}
          colorScheme="orange"
        />
        <KPICard
          title="With Phone"
          value={contactStats.withPhone}
          subtitle={`${Math.round((contactStats.withPhone / contactStats.all) * 100) || 0}% of total`}
          icon={Phone}
          colorScheme="orange"
        />
        <KPICard
          title="With Company"
          value={contactStats.withCompany}
          subtitle={`${Math.round((contactStats.withCompany / contactStats.all) * 100) || 0}% of total`}
          icon={Building2}
          colorScheme="orange"
        />
      </div>

      {/* Tabs + column picker */}
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
          onAddClick={() => router.push('/sales/contacts/new')}
          addTitle="Add Contact"
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
              Contact and company stay visible. Actions stay visible. Toggle other fields; drag the grip to reorder.
              An orange line shows where the row will land.
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

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredContacts.length}</span> result
        {filteredContacts.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Loading contacts..." />
          </div>
        ) : (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedContacts}
              keyField="id"
              variant="modern"
              onRowClick={(row) => router.push(`/sales/contacts/${row.id}`)}
              resizableColumns
              columnWidths={columnWidths}
              onColumnWidthsChange={setColumnWidths}
            />
            {paginatedContacts.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <div className="text-gray-400 mb-2">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No contacts found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeTab !== 'all' ? 'Try adjusting your filters' : 'Add your first contact to get started'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <Button variant="primary" onClick={() => router.push('/sales/contacts/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredContacts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={!!deleteContactId}
        onClose={() => {
          if (deletingId) return;
          setDeleteContactId(null);
        }}
        title="Delete Contact"
        size="md"
        closeOnBackdrop={!deletingId}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-900">
              <span className="font-semibold">This action cannot be undone</span>
            </p>
          </div>
          <p className="text-sm text-gray-700">Are you sure you want to delete this contact?</p>
          <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={!!deletingId}
              onClick={() => setDeleteContactId(null)}
              className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!!deletingId}
              onClick={confirmDeleteContact}
              className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
            >
              {deletingId ? 'Deleting…' : 'Delete Contact'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Contacts"
        size="xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">Refine your contact search</p>
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
              <span className="text-sm font-medium text-gray-700">Preferred Method</span>
              <select
                value={draftFilters.preferredContactMethod}
                onChange={(e) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    preferredContactMethod: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select method</option>
                {preferredContactOptions.map((opt) => (
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
              <span className="text-sm font-medium text-gray-700">Email Availability</span>
              <select
                value={draftFilters.hasEmail}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, hasEmail: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">All</option>
                <option value="yes">Has email</option>
                <option value="no">No email</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Phone Availability</span>
              <select
                value={draftFilters.hasPhone}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, hasPhone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">All</option>
                <option value="yes">Has phone</option>
                <option value="no">No phone</option>
              </select>
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
        </div>
      </Modal>

      {actionMenu &&
        (() => {
          const row = contacts.find((c) => c.id === actionMenu.id);
          if (!row) return null;
          return (
            <TableRowActionMenuPortal
              open
              anchor={{
                top: actionMenu.top,
                left: actionMenu.left,
                triggerEl: actionMenu.triggerEl,
              }}
              onClose={() => setActionMenu(null)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setActionMenu(null);
                  console.log('Create meet for contact', row.id);
                }}
              >
                <Video className="h-4 w-4 shrink-0 text-teal-600" />
                Create Meet
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setActionMenu(null);
                  console.log('Create task for contact', row.id);
                }}
              >
                <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" />
                Create Task
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setActionMenu(null);
                  navigator.clipboard.writeText(`${window.location.origin}/sales/contacts/${row.id}`);
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Copy URL
              </button>
            </TableRowActionMenuPortal>
          );
        })()}
    </div>
  );
}
