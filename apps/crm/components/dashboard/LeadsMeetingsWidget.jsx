'use client'

import UpcomingMeetingsWidget from './UpcomingMeetingsWidget'
import LatestLeadsWidget from './LatestLeadsWidget'

/** Side-by-side meetings + latest leads (Sales sidebar, legacy layout). */
export default function LeadsMeetingsWidget({ className = '' }) {
  return (
    <div className={`grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch ${className}`.trim()}>
      <UpcomingMeetingsWidget />
      <LatestLeadsWidget />
    </div>
  )
}
