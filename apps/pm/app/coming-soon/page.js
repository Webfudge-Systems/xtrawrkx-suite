'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function ComingSoonContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'This feature';
  const featureName = feature.charAt(0).toUpperCase() + feature.slice(1).replace(/-/g, ' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-brand-primary" />
        </div>
        <h1 className="text-3xl font-bold text-brand-foreground mb-3">Coming Soon</h1>
        <p className="text-brand-text-light mb-2">
          <span className="font-semibold text-brand-foreground">{featureName}</span> is currently under development.
        </p>
        <p className="text-brand-text-light mb-8">
          We&apos;re working hard to bring you this feature soon. Stay tuned!
        </p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense>
      <ComingSoonContent />
    </Suspense>
  );
}
