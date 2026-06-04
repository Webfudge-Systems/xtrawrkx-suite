'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { Card, Pagination, Button, ActivitiesTimeline } from '@webfudge/ui';
import CRMPageHeader from '../../components/CRMPageHeader';
import { fetchGlobalActivityFeed } from '../../lib/api/crmActivityService';

const PAGE_SIZE = 25;

function entityHrefForRow(row) {
  const st = String(row?.subjectType || '').toLowerCase();
  const id = row?.subjectId;
  if (id == null || id === '') return null;
  if (st === 'contact') return `/sales/contacts/${id}`;
  if (st === 'lead_company') return `/sales/lead-companies/${id}`;
  if (st === 'deal') return `/sales/deals/${id}`;
  return null;
}

export default function ActivitiesLogPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const start = (page - 1) * PAGE_SIZE;
      const { data, total: t } = await fetchGlobalActivityFeed({
        limit: PAGE_SIZE,
        start,
      });
      setItems(Array.isArray(data) ? data : []);
      setTotal(typeof t === 'number' ? t : 0);
    } catch (e) {
      console.error('Activity log:', e);
      setError(e?.message || 'Failed to load activities');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Activity log"
        subtitle="Organization-wide CRM audit trail — contacts, leads, deals, and comments"
        breadcrumb={[{ label: 'Activity log', href: '/activities' }]}
      />

      <Card className="border border-gray-200 overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Activity className="h-5 w-5 text-brand-primary" aria-hidden />
            All activities
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!loading && total > 0 && (
              <span className="text-xs text-gray-600 tabular-nums">
                {from}–{to} of {total}
              </span>
            )}
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => load()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <ActivitiesTimeline
            items={items}
            loading={loading}
            error={error}
            entityHrefForRow={entityHrefForRow}
          />
        </div>

        {totalPages > 1 && !loading && !error && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 md:px-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
