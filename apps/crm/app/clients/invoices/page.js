'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Receipt,
  CheckCircle, AlertCircle, Pencil, Trash2, Send, MoreHorizontal, Link2, Eye, Mail,
} from 'lucide-react';
import {
  Button, Table, Pagination, Avatar, Badge, LoadingSpinner,
  TabsWithActions, KPICard, Modal,
  TableCellCreated, TableCellDateOnly, TableCellText, TableCellTitleSubtitle, TableRowActionMenuPortal,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import invoiceService from '../../../lib/api/invoiceService';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const STATUS_CONFIG = {
  DRAFT:    { variant: 'default',  label: 'Draft' },
  SENT:     { variant: 'info',     label: 'Sent' },
  PAID:     { variant: 'success',  label: 'Paid' },
  OVERDUE:  { variant: 'danger',   label: 'Overdue' },
  CANCELLED:{ variant: 'default',  label: 'Cancelled' },
  PARTIAL:  { variant: 'warning',  label: 'Partial' },
};

const COLUMN_VISIBILITY_STORAGE_KEY = 'crm.invoices.tableColumnVisibility';
const COLUMN_ORDER_STORAGE_KEY = 'crm.invoices.tableColumnOrder';
const COLUMN_WIDTHS_STORAGE_KEY = 'crm.invoices.tableColumnWidths';

const TOGGLEABLE_COLUMNS = [
  { key: 'client', label: 'Bill to' },
  { key: 'total', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceDate', label: 'Date' },
  { key: 'dueDate', label: 'Due date' },
];

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key);

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = true;
  return acc;
}, {});

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalItems, setTotalItems]   = useState(0);
  const itemsPerPage = 15;

  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMenu, setActionMenu]       = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
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
    if (!columnPickerOpen) return undefined;
    const onOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [columnPickerOpen, setColumnPickerOpen, toolbarRef]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        'pagination[page]': currentPage,
        'pagination[pageSize]': itemsPerPage,
        sort: 'createdAt:desc',
        populate: ['assignedTo', 'leadCompany', 'clientAccount'],
      };
      if (activeTab !== 'all') params.filters = { status: activeTab.toUpperCase() };
      const res = await invoiceService.getAll(params);
      setInvoices(res.data || []);
      setTotalPages(res.meta?.pagination?.pageCount ?? 1);
      setTotalItems(res.meta?.pagination?.total ?? 0);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const filtered = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.billToName?.toLowerCase().includes(q) ||
      inv.billToCompany?.toLowerCase().includes(q) ||
      inv.fromOrgName?.toLowerCase().includes(q)
    );
  });

  const stats = {
    all:       totalItems,
    draft:     invoices.filter((i) => i.status === 'DRAFT').length,
    sent:      invoices.filter((i) => i.status === 'SENT').length,
    paid:      invoices.filter((i) => i.status === 'PAID').length,
    overdue:   invoices.filter((i) => i.status === 'OVERDUE').length,
    partial:   invoices.filter((i) => i.status === 'PARTIAL').length,
  };

  const openDeleteInvoice = (inv) => {
    setDeleteInvoiceId(inv.id);
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteInvoiceId || deletingId) return;
    try {
      setDeletingId(deleteInvoiceId);
      await invoiceService.delete(deleteInvoiceId);
      setDeleteInvoiceId(null);
      fetchInvoices();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'invoice',
        label: 'INVOICE',
        fixed: true,
        render: (_, inv) => (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <TableCellTitleSubtitle title={inv.invoiceNumber} subtitle={inv.documentType || 'INVOICE'} />
          </div>
        ),
      },
      {
        key: 'client',
        visibilityKey: 'client',
        label: 'BILL TO',
        render: (_, inv) => (
          <div className="flex items-center gap-2 min-w-[140px]">
            <Avatar fallback={(inv.billToCompany || inv.billToName || 'C')[0]} size="sm" className="flex-shrink-0" />
            <TableCellTitleSubtitle
              title={inv.billToName || '—'}
              subtitle={inv.billToCompany || inv.billToEmail || '—'}
            />
          </div>
        ),
      },
      {
        key: 'total',
        visibilityKey: 'total',
        label: 'AMOUNT',
        render: (_, inv) => (
          <TableCellText value={formatCurrency(inv.total || 0)} emphasized />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_, inv) => {
          const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
          return <Badge variant={cfg.variant}>{cfg.label.toUpperCase()}</Badge>;
        },
      },
      {
        key: 'invoiceDate',
        visibilityKey: 'invoiceDate',
        label: 'DATE',
        render: (_, inv) => <TableCellCreated dateString={inv.invoiceDate || inv.createdAt} />,
      },
      {
        key: 'dueDate',
        visibilityKey: 'dueDate',
        label: 'DUE DATE',
        render: (_, inv) => <TableCellDateOnly dateString={inv.dueDate} />,
      },
      {
        key: 'actions',
        label: 'ACTIONS',
        fixed: true,
        render: (_, inv) => (
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
                    prev?.id === inv.id
                      ? null
                      : { id: inv.id, top: r.bottom + 4, left: r.left, triggerEl: e.currentTarget }
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
              title="Edit invoice"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients/invoices/${inv.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
              title="Send mail"
              disabled={!inv.billToEmail}
              onClick={(e) => {
                e.stopPropagation();
                if (inv.billToEmail) window.location.href = `mailto:${inv.billToEmail}`;
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete invoice"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteInvoice(inv);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  const visibleColumns = useMemo(() => {
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.invoice) out.push(byKey.invoice);
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key]);
    }
    if (byKey.actions) out.push(byKey.actions);
    return out;
  }, [columns, columnVisibility, columnOrder]);

  const tabItems = [
    { key: 'all',       label: 'All invoices', count: stats.all },
    { key: 'draft',     label: 'Draft', count: stats.draft },
    { key: 'sent',      label: 'Sent', count: stats.sent },
    { key: 'paid',      label: 'Paid', count: stats.paid },
    { key: 'overdue',   label: 'Overdue', count: stats.overdue },
    { key: 'partial',   label: 'Partial', count: stats.partial },
  ];

  return (
    <>
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Invoices"
        subtitle="Create and manage client invoices"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Clients', href: '/clients' },
          { label: 'Invoices', href: '/clients/invoices' },
        ]}
        showActions={true}
        onAddClick={() => router.push('/clients/invoices/new')}
        onFilterClick={() => {}}
        onExportClick={() => {}}
      />

      {/* KPI Cards — four summary metrics; Overdue/Partial remain in tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'Total', value: stats.all, icon: Receipt, color: 'orange' },
          { title: 'Draft', value: stats.draft, icon: Receipt, color: 'orange' },
          { title: 'Sent', value: stats.sent, icon: Send, color: 'orange' },
          { title: 'Paid', value: stats.paid, icon: CheckCircle, color: 'orange' },
        ].map((k) => (
          <KPICard
            key={k.title}
            compact
            title={k.title}
            value={k.value}
            subtitle={`${k.value} invoice${k.value !== 1 ? 's' : ''}`}
            icon={k.icon}
            colorScheme={k.color}
          />
        ))}
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
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search invoices..."
          showAdd={true}
          onAddClick={() => router.push('/clients/invoices/new')}
          addTitle="New Invoice"
          showFilter={true}
          onFilterClick={() => setShowFilterModal(true)}
          showColumnVisibility={true}
          onColumnVisibilityClick={() => setColumnPickerOpen((o) => !o)}
          columnVisibilityTitle="Show or hide columns"
          showExport={true}
          onExportClick={() => {}}
        />
        <TableColumnPicker
          open={columnPickerOpen}
          description="Invoice and actions stay visible. Drag column edges in the table to resize."
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
        Showing <span className="font-semibold text-gray-900">{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''}
        {searchQuery && ` for "${searchQuery}"`}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={fetchInvoices} className="ml-auto">Retry</Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Loading invoices..." />
          </div>
        ) : (
          <>
            <Table columns={visibleColumns} data={filtered} keyField="id" variant="modern"
              onRowClick={(row) => router.push(`/clients/invoices/${row.id}`)}
              {...tableResizeProps} />
            {filtered.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No invoices found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeTab !== 'all' ? 'Try adjusting your filters' : 'Create your first invoice to get started'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <Button variant="primary" onClick={() => router.push('/clients/invoices/new')}>
                    <Plus className="w-4 h-4 mr-2" /> Create Invoice
                  </Button>
                )}
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination currentPage={currentPage} totalPages={totalPages}
                  totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
              </div>
            )}
          </>
        )}
      </div>
      {actionMenu &&
        (() => {
          const row = invoices.find((inv) => inv.id === actionMenu.id);
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
                  router.push(`/clients/invoices/${row.id}`);
                }}
              >
                <Eye className="h-4 w-4 shrink-0 text-teal-600" />
                View invoice
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setActionMenu(null);
                  router.push(`/clients/invoices/${row.id}/edit`);
                }}
              >
                <Pencil className="h-4 w-4 shrink-0 text-teal-600" />
                Edit invoice
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!row.billToEmail}
                onClick={() => {
                  setActionMenu(null);
                  if (row.billToEmail) window.location.href = `mailto:${row.billToEmail}`;
                }}
              >
                <Mail className="h-4 w-4 shrink-0 text-teal-600" />
                Email client
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                onClick={() => {
                  setActionMenu(null);
                  navigator.clipboard.writeText(`${window.location.origin}/clients/invoices/${row.id}`);
                }}
              >
                <Link2 className="h-4 w-4 shrink-0 text-teal-600" />
                Copy URL
              </button>
            </TableRowActionMenuPortal>
          );
        })()}
    </div>

    <Modal
      isOpen={!!deleteInvoiceId}
      onClose={() => {
        if (deletingId) return;
        setDeleteInvoiceId(null);
      }}
      title="Delete Invoice"
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
        <p className="text-sm text-gray-700">Are you sure you want to delete this invoice?</p>
        <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="muted"
            disabled={!!deletingId}
            onClick={() => setDeleteInvoiceId(null)}
            className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!!deletingId}
            onClick={confirmDeleteInvoice}
            className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
          >
            {deletingId ? 'Deleting…' : 'Delete Invoice'}
          </Button>
        </div>
      </div>
    </Modal>
    <Modal isOpen={showFilterModal} onClose={() => setShowFilterModal(false)} title="Filter Invoices" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Quick filter by status:</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'draft', label: 'Draft' },
            { key: 'sent', label: 'Sent' },
            { key: 'paid', label: 'Paid' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'partial', label: 'Partial' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveTab(item.key);
                setShowFilterModal(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                activeTab === item.key
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowFilterModal(false)}>Close</Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
