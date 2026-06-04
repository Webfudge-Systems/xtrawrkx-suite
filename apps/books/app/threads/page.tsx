'use client'

import { Card, EmptyState } from '@webfudge/ui'

export default function ThreadsPage() {
  return (
    <Card className="border border-gray-200">
      <EmptyState
        title="No conversations yet"
        description="Threads and comments will appear here when connected to your backend."
      />
    </Card>
  )
}

