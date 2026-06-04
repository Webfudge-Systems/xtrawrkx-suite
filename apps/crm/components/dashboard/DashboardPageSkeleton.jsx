'use client';

import {
  DashboardContentLoader,
  KPICardsRowSkeleton,
  WidgetCardSkeleton,
} from '@webfudge/ui';

export default function DashboardPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <DashboardContentLoader message="Loading dashboard..." />

      <KPICardsRowSkeleton count={4} />

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <WidgetCardSkeleton className="xl:min-h-[42rem]" minHeight="min-h-[360px]" />
          <WidgetCardSkeleton minHeight="min-h-[280px]" />
        </div>
        <div className="space-y-6">
          <WidgetCardSkeleton className="xl:min-h-[42rem]" minHeight="min-h-[360px]" />
          <WidgetCardSkeleton minHeight="min-h-[220px]" />
        </div>
      </div>
    </div>
  );
}
