'use client'

import { Card } from '@webfudge/ui'
import { Clock } from 'lucide-react'

export default function ActivityFeedWidget() {
  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600">Latest updates and actions</p>
        </div>
        <Clock className="w-6 h-6 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div className="text-center py-8 text-gray-500 text-sm">
          No recent activity. Activity feed will appear here when connected to your backend.
        </div>
      </div>
    </Card>
  )
}

