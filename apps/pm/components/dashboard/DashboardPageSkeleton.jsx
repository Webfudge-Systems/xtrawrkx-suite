'use client';

import {
  DashboardContentLoader,
  KPICardsRowSkeleton,
  TableSkeleton,
  WidgetCardSkeleton,
} from '@webfudge/ui';

function TasksTableCardSkeleton() {
  return (
    <div className="flex h-full min-h-0 animate-pulse flex-col rounded-2xl border border-gray-200/80 bg-white/80 p-6 shadow-sm">
      <div className="mb-5 shrink-0 space-y-2">
        <div className="h-5 w-28 rounded bg-gray-200" />
        <div className="h-3 w-56 rounded bg-gray-100" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-100 bg-white/90 p-4">
        <TableSkeleton rows={10} columns={5} />
      </div>
    </div>
  );
}

export default function DashboardPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <DashboardContentLoader message="Loading dashboard..." />

      <KPICardsRowSkeleton count={4} />

      <div className="grid h-[min(680px,72vh)] min-h-[600px] grid-cols-1 gap-6 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3">
          <TasksTableCardSkeleton />
        </div>
        <div className="lg:col-span-2">
          <WidgetCardSkeleton minHeight="h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WidgetCardSkeleton minHeight="min-h-[200px]" />
        <WidgetCardSkeleton minHeight="min-h-[200px]" />
        <WidgetCardSkeleton minHeight="min-h-[200px]" />
      </div>
    </div>
  );
}
