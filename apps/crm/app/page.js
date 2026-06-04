'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@webfudge/auth';
import { ShieldX } from 'lucide-react';
import CRMPageHeader from '../components/CRMPageHeader';
import {
  DashboardViewSwitcher,
  PersonalDashboardView,
  SalesDashboardView,
  ManagerDashboardView,
} from '../components/dashboard';
import { canReadCRM } from '../lib/rbac';
import {
  DASHBOARD_VIEW_IDS,
  DASHBOARD_VIEW_META,
  getAvailableDashboardViews,
  resolveDashboardView,
  readStoredDashboardView,
  storeDashboardView,
} from '../lib/dashboardViews';

const VIEW_SUBTITLES = {
  [DASHBOARD_VIEW_IDS.PERSONAL]: 'Your tasks, meetings, and day-to-day work.',
  [DASHBOARD_VIEW_IDS.SALES]: 'How is the business performing?',
  [DASHBOARD_VIEW_IDS.MANAGER]: 'How is my team progressing?',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState(DASHBOARD_VIEW_IDS.PERSONAL);

  const canViewDashboard = canReadCRM('dashboard');
  const canViewAnalytics = canReadCRM('analytics');
  const canViewLeads = canReadCRM('leads');
  const canViewMeetings = canReadCRM('meetings');

  const availableViews = useMemo(() => getAvailableDashboardViews(), []);
  const availableViewIds = useMemo(() => availableViews.map((v) => v.id), [availableViews]);

  const setView = useCallback(
    (viewId) => {
      const resolved = resolveDashboardView(viewId, availableViewIds);
      setActiveView(resolved);
      storeDashboardView(resolved);
    },
    [availableViewIds]
  );

  useEffect(() => {
    const stored = readStoredDashboardView();
    setActiveView(resolveDashboardView(stored, availableViewIds));
  }, [availableViewIds]);

  const email = user?.email || user?.attributes?.email || '';
  const userName = email.split('@')[0] || 'User';

  const viewSwitcher =
    availableViews.length > 1 ? (
      <DashboardViewSwitcher views={availableViews} activeId={activeView} onChange={setView} />
    ) : null;

  const heroSubtitle = VIEW_SUBTITLES[activeView] || DASHBOARD_VIEW_META[activeView]?.description;

  if (!canViewDashboard) {
    return (
      <div className="flex min-h-full items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">CRM dashboard unavailable</h1>
          <p className="text-gray-600">Your current role does not have read access to the CRM dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-4 bg-white p-4">
      <CRMPageHeader
        title={`${getGreeting()}, ${userName}`}
        subtitle={`${getDate()} · ${heroSubtitle}`}
        breadcrumb={[{ label: 'Dashboard', href: '/' }]}
        showSearch
        searchPlaceholder="Search anything..."
        actions={viewSwitcher}
      />

      {activeView === DASHBOARD_VIEW_IDS.PERSONAL && (
        <PersonalDashboardView canViewLeads={canViewLeads} canViewMeetings={canViewMeetings} />
      )}
          {activeView === DASHBOARD_VIEW_IDS.SALES && (
            <SalesDashboardView canViewAnalytics={canViewAnalytics} canViewLeads={canViewLeads} />
          )}
      {activeView === DASHBOARD_VIEW_IDS.MANAGER && (
        <ManagerDashboardView canViewLeads={canViewLeads} canViewMeetings={canViewMeetings} />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
