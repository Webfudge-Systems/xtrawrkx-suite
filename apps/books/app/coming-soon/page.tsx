'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import BooksComingSoon from '@/app/_components/BooksComingSoon'

function ComingSoonContent() {
  const searchParams = useSearchParams()
  const feature = searchParams.get('feature') || 'This feature'

  return <BooksComingSoon featureName={feature} />
}

export default function ComingSoonPage() {
  return (
    <Suspense>
      <ComingSoonContent />
    </Suspense>
  )
}
