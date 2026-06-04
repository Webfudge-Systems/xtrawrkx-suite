'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  FileText,
  CheckCircle,
  Send,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  Mail,
  Link2,
} from 'lucide-react';
import {
  Button,
  Table,
  Pagination,
  Avatar,
  Badge,
  LoadingSpinner,
  TabsWithActions,
  KPICard,
  Modal,
  TableCellCreated,
  TableCellDateOnly,
  TableCellText,
} from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';
import proposalService from '../../../lib/api/proposalService';

const formatCurrency = (value) => {
  if (!value && value !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const STATUS_CONFIG = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'info', label: 'Sent' },
  ACCEPTED: { variant: 'success', label: 'Accepted' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
  EXPIRED: { variant: 'warning', label: 'Expired' },
};

function openClientEmailAboutProposal(p) {
  const email = (p.clientEmail || '').trim();
  if (!email) return;
  const num = (p.proposalNumber || '').trim();
  const subject = encodeURIComponent(num ? `Proposal ${num}` : 'Proposal');
  const body = encodeURIComponent(
    `Hi,\n\nSharing${num ? ` proposal ${num}` : ' our proposal'} for your review.\n\nBest regards`
  );
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

async function copyProposalDetailLink(p) {
  const id = p?.documentId ?? p?.id;
  if (id == null) return;
  const url = `${window.location.origin}/clients/proposals/${id}`;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.prompt('Copy this link:', url);
  }
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const [deleteProposalId, setDeleteProposalId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchProposals = useCallback(async () => {
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
      const res = await proposalService.getAll(params);
      setProposals(res.data || []);
      setTotalPages(res.meta?.pagination?.pageCount ?? 1);
      setTotalItems(res.meta?.pagination?.total ?? 0);
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('Failed to load proposals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const filtered = proposals.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.proposalNumber?.toLowerCase().includes(q) ||
      p.clientCompanyName?.toLowerCase().includes(q) ||
      p.projectName?.toLowerCase().includes(q)
    );
  });

  const stats = {
    all: totalItems,
    draft: proposals.filter((p) => p.status === 'DRAFT').length,
    sent: proposals.filter((p) => p.status === 'SENT').length,
    accepted: proposals.filter((p) => p.status === 'ACCEPTED').length,
    rejected: proposals.filter((p) => p.status === 'REJECTED').length,
    expired: proposals.filter((p) => p.status === 'EXPIRED').length,
  };

  const openDeleteProposal = (proposal) => {
    setDeleteProposalId(proposal.id);
  };

  const confirmDeleteProposal = async () => {
    if (!deleteProposalId || deletingId) return;
    try {
      setDeletingId(deleteProposalId);
      await proposalService.delete(deleteProposalId);
      setDeleteProposalId(null);
      fetchProposals();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      key: 'proposal',
      label: 'PROPOSAL',
      render: (_, p) => {
        const title = p.title || p.projectName || 'Untitled';
        return (
          <div className="flex min-w-[240px] w-full items-start gap-3">
            <Avatar
              fallback={title?.[0] || 'P'}
              alt={title}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">{title}</div>
              <div className="truncate text-sm text-gray-500">
                {`${p.proposalNumber || '—'} · ${p.documentType || 'PROPOSAL'}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'client',
      label: 'CLIENT',
      render: (_, p) => {
        const name = p.clientCompanyName || '—';
        const sub = p.clientEmail || p.clientContactName || '—';
        return (
          <div className="flex min-w-[240px] w-full items-start gap-3">
            <Avatar
              fallback={(p.clientCompanyName || 'C')[0]}
              alt={name}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">{name}</div>
              <div className="truncate text-sm text-gray-500">{sub}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'value', label: 'VALUE',
      render: (_, p) => (
        <TableCellText value={formatCurrency(p.totalValue || 0)} emphasized />
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (_, p) => {
        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.DRAFT;
        return (
          <Badge variant={cfg.variant} className="font-semibold">
            {cfg.label.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'date',
      label: 'CREATED',
      render: (_, p) => <TableCellCreated dateString={p.date || p.createdAt} />,
    },
    {
      key: 'validUntil', label: 'VALID UNTIL',
      render: (_, p) => <TableCellDateOnly dateString={p.validUntil} />,
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (_, p) => {
        const pid = p.documentId ?? p.id;
        const hasClientEmail = !!(p.clientEmail && String(p.clientEmail).trim());
        return (
          <div className="flex min-w-[200px] items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-teal-600 hover:bg-teal-50"
              title="View details"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients/proposals/${pid}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="Edit proposal"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/clients/proposals/${pid}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {hasClientEmail ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50"
                title="Email client (opens mail with proposal subject)"
                onClick={(e) => {
                  e.stopPropagation();
                  openClientEmailAboutProposal(p);
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-orange-600 hover:bg-orange-50"
                title="Copy link to this proposal"
                onClick={(e) => {
                  e.stopPropagation();
                  copyProposalDetailLink(p);
                }}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-red-600 hover:bg-red-50"
              title="Delete proposal"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteProposal(p);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const tabItems = [
    { key: 'all', label: 'All Proposals', count: stats.all },
    { key: 'draft', label: 'Draft', count: stats.draft },
    { key: 'sent', label: 'Sent', count: stats.sent },
    { key: 'accepted', label: 'Accepted', count: stats.accepted },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
    { key: 'expired', label: 'Expired', count: stats.expired },
  ];

  return (
    <>
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Proposals"
        subtitle="Create and manage proposals for clients"
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Clients', href: '/clients' },
          { label: 'Proposals', href: '/clients/proposals' },
        ]}
        showActions={true}
        onAddClick={() => router.push('/clients/proposals/new')}
        onFilterClick={() => { }}
        onExportClick={() => { }}
      />

      {/* KPI Cards — four summary metrics; Rejected/Expired remain in tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { title: 'Total', value: stats.all, icon: FileText, color: 'orange' },
          { title: 'Draft', value: stats.draft, icon: FileText, color: 'orange' },
          { title: 'Sent', value: stats.sent, icon: Send, color: 'orange' },
          { title: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'orange' },
        ].map((k) => (
          <KPICard
            key={k.title}
            compact
            title={k.title}
            value={k.value}
            subtitle={`${k.value} proposal${k.value !== 1 ? 's' : ''}`}
            icon={k.icon}
            colorScheme={k.color}
          />
        ))}
      </div>

      {/* Tabs + toolbar actions (aligned with lead companies list) */}
      <div className="relative">
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
          onAddClick={() => router.push('/clients/proposals/new')}
          addTitle="Add Proposal"
          showFilter={true}
          onFilterClick={() => {}}
          filterTitle="Filter"
          showExport={true}
          onExportClick={() => {}}
          exportTitle="Export"
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
          <Button size="sm" variant="outline" onClick={fetchProposals} className="ml-auto">Retry</Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Loading proposals..." />
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={filtered}
              keyField="id"
              variant="modern"
              onRowClick={(row) =>
                router.push(`/clients/proposals/${row.documentId ?? row.id}`)
              }
            />
            {filtered.length === 0 && (
              <div className="p-12 text-center border-t border-gray-200">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No proposals found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery || activeTab !== 'all' ? 'Try adjusting your filters' : 'Create your first proposal to get started'}
                </p>
                {!searchQuery && activeTab === 'all' && (
                  <Button variant="primary" onClick={() => router.push('/clients/proposals/new')}>
                    <Plus className="w-4 h-4 mr-2" /> Create Proposal
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
    </div>

    <Modal
      isOpen={!!deleteProposalId}
      onClose={() => {
        if (deletingId) return;
        setDeleteProposalId(null);
      }}
      title="Delete Proposal"
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
        <p className="text-sm text-gray-700">Are you sure you want to delete this proposal?</p>
        <div className="mt-1 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="muted"
            disabled={!!deletingId}
            onClick={() => setDeleteProposalId(null)}
            className="w-full rounded-xl border-[1.5px] border-gray-400 bg-gray-300 px-5 py-2.5 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!!deletingId}
            onClick={confirmDeleteProposal}
            className="w-full min-w-[9rem] rounded-xl py-2.5 sm:w-auto"
          >
            {deletingId ? 'Deleting…' : 'Delete Proposal'}
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
