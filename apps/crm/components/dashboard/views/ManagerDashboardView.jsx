'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, AlertTriangle, Calendar, Users } from 'lucide-react'
import { DashboardKpiRow } from '@webfudge/ui'
import { fetchManagerKpis } from '../../../lib/api/dashboardDataService'
import TeamPerformanceWidget from '../TeamPerformanceWidget'
import TeamTaskDistributionWidget from '../manager/TeamTaskDistributionWidget'
import LeadAssignmentDonutWidget from '../manager/LeadAssignmentDonutWidget'
import TeamActivityFeedWidget from '../manager/TeamActivityFeedWidget'
import UpcomingMeetingsWidget from '../UpcomingMeetingsWidget'
import LeadsAssignedWidget from '../manager/LeadsAssignedWidget'

export default function ManagerDashboardView({ canViewLeads, canViewMeetings }) {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    teamOpenTasks: 0,
    teamOverdueTasks: 0,
    meetingsToday: 0,
    activeTeamMembers: 0,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchManagerKpis()
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
      title: 'Team Open Tasks',
      value: loading ? '—' : String(kpis.teamOpenTasks),
      icon: CheckSquare,
    },
    {
      title: 'Team Overdue Tasks',
      value: loading ? '—' : String(kpis.teamOverdueTasks),
      changeType: kpis.teamOverdueTasks > 0 ? 'decrease' : 'increase',
      icon: AlertTriangle,
    },
    {
      title: 'Meetings Today',
      value: loading ? '—' : String(kpis.meetingsToday),
      icon: Calendar,
    },
    {
      title: 'Active Team Members',
      value: loading ? '—' : String(kpis.activeTeamMembers),
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardKpiRow stats={stats} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        {/* Left: team workload + activity */}
        <div className="space-y-6 xl:col-span-8">
          <TeamPerformanceWidget />
          <TeamTaskDistributionWidget />
          <TeamActivityFeedWidget />
        </div>

        {/* Right: latest leads, assignment chart, meetings */}
        <div className="space-y-6 xl:col-span-4">
          {canViewLeads ? <LeadsAssignedWidget /> : null}
          {canViewLeads ? <LeadAssignmentDonutWidget /> : null}
          {canViewMeetings ? <UpcomingMeetingsWidget /> : null}
        </div>
      </div>
    </div>
  )
}
