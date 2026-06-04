'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, AlertTriangle, Calendar, Building2 } from 'lucide-react'
import { DashboardKpiRow } from '@webfudge/ui'
import { fetchPersonalKpis } from '../../../lib/api/dashboardDataService'
import UpcomingMeetingsWidget from '../UpcomingMeetingsWidget'
import LatestAssignedLeadsWidget from '../LatestAssignedLeadsWidget'
import MyWorkWidget from '../MyWorkWidget'
import DashboardMyTasksWidget from '../DashboardMyTasksWidget'

/** Right column: My work panel — same height as PM Upcoming Deadlines */
const DEADLINE_PANEL = 'h-[min(680px,72vh)] min-h-[600px]'
/** Left column: My Tasks panel — matches PM dashboard main row height */
const MY_TASKS_PANEL = 'h-[min(680px,72vh)] min-h-[600px]'

export default function PersonalDashboardView({ canViewLeads, canViewMeetings }) {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    openTasks: 0,
    overdueTasks: 0,
    meetingsToday: 0,
    assignedLeads: 0,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchPersonalKpis()
      if (!cancelled) {
        setKpis(data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = [
    {
      title: 'My Open Tasks',
      value: loading ? '—' : String(kpis.openTasks),
      icon: CheckSquare,
    },
    {
      title: 'Overdue Tasks',
      value: loading ? '—' : String(kpis.overdueTasks),
      changeType: kpis.overdueTasks > 0 ? 'decrease' : 'increase',
      icon: AlertTriangle,
    },
    {
      title: 'Meetings Today',
      value: loading ? '—' : String(kpis.meetingsToday),
      icon: Calendar,
    },
    {
      title: 'Assigned Leads',
      value: loading ? '—' : String(kpis.assignedLeads),
      icon: Building2,
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardKpiRow stats={stats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
        <div className="space-y-6 xl:col-span-2">
          {canViewLeads ? <LatestAssignedLeadsWidget /> : null}
          <div className={MY_TASKS_PANEL}>
            <DashboardMyTasksWidget className="w-full" />
          </div>
        </div>
        <div className="space-y-6">
          <div className={DEADLINE_PANEL}>
            <MyWorkWidget className="h-full w-full" />
          </div>
          {canViewMeetings ? <UpcomingMeetingsWidget /> : null}
        </div>
      </div>
    </div>
  )
}
