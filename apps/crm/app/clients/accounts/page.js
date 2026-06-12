'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Users,
  Globe,
  MapPin,
  TrendingUp,
  Pencil,
  Trash2,
  MoreHorizontal,
  Video,
  ClipboardList,
  Link2,
  UserPlus,
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
  TableCellCreated,
  TableCellDateOnly,
  TableCellOwner,
  TableCellAccountStatusSelect,
  formatTableDate,
  TableRowActionMenuPortal,
  Modal,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import clientAccountService from '../../../lib/api/clientAccountService';
import contactService from '../../../lib/api/contactService';
import { canManageCRM, canWriteCRM } from '../../../lib/rbac';

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.clientAccounts.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.clientAccounts.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'crm.clientAccounts.tableColumnWidths';

const TOGGLEABLE_COLUMNS = [
  { key: 'primaryContact', label: 'Primary contact' },
  { key: 'healthScore', label: 'Health score' },
  { key: 'dealValue', label: 'Deal value' },
  { key: 'contactsCount', label: 'Contacts' },
  { key: 'location', label: 'Location' },
  { key: 'industry', label: 'Industry' },
  { key: 'assignedTo', label: 'Account manager' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'accountType', label: 'Account type' },
  { key: 'billingCycle', label: 'Billing cycle' },
  { key: 'website', label: 'Website' },
  { key: 'companyPhone', label: 'Company phone' },
  { key: 'companyEmail', label: 'Company email' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'zipCode', label: 'ZIP / postal' },
  { key: 'employees', label: 'Employees' },
  { key: 'description', label: 'Description' },
  { key: 'linkedIn', label: 'LinkedIn' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'notes', label: 'Notes' },
  { key: 'contractStartDate', label: 'Contract start' },
  { key: 'contractEndDate', label: 'Contract end' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_ON_KEYS = new Set([
  'primaryContact',
  'healthScore',
  'dealValue',
  'contactsCount',
  'location',
  'industry',
  'assignedTo',
  'status',
  'createdAt',
]);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_KEYS.has(key);
  return acc;
}, {});

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

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

