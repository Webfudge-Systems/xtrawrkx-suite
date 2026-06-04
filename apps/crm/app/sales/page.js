'use client';

import Link from 'next/link';
import { Users, UserCheck, Briefcase, Building2 } from 'lucide-react';
import { Card } from '@webfudge/ui';

const links = [
  { href: '/sales/lead-companies', label: 'Lead Companies', icon: Users },
  { href: '/sales/contacts', label: 'Contacts', icon: UserCheck },
  { href: '/sales/deals', label: 'Deals', icon: Briefcase },
  { href: '/sales/deals/pipeline', label: 'Pipeline', icon: Briefcase },
  { href: '/sales/accounts', label: 'Sales Accounts', icon: Building2 },
];

export default function SalesPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Sales</h1>
        <p className="text-gray-600 mt-1">Manage leads, contacts, deals, and pipeline.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="p-6 border border-gray-200 hover:border-brand-primary/30 hover:shadow-md transition-all cursor-pointer">
              <Icon className="w-10 h-10 text-brand-primary mb-3" />
              <h2 className="text-lg font-semibold text-brand-dark">{label}</h2>
              <p className="text-sm text-gray-500 mt-1">View and manage</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
