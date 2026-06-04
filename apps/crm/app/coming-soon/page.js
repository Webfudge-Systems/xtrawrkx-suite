'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@webfudge/ui';

export default function ComingSoonPage() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'This feature';

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-brand-primary" />
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Coming soon</h1>
        <p className="text-gray-600 mb-8">
          {feature} is under development. We&apos;ll notify you when it&apos;s ready.
        </p>
        <Link href="/">
          <Button variant="primary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
