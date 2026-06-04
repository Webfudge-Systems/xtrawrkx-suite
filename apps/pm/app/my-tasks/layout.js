import { Suspense } from 'react'
import { LoadingSpinner } from '@webfudge/ui'

export default function MyTasksLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <LoadingSpinner size="md" message="Loading…" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
