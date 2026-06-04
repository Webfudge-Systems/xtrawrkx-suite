'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { Card } from '@webfudge/ui';
import CRMPageHeader from '../../../components/CRMPageHeader';

export default function SalesAccountsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <CRMPageHeader
        title="Sales accounts"
        subtitle="Account overview (sales context)"
        breadcrumb={[{ label: 'Sales', href: '/sales' }, { label: 'Accounts', href: '/sales/accounts' }]}
      />
      <Card className="p-6 border border-gray-200">
        <p className="text-gray-600">
          Sales accounts are listed under Clients → Client Accounts. Use the sidebar to go to{' '}
          <Link href="/clients/accounts" className="text-brand-primary hover:underline">
            Client Accounts
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
