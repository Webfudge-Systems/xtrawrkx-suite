'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Button } from '@webfudge/ui'

export default function ComingSoonPage() {
  const searchParams = useSearchParams()
  const feature = searchParams.get('feature') || 'This feature'

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light p-4">
      <div className="max-w-md text-center">
        <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
          <Clock className="h-8 w-8 text-brand-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-brand-dark">Coming soon</h1>
        <p className="mb-8 text-gray-600">
          {feature} is under development. We&apos;ll notify you when it&apos;s ready.
        </p>
        <Link href="/home">
          <Button variant="primary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

