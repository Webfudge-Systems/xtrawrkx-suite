'use client';

import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Button } from '@webfudge/ui';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Access denied</h1>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Link href="/login">
          <Button variant="primary">Back to login</Button>
        </Link>
      </div>
    </div>
  );
}
