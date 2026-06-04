'use client';

import Link from 'next/link';
import { Building2, FileText, Receipt, CheckSquare, FolderOpen } from 'lucide-react';
import { Card } from '@webfudge/ui';

const links = [
  { href: '/clients/accounts', label: 'Client accounts', icon: Building2 },
  { href: '/clients/proposals', label: 'Proposals', icon: FileText },
  { href: '/clients/invoices', label: 'Invoices', icon: Receipt },
  { href: '/clients/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/clients/projects', label: 'Projects', icon: FolderOpen },
];

export default function ClientsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Client portal</h1>
        <p className="text-gray-600 mt-1">Manage client accounts, proposals, and invoices.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="p-6 border border-gray-200 hover:border-brand-primary/30 hover:shadow-md transition-all cursor-pointer">
              <Icon className="w-10 h-10 text-brand-primary mb-3" />
              <h2 className="text-lg font-semibold text-brand-dark">{label}</h2>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
