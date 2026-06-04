'use client';

import { Card } from '@webfudge/ui';
import CRMPageHeader from '../../../../components/CRMPageHeader';

export default function ClientsProjectsBoardPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <CRMPageHeader
        title="Project board"
        subtitle="Kanban-style project board"
        breadcrumb={[
          { label: 'Clients', href: '/clients' },
          { label: 'Projects', href: '/clients/projects' },
          { label: 'Board', href: '/clients/projects/board' },
        ]}
      />
      <Card className="border border-gray-200 p-6">
        <p className="text-gray-600">
          Project board (Kanban) will appear here when connected to your backend.
        </p>
      </Card>
    </div>
  );
}
