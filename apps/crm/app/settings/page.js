'use client';

import { Card } from '@webfudge/ui';
import CRMPageHeader from '../../components/CRMPageHeader';

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Settings"
        subtitle="CRM and account settings"
        breadcrumb={[{ label: 'Settings', href: '/settings' }]}
      />
      <Card className="p-6 border border-gray-200">
        <p className="text-gray-600">
          Settings (users, roles, integrations, branding) will appear here when connected to your backend.
        </p>
      </Card>
    </div>
  );
}
