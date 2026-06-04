'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@webfudge/auth'
import { KPICard, EmptyState } from '@webfudge/ui'
import { CheckSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import PMPageHeader from '../components/PMPageHeader'
import {
  DashboardPageSkeleton,
  DashboardMyTasksWidget,
  UpcomingDeadlinesWidget,
  TaskOverviewWidget,
  TeamWorkloadWidget,
  ProjectsOverviewWidget,
} from '../components/dashboard'
import projectService from '../lib/api/projectService'
import taskService from '../lib/api/taskService'
import strapiClient from '../lib/strapiClient'
import { canReadPM } from '../lib/rbac'
import { transformTask, transformUser, transformProject } from '../lib/api/dataTransformers'

/**
 * Shared height for My Tasks + Upcoming Deadlines.
 * Sized for: card header + 3 deadline rows (~56px each) + compact calendar + ~10 task table rows.
 */
const DASHBOARD_MAIN_ROW_CLASS = 'h-[min(680px,72vh)] min-h-[600px]'

const OPEN_TASK_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

function isOpenAssignedTask(task) {
  return task && !OPEN_TASK_STATUSES.has(task.strapiStatus)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DashboardPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [assigneeTasks, setAssigneeTasks] = useState([])
  const [people, setPeople] = useState([])
  const [stats, setStats] = useState({ todo: 0, inProgress: 0, done: 0, overdue: 0 })

  const getUserId = useCallback(() => {
    if (!user) return null
    const u = user.attributes || user
    return u.id || user.id || null
  }, [user])

  const userAttrs = user?.attributes || user
  const email = userAttrs?.email || ''
  const userName = email.split('@')[0] || 'User'
  const canViewDashboard = canReadPM('dashboard')
  const canViewProjects = canReadPM('projects')
  const canViewTasks = canReadPM('tasks') || canReadPM('my_tasks')

  const openAssigneeTasks = useMemo(
    () => assigneeTasks.filter(isOpenAssignedTask),
    [assigneeTasks]
  )

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const userId = getUserId()

        const [projectsRes, allTasksRes, usersRes] = await Promise.allSettled([
          canViewProjects
            ? projectService.getAllProjects({ pageSize: 10, sort: 'updatedAt:desc' })
            : Promise.resolve({ data: [] }),
          canViewTasks ? taskService.getAllTasks({ pageSize: 200 }) : Promise.resolve({ data: [] }),
          strapiClient.getXtrawrkxUsers({ pageSize: 200 }),
        ])

        if (projectsRes.status === 'fulfilled') {
          const rawProjects = projectsRes.value?.data || []
          setProjects(rawProjects.map(transformProject).filter(Boolean))
        }

        if (allTasksRes.status === 'fulfilled') {
          const rawTasks = allTasksRes.value?.data || []
          const transformed = rawTasks.map(transformTask).filter(Boolean)
          const now = new Date()
          setStats({
            todo: transformed.filter((t) => t.strapiStatus === 'SCHEDULED').length,
            inProgress: transformed.filter((t) => t.strapiStatus === 'IN_PROGRESS').length,
            done: transformed.filter((t) => t.strapiStatus === 'COMPLETED').length,
            overdue: transformed.filter(
              (t) => t.dueDate && new Date(t.dueDate) < now && t.strapiStatus !== 'COMPLETED'
            ).length,
          })
          setAllTasks(transformed)
        }

        if (canViewTasks && userId) {
          try {
            const mineRes = await taskService.getPMTasksByAssignee(userId, { pageSize: 100 })
            const uid = String(userId)
            const mine = (mineRes?.data || [])
              .map(transformTask)
              .filter(Boolean)
              .filter(
                (task) =>
                  (task.assigneeUserIds || []).map(String).includes(uid) ||
                  (task.assignees || []).some((a) => a?.id != null && String(a.id) === uid)
              )
            setAssigneeTasks(mine)
          } catch {
            setAssigneeTasks([])
          }
        } else {
          setAssigneeTasks([])
        }

        if (usersRes.status === 'fulfilled') {
          const users = usersRes.value
          const rawUsers = Array.isArray(users)
            ? users
            : Array.isArray(users?.data)
              ? users.data
              : users?.data || users?.users || []

          const transformed = (Array.isArray(rawUsers) ? rawUsers : []).map(transformUser).filter(Boolean)
          setPeople(transformed)
        }

      } catch (error) {
        console.error('Dashboard load error:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!user) return
    if (!canViewDashboard) {
      setLoading(false)
      return
    }
    loadData()
  }, [user, getUserId, canViewDashboard, canViewProjects, canViewTasks])

  const kpiCards = [
    {
      title: 'To Do Tasks',
      value: String(stats.todo),
      subtitle: stats.todo === 0 ? 'No tasks' : `${stats.todo} task${stats.todo !== 1 ? 's' : ''}`,
      icon: CheckSquare,
    },
    {
      title: 'In Progress Tasks',
      value: String(stats.inProgress),
      subtitle: stats.inProgress === 0 ? 'No tasks' : `${stats.inProgress} active`,
      icon: Clock,
    },
    {
      title: 'Done Tasks',
      value: String(stats.done),
      subtitle: stats.done === 0 ? 'No tasks' : `${stats.done} completed`,
      icon: CheckCircle2,
    },
    {
      title: 'Overdue Tasks',
      value: String(stats.overdue),
      subtitle: stats.overdue === 0 ? 'No tasks' : `${stats.overdue} overdue`,
      icon: AlertCircle,
    },
  ]

  if (!canViewDashboard) {
    return (
      <div className="p-8 bg-white min-h-full">
        <EmptyState
          icon={AlertCircle}
          title="PM dashboard unavailable"
          description="Your current role does not have read access to the Project Management dashboard."
        />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 bg-white min-h-full">
      <PMPageHeader
        title={`${getGreeting()}, ${userName}`}
        subtitle={getCurrentDate()}
        breadcrumb={[{ label: 'Dashboard', href: '/' }]}
        showSearch
        searchPlaceholder="Search anything..."
      />

      {loading ? (
        <DashboardPageSkeleton />
      ) : (
      <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <KPICard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              icon={card.icon}
              colorScheme="orange"
            />
          ))}
        </div>
      </div>

      {/* My Tasks (wide) | Upcoming Deadlines — equal fixed height */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-stretch">
        <div className={`lg:col-span-3 ${DASHBOARD_MAIN_ROW_CLASS}`}>
          <DashboardMyTasksWidget
            tasks={openAssigneeTasks}
            totalCount={openAssigneeTasks.length}
            loading={false}
            className="w-full"
          />
        </div>

        {canViewTasks ? (
          <div className={`lg:col-span-2 ${DASHBOARD_MAIN_ROW_CLASS}`}>
            <UpcomingDeadlinesWidget tasks={assigneeTasks} loading={false} className="w-full" />
          </div>
        ) : null}
      </div>

      {/* Task overview, team workload, projects overview — content-sized, no min-height stretch */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TaskOverviewWidget stats={stats} tasks={allTasks} />
        <TeamWorkloadWidget people={people} tasks={allTasks} />
        <ProjectsOverviewWidget projects={projects} canViewProjects={canViewProjects} />
      </div>
      </>
      )}
    </div>
  )
}
