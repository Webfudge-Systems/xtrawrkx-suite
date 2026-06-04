'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, Kanban, Table2 } from 'lucide-react';
import { LoadingSpinner, TabsWithActions, ViewToggleGroup, ViewToggleButton } from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';
import { DealsKanbanBoard, DEAL_PIPELINE_STAGES } from '../../../../components/DealsKanbanBoard';
import dealService from '../../../../lib/api/dealService';
import WonDealProjectModal from '../../../../components/WonDealProjectModal';
import { canEditCRMRecord, canWriteCRM } from '../../../../lib/rbac';

function formatINR(v) {
  if (v == null || Number.isNaN(Number(v))) return null;
  return '₹' + Number(v).toLocaleString('en-IN');
}

function dealCompany(d) {
  return (
    d?.leadCompany?.companyName ||
    d?.leadCompany?.name ||
    d?.clientAccount?.companyName ||
    d?.clientAccount?.name ||
    null
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [allDeals, setAllDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [wonModal, setWonModal] = useState({ open: false, dealId: null, dealName: '' });
  const [wonBusy, setWonBusy] = useState(false);
  const canCreateDeals = canWriteCRM('deals');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await dealService.getPipeline();
        const data = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setAllDeals(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stagesData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const byStage = {};
    DEAL_PIPELINE_STAGES.forEach(({ key }) => {
      byStage[key] = [];
    });

    allDeals.forEach((d) => {
      const stage = (d.stage || 'discovery').toLowerCase();
      if (!byStage[stage]) byStage[stage] = [];
      byStage[stage].push(d);
    });

    return DEAL_PIPELINE_STAGES.map(({ key, label }) => {
      let colDeals = byStage[key] || [];
      if (q) {
        colDeals = colDeals.filter((d) => {
          const name = (d.name || '').toLowerCase();
          const co = (dealCompany(d) || '').toLowerCase();
          return name.includes(q) || co.includes(q);
        });
      }
      return { key, label, deals: colDeals };
    });
  }, [allDeals, searchQuery]);

  const filteredStages = useMemo(() => {
    if (activeTab === 'all') return stagesData;
    return stagesData.filter(({ key }) => key === activeTab);
  }, [stagesData, activeTab]);

  const tabItems = useMemo(
    () => [
      {
        key: 'all',
        label: 'All stages',
        count: stagesData.reduce((sum, s) => sum + s.deals.length, 0),
      },
      ...DEAL_PIPELINE_STAGES.map(({ key, label }) => ({
        key,
        label,
        count: stagesData.find((s) => s.key === key)?.deals.length ?? 0,
      })),
    ],
    [stagesData]
  );

  const handlePipelineDealMove = useCallback(async (dealId, newStage) => {
    const deal = allDeals.find((d) => String(d.id) === dealId);
    if (!deal) return;
    if (!canEditCRMRecord('deals', deal)) return;
    const oldStage = (deal.stage || 'discovery').toLowerCase();
    if (oldStage === newStage) return;

    setAllDeals((prev) => prev.map((d) => (String(d.id) === dealId ? { ...d, stage: newStage } : d)));

    try {
      await dealService.update(dealId, { stage: newStage });
    } catch {
      setAllDeals((prev) => prev.map((d) => (String(d.id) === dealId ? { ...d, stage: oldStage } : d)));
      return;
    }

    if (newStage === 'won') {
      setWonModal({ open: true, dealId: Number(dealId), dealName: deal.name || '' });
    }
  }, [allDeals]);

  const goToDealsTable = useCallback(() => {
    try {
      window.localStorage.setItem('crm.deals.viewMode', 'table');
    } catch {
      /* ignore */
    }
    router.push('/sales/deals');
  }, [router]);

  const handleWonSkip = useCallback(async () => {
    setWonModal((s) => ({ ...s, open: false }));
  }, []);

  const handleWonCreateProject = useCallback(async () => {
    const { dealId } = wonModal;
    if (!dealId) return;
    setWonBusy(true);
    try {
      await dealService.createDeliveryProject(dealId);
      setWonModal({ open: false, dealId: null, dealName: '' });
      router.push('/clients/projects');
    } catch {
      setWonModal((s) => ({ ...s, open: false }));
    } finally {
      setWonBusy(false);
    }
  }, [wonModal, router]);

  const hasDeals = stagesData.some((s) => s.deals.length > 0);
  const totalValue = allDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const totalDeals = allDeals.length;

  const pipelineViewSwitcher = (
    <ViewToggleGroup aria-label="Deals layout">
      <ViewToggleButton active={false} title="Table view" onClick={goToDealsTable}>
        <Table2 className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
      <ViewToggleButton active title="Kanban view" onClick={() => {}}>
        <Kanban className="h-[18px] w-[18px]" strokeWidth={2} />
      </ViewToggleButton>
    </ViewToggleGroup>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Pipeline"
        subtitle={
          totalDeals > 0
            ? `${totalDeals} deal${totalDeals !== 1 ? 's' : ''} · ${formatINR(totalValue) ?? '—'} total value`
            : 'Deal stages and value'
        }
        breadcrumb={[
          { label: 'Sales', href: '/sales' },
          { label: 'Deals', href: '/sales/deals' },
          { label: 'Pipeline', href: '/sales/deals/pipeline' },
        ]}
        showActions
        onAddClick={canCreateDeals ? () => router.push('/sales/deals/new') : undefined}
        onFilterClick={() => {}}
        onImportClick={() => {}}
        onExportClick={() => {}}
      />

      <TabsWithActions
        tabs={tabItems.map((item) => ({
          key: item.key,
          label: item.label,
          badge: String(item.count),
        }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        afterTabs={pipelineViewSwitcher}
        showSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search deals or companies…"
        showAdd={canCreateDeals}
        addTitle="Add Deal"
        onAddClick={canCreateDeals ? () => router.push('/sales/deals/new') : undefined}
        showFilter
        onFilterClick={() => {}}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center p-12">
            <LoadingSpinner size="lg" message="Loading pipeline…" />
          </div>
        ) : !hasDeals && !searchQuery ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Briefcase className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No deals yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {canCreateDeals ? 'Create your first deal to start building the pipeline.' : 'No deals are available yet.'}
            </p>
            {canCreateDeals ? (
              <button
                type="button"
                onClick={() => router.push('/sales/deals/new')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:opacity-80"
              >
                <Plus className="h-4 w-4" />
                Add Deal
              </button>
            ) : null}
          </div>
        ) : (
          <DealsKanbanBoard
            stageColumns={filteredStages}
            dealsLookup={allDeals}
            onMoveDeal={handlePipelineDealMove}
            getDealHref={(id) => `/sales/deals/${id}`}
            canMoveDeal={(deal) => canEditCRMRecord('deals', deal)}
          />
        )}
      </div>

      <WonDealProjectModal
        open={wonModal.open}
        dealName={wonModal.dealName}
        busy={wonBusy}
        onClose={() => setWonModal((s) => ({ ...s, open: false }))}
        onSkipProject={handleWonSkip}
        onCreateProject={handleWonCreateProject}
      />
    </div>
  );
}
