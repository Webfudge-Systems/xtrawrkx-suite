'use client';

import Link from 'next/link';
import { BarChart3, TrendingUp } from 'lucide-react';
import { Card, Button } from '@webfudge/ui';
import CRMPageHeader from '../../components/CRMPageHeader';

const comingSoon = (feature) => `/coming-soon?feature=${encodeURIComponent(feature)}`;

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Analytics"
        subtitle="Reports, forecasts, and pipeline insights"
        breadcrumb={[{ label: 'Analytics', href: '/analytics' }]}
      />
      <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
        <Card className="border border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-brand-foreground font-semibold">
            <BarChart3 className="w-5 h-5" />
            Reports &amp; forecasts
          </div>
          <p className="text-sm text-gray-600">Sales performance, conversion, and revenue reporting.</p>
          <Button as={Link} href={comingSoon('Analytics')} variant="primary" className="mt-auto w-fit">
            Open reports
          </Button>
        </Card>
        <Card className="border border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-brand-foreground font-semibold">
            <TrendingUp className="w-5 h-5" />
            Pipeline analytics
          </div>
          <p className="text-sm text-gray-600">Stage velocity and win/loss trends.</p>
          <Button as={Link} href={comingSoon('Pipeline analytics')} variant="secondary" className="mt-auto w-fit">
            Coming soon
          </Button>
        </Card>
      </div>
    </div>
  );
}