function truncateText(text, max = 80) {
  if (text == null || text === '') return '—';
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export default function ClientAccountsPage() {
  const initialFilters = useMemo(
    () => ({
      status: '',
      industry: '',
      accountType: '',
      billingCycle: '',
      assignedToId: '',
      companyQuery: '',
      dateRange: '',
      valueRange: '',
      healthRange: '',
    }),
    []
  );
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteAccountId, setDeleteAccountId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenu, setActionMenu] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [loadingActions, setLoadingActions] = useState({});
  const canCreateClientAccounts = canWriteCRM('client_accounts');
  const itemsPerPage = 15;

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
    fetchAccounts();
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

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [accountsRes, contactsRes] = await Promise.all([
        clientAccountService.getAll({
          sort: 'createdAt:desc',
          'pagination[pageSize]': 100,
          populate: ['assignedTo'],
        }),
        contactService.getAll({
          sort: 'createdAt:desc',
          'pagination[pageSize]': 1000,
          populate: ['clientAccount'],
        }),
      ]);

      const accountList = Array.isArray(accountsRes.data) ? accountsRes.data : [];
      const contactList = Array.isArray(contactsRes.data) ? contactsRes.data : [];

      const contactsByAccountId = new Map();
      for (const contact of contactList) {
        const ca = contact?.clientAccount;
        const accountId =
          ca && typeof ca === 'object' ? ca.id ?? ca.documentId ?? null : ca ?? null;
        if (accountId == null) continue;
        const key = String(accountId);
        if (!contactsByAccountId.has(key)) contactsByAccountId.set(key, []);
        contactsByAccountId.get(key).push(contact);
      }

      for (const list of contactsByAccountId.values()) {
        list.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
      }

      const hydratedAccounts = accountList.map((account) => ({
        ...account,
        contacts: contactsByAccountId.get(String(account.id)) || [],
      }));

      setAccounts(hydratedAccounts);
    } catch (err) {
      console.error('Error fetching client accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = useCallback(
    async (e, accountId) => {
      e.stopPropagation();
      if (!accountId || deletingId) return;
      if (!canManageCRM('client_accounts')) return;
      setDeleteAccountId(accountId);
    },
    [deletingId]
  );

  const confirmDeleteAccount = useCallback(async () => {
    if (!deleteAccountId || deletingId) return;
    if (!canManageCRM('client_accounts')) {
      setDeleteAccountId(null);
      return;
    }
    try {
      setDeletingId(deleteAccountId);
      await clientAccountService.delete(deleteAccountId);
      setAccounts((prev) => prev.filter((a) => a.id !== deleteAccountId));
      setDeleteAccountId(null);
    } catch (err) {
      console.error('Error deleting client account:', err);
    } finally {
      setDeletingId(null);
    }
  }, [deleteAccountId, deletingId]);

  const handleStatusUpdate = useCallback(
    async (accountId, newStatus) => {
      if (!accountId || !canWriteCRM('client_accounts')) return;
      const loadingKey = `${accountId}-${newStatus}`;
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));
      try {
        await clientAccountService.update(accountId, { status: newStatus });
        setAccounts((prev) =>
          prev.map((a) => (a.id === accountId ? { ...a, status: newStatus } : a))
        );
      } catch (err) {
        console.error('Error updating account status:', err);
        alert('Failed to update status. Please try again.');
      } finally {
        setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
      }
    },
    []
  );

  // Statistics
  const clientStats = {
    all: accounts.length,
    active: accounts.filter((a) => a.status?.toLowerCase() === 'active').length,
    inactive: accounts.filter((a) => a.status?.toLowerCase() === 'inactive').length,
  };

  const statusFilterOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' },
    ],
    []
  );

  const industryFilterOptions = useMemo(() => {
    const values = new Set();
    for (const account of accounts) {
      const industry = account?.industry;
      if (industry) values.add(String(industry).toUpperCase());
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [accounts]);

  const accountTypeFilterOptions = useMemo(() => {
    const values = new Set();
    for (const account of accounts) {
      const type = account?.accountType;
      if (type) values.add(String(type).toUpperCase());
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [accounts]);

  const billingCycleFilterOptions = useMemo(() => {
    const values = new Set();
    for (const account of accounts) {
      const cycle = account?.billingCycle;
      if (cycle) values.add(String(cycle).toUpperCase());
    }
    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [accounts]);

  const assigneeFilterOptions = useMemo(() => {
    const map = new Map();
    for (const account of accounts) {
      const user = account?.assignedTo;
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
  }, [accounts]);

  // Filter accounts
  const filteredAccounts = accounts.filter((account) => {
    if (!account) return false;
    const matchesSearch =
      searchQuery === '' ||
      account.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.contacts?.some(
        (c) =>
          c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesTab =
      activeTab === 'all' || account.status?.toLowerCase() === activeTab.toLowerCase();
    const status = String(account.status || '').toUpperCase();
    const industry = String(account.industry || '').toUpperCase();
    const accountType = String(account.accountType || '').toUpperCase();
    const billingCycle = String(account.billingCycle || '').toUpperCase();
    const assignedId =
      account.assignedTo && typeof account.assignedTo === 'object'
        ? String(account.assignedTo.id ?? account.assignedTo.documentId ?? '')
        : String(account.assignedTo || '');
    const companyName = String(account.companyName || '').toLowerCase();
    const createdAt = account.createdAt ? new Date(account.createdAt) : null;
    const now = new Date();
    const daysSinceCreated =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const dealValue = Number(account.dealValue || 0);
    const healthScore = Number(account.healthScore ?? 0);

    const matchesAdvanced =
      (!appliedFilters.status || status === appliedFilters.status) &&
      (!appliedFilters.industry || industry === appliedFilters.industry) &&
      (!appliedFilters.accountType || accountType === appliedFilters.accountType) &&
      (!appliedFilters.billingCycle || billingCycle === appliedFilters.billingCycle) &&
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
        (appliedFilters.valueRange === 'gt5m' && dealValue > 5000000)) &&
      (!appliedFilters.healthRange ||
        (appliedFilters.healthRange === '0_49' && healthScore <= 49) ||
        (appliedFilters.healthRange === '50_74' && healthScore >= 50 && healthScore <= 74) ||
        (appliedFilters.healthRange === '75_100' && healthScore >= 75));

    return matchesSearch && matchesTab && matchesAdvanced;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
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

  const tabItems = [
    { key: 'all', label: 'All Clients', count: clientStats.all },
    { key: 'active', label: 'Active', count: clientStats.active },
    { key: 'inactive', label: 'Inactive', count: clientStats.inactive },
  ];

  const allTableColumns = useMemo(
    () => [
      {
        key: 'company',
        label: 'COMPANY',
        fixed: true,
        render: (_, account) => {
          const primaryContact = account.contacts?.find((c) => c.isPrimaryContact) || account.contacts?.[0];
          const contactName = primaryContact
            ? `${primaryContact.firstName || ''} ${primaryContact.lastName || ''}`.trim()
            : null;
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Avatar
                fallback={account.companyName?.[0] || 'C'}
                alt={account.companyName}
                size="sm"
                className="flex-shrink-0 bg-blue-100 text-blue-600"
              />
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {account.companyName || 'Unnamed'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {contactName || 'No primary contact'}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'primaryContact',
        visibilityKey: 'primaryContact',
        label: 'PRIMARY CONTACT',
        render: (_, account) => {
          const primaryContact = account.contacts?.find((c) => c.isPrimaryContact) || account.contacts?.[0];
          return (
            <div className="space-y-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {primaryContact?.email || account.email || 'No email'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {primaryContact?.phone || account.phone || 'No phone'}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: 'healthScore',
        visibilityKey: 'healthScore',
        label: 'HEALTH SCORE',
        render: (_, account) => {
          const score = account.healthScore ?? 0;
          const colorClass =
            score >= 75
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : score >= 50
              ? 'bg-orange-100 text-orange-700 border-orange-200'
              : 'bg-red-100 text-red-700 border-red-200';
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${colorClass}`}
            >
              <TrendingUp className="w-3 h-3" />
              {score}%
            </span>
          );
        },
      },
      {
        key: 'dealValue',
        visibilityKey: 'dealValue',
        label: 'DEAL VALUE',
        render: (_, account) => (
          <span className="font-semibold text-gray-900 whitespace-nowrap">
            {formatCurrency(account.dealValue || 0)}
          </span>
        ),
      },
      {
        key: 'contactsCount',
        visibilityKey: 'contactsCount',
        label: 'CONTACTS',
        render: (_, account) => (
          <div className="flex items-center gap-2 min-w-[80px]">
            <UserPlus className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {account.contacts ? account.contacts.length : 0}
            </span>
          </div>
        ),
      },
      {
        key: 'location',
        visibilityKey: 'location',
        label: 'LOCATION',
        render: (_, account) => {
          const parts = [account.city, account.state, account.country].filter(Boolean);
          return (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-[130px]">
              {parts.length > 0 ? (
                <>
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{parts.join(', ')}</span>
                </>
              ) : (
                <span className="text-gray-400">Not specified</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'industry',
        visibilityKey: 'industry',
        label: 'INDUSTRY',
        render: (_, account) => {
          const industry = account.industry ? String(account.industry).replace(/_/g, ' ') : '';
          return industry ? (
            <span className="inline-flex rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-800 whitespace-nowrap">
              {industry}
            </span>
          ) : (
            <span className="text-sm text-gray-400">No industry</span>
          );
        },
      },
      {
        key: 'assignedTo',
        visibilityKey: 'assignedTo',
        label: 'ACCOUNT MANAGER',
        render: (_, account) => <TableCellOwner user={account.assignedTo} />,
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, account) => {
          const saving = Object.entries(loadingActions).some(
            ([key, active]) => active && key.startsWith(`${account.id}-`)
          );
          return (
            <TableCellAccountStatusSelect
              status={account.status}
              onStatusChange={(next) => handleStatusUpdate(account.id, next)}
              saving={saving}
              canEdit={canWriteCRM('client_accounts')}
            />
          );
        },
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_, account) => <TableCellCreated dateString={account.createdAt} />,
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_, account) => <TableCellDateOnly dateString={account.updatedAt} />,
      },
      {
        key: 'accountType',
        visibilityKey: 'accountType',
        label: 'ACCOUNT TYPE',
        render: (_, account) => tableTextCell(account.accountType),
      },
      {
        key: 'billingCycle',
        visibilityKey: 'billingCycle',
        label: 'BILLING CYCLE',
        render: (_, account) => tableTextCell(account.billingCycle),
      },
      {
        key: 'website',
        visibilityKey: 'website',
        label: 'WEBSITE',
        render: (_, account) =>
          account.website ? (
            <a
              href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-orange-600 hover:underline max-w-[180px] truncate"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{account.website}</span>
            </a>
          ) : (
            tableTextCell(null)
          ),
      },
      {
        key: 'companyPhone',
        visibilityKey: 'companyPhone',
        label: 'CO. PHONE',
        render: (_, account) => (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{account.phone || '—'}</span>
          </div>
        ),
      },
      {
        key: 'companyEmail',
        visibilityKey: 'companyEmail',
        label: 'CO. EMAIL',
        render: (_, account) => (
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[160px]">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate">{account.email || '—'}</span>
          </div>
        ),
      },
      {
        key: 'address',
        visibilityKey: 'address',
        label: 'ADDRESS',
        render: (_, account) => (
          <div className="flex items-start gap-2 text-sm text-gray-600 max-w-[220px]">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2" title={account.address || ''}>
              {account.address || '—'}
            </span>
          </div>
        ),
      },
      { key: 'city', visibilityKey: 'city', label: 'CITY', render: (_, account) => tableTextCell(account.city) },
      { key: 'state', visibilityKey: 'state', label: 'STATE', render: (_, account) => tableTextCell(account.state) },
      { key: 'country', visibilityKey: 'country', label: 'COUNTRY', render: (_, account) => tableTextCell(account.country) },
      { key: 'zipCode', visibilityKey: 'zipCode', label: 'ZIP', render: (_, account) => tableTextCell(account.zipCode) },
      { key: 'employees', visibilityKey: 'employees', label: 'EMPLOYEES', render: (_, account) => tableTextCell(account.employees) },
      {
        key: 'description',
        visibilityKey: 'description',
        label: 'DESCRIPTION',
        render: (_, account) => (
          <span className="text-sm text-gray-600 max-w-[240px] inline-block line-clamp-2" title={account.description || ''}>
            {truncateText(account.description, 120)}
          </span>
        ),
      },
      {
        key: 'linkedIn',
        visibilityKey: 'linkedIn',
        label: 'LINKEDIN',
        render: (_, account) =>
          account.linkedIn ? (
            <a
              href={account.linkedIn.startsWith('http') ? account.linkedIn : `https://${account.linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:underline truncate max-w-[160px] inline-block"
              onClick={(e) => e.stopPropagation()}
            >
              Link
            </a>
          ) : (
            tableTextCell(null)
          ),
      },
      { key: 'twitter', visibilityKey: 'twitter', label: 'TWITTER / X', render: (_, account) => tableTextCell(account.twitter) },
      {
        key: 'notes',
        visibilityKey: 'notes',
        label: 'NOTES',
        render: (_, account) => (
          <span className="text-sm text-gray-600 max-w-[200px] inline-block line-clamp-2" title={account.notes || ''}>
            {truncateText(account.notes, 100)}
          </span>
        ),
      },
      {
        key: 'contractStartDate',
        visibilityKey: 'contractStartDate',
        label: 'CONTRACT START',
        render: (_, account) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {account.contractStartDate ? formatTableDate(account.contractStartDate) : '—'}
          </span>
        ),
      },
      {
        key: 'contractEndDate',
        visibilityKey: 'contractEndDate',
        label: 'CONTRACT END',
        render: (_, account) => (
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {account.contractEndDate ? formatTableDate(account.contractEndDate) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, account) => {
          const canEditClientAccount = canWriteCRM('client_accounts');
          const canDeleteClientAccount = canManageCRM('client_accounts');
          return (
          <div className="flex min-w-[148px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
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
                    prev?.id === account.id
                      ? null
                      : { id: account.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
                  );
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            {canEditClientAccount ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-emerald-600 hover:bg-emerald-50"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/clients/accounts/${account.id}/edit`);
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
              disabled={!account.email}
              onClick={(e) => {
                e.stopPropagation();
                if (account.email) window.location.href = `mailto:${account.email}`;
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
            {canDeleteClientAccount ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                title="Delete"
                disabled={deletingId === account.id}
                onClick={(e) => handleDeleteAccount(e, account.id)}
              >
                {deletingId === account.id ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>
          );
        },
      },
    ],
    [router, deletingId, handleDeleteAccount, handleStatusUpdate, loadingActions]
  );

  const visibleTableColumns = useMemo(() => {
    const byKey = Object.fromEntries(allTableColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.company) out.push(byKey.company);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return out;
  }, [allTableColumns, columnVisibility, columnOrder]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Client Accounts"
        subtitle="Manage your client accounts and relationships"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Clients', href: '/clients' },
          { label: 'Accounts', href: '/clients/accounts' },
        ]}
        showActions={true}
        onAddClick={canCreateClientAccounts ? () => router.push('/clients/accounts/new') : undefined}
        onFilterClick={openFilterModal}
        onImportClick={() => console.log('Import clicked')}
        onExportClick={() => console.log('Export clicked')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Clients"
          value={clientStats.all}
          subtitle={clientStats.all === 0 ? 'No clients' : `${clientStats.all} ${clientStats.all === 1 ? 'client' : 'clients'}`}
          icon={Building2}
          colorScheme="orange"
        />
        <KPICard
          title="Active Clients"
          value={clientStats.active}
          subtitle={clientStats.active === 0 ? 'No clients' : `${clientStats.active} ${clientStats.active === 1 ? 'client' : 'clients'}`}
          icon={CheckCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Inactive Clients"
          value={clientStats.inactive}
          subtitle={clientStats.inactive === 0 ? 'No clients' : `${clientStats.inactive} ${clientStats.inactive === 1 ? 'client' : 'clients'}`}
          icon={AlertCircle}
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
          showAdd={canCreateClientAccounts}
          onAddClick={canCreateClientAccounts ? () => router.push('/clients/accounts/new') : undefined}
          addTitle="Add Client Account"
          showFilter={true}
          onFilterClick={openFilterModal}
          showColumnVisibility={true}
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show or hide columns"
          showExport={true}
          onExportClick={() => console.log('Export clicked')}
          exportTitle="Export"
        />
        <TableColumnPicker
          open={columnPickerOpen}
          description="Company and actions stay visible. Toggle other fields; drag column edges in the table to resize."
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

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredAccounts.length}</span> result
        {filteredAccounts.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Loading client accounts..." />
          </div>
        ) : (
          <>
            <Table
              columns={visibleTableColumns}
              data={paginatedAccounts}
              keyField="id"
              variant="modern"
              onRowClick={(row) => router.push(`/clients/accounts/${row.id}`)}
              {...tableResizeProps}
            />
            {paginatedAccounts.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <div className="text-gray-400 mb-2">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No client accounts found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeTab !== 'all'
                    ? 'Try adjusting your filters'
                    : canCreateClientAccounts
                      ? 'Add your first client account to get started'
                      : 'No client accounts are available yet.'}
                </p>
                {!searchQuery && activeTab === 'all' && canCreateClientAccounts && (
                  <Button variant="primary" onClick={() => router.push('/clients/accounts/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client Account
                  </Button>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAccounts.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={!!deleteAccountId}
        onClose={() => {
          if (deletingId) return;
          setDeleteAccountId(null);
        }}
        title="Delete Client Account"
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
          <p className="text-sm text-gray-700">Are you sure you want to delete this client account?</p>
          <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="muted"
              disabled={!!deletingId}
              onClick={() => setDeleteAccountId(null)}
              className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={!!deletingId}
              onClick={confirmDeleteAccount}
              className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
            >
              {deletingId ? 'Deleting…' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Client Accounts"
        size="xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">Refine your client account search</p>
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
              <span className="text-sm font-medium text-gray-700">Industry</span>
              <select
                value={draftFilters.industry}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, industry: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select industry</option>
                {industryFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Account Type</span>
              <select
                value={draftFilters.accountType}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, accountType: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select account type</option>
                {accountTypeFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Billing Cycle</span>
              <select
                value={draftFilters.billingCycle}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, billingCycle: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select billing cycle</option>
                {billingCycleFilterOptions.map((opt) => (
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
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-700">Health Score</span>
              <select
                value={draftFilters.healthRange}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, healthRange: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">Select health range</option>
                <option value="0_49">0 - 49</option>
                <option value="50_74">50 - 74</option>
                <option value="75_100">75 - 100</option>
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
          const row = accounts.find((a) => a.id === actionMenu.id);
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
                  console.log('Create meet for account', row.id);
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
                  console.log('Create task for account', row.id);
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
                  navigator.clipboard.writeText(`${window.location.origin}/clients/accounts/${row.id}`);
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
