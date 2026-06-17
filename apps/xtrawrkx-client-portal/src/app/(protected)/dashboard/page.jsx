'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Search,
  CheckSquare,
  Calendar,
  Star,
  Folder,
  DollarSign,
  Target,
  Award,
  Crown,
  Clock,
  FileText,
  MapPin,
  CheckCircle,
  Circle,
  AlertTriangle,
  User,
  Users,
  Phone,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Card, KPICard } from '@webfudge/ui'
import { PageHeader } from '@/components/layout/PortalPageHeader'
import { PortalPageShell } from '@/components/layout/PortalPageShell'
import { useSession } from '@/lib/auth'
import strapiClient from '@/lib/strapiClient'
import { useRouter } from 'next/navigation'
import CreateTaskModal from '@/components/tasks/CreateTaskModal'
import { DashboardTasksWidget, DashboardProjectsWidget } from '@/components/dashboard'
import { listCompanyMembers } from '@/lib/api/companyMembersService'
import { createClientTask, listTasksForClient } from '@/lib/api/clientTaskService'
import { listProjectsForClient } from '@/lib/api/clientProjectService'
import { listActiveMembershipsForClient } from '@/lib/api/communityProgramService'
import { resolveClientAccountCompanyName } from '@/utils/clientAccountCompany'
import { resolveClientAccountId, mapProjectsForTaskSelect } from '@/lib/clientAccountId'
import { COMMUNITIES_LIST } from '@/data/communitiesCatalog'
import { getTaskStatusLabel } from '@webfudge/utils'

// Dashboard Stats
const dashboardStats = [
  {
    title: 'Active Projects',
    value: '12',
    change: '+15%',
    changeType: 'increase',
    icon: Folder,
    color: 'from-brand-primary to-orange-600',
    bgColor: 'from-xtrawrkx-50 to-xtrawrkx-100',
  },
  {
    title: 'Total Earnings',
    value: '$45,850',
    change: '+8.2%',
    changeType: 'increase',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-green-100',
  },
  {
    title: 'Community Rank',
    value: 'Elite',
    change: '+2 positions',
    changeType: 'increase',
    icon: Award,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'from-yellow-50 to-orange-100',
  },
  {
    title: 'Task Completion',
    value: '89%',
    change: '+12%',
    changeType: 'increase',
    icon: Target,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100',
  },
]

// Communities data - major section
const communitiesData = [
  {
    id: 1,
    name: 'XEN',
    fullName: 'XEN Entrepreneurs Network',
    category: 'Business Division',
    description: 'Early-stage startup community focused on innovation and growth',
    members: 1247,
    tier: 'Premium',
    status: 'Active',
    tags: ['Startup Support', 'Networking'],
    logo: '/images/logos/xen-logo.png',
    color: 'blue-500',
    isMember: true,
    userTier: 'x3',
    userTierName: 'Growth Member',
    canUpgrade: true,
    nextTier: 'x4',
    nextTierName: 'Scale Member',
  },
  {
    id: 2,
    name: 'XEV.FiN',
    fullName: 'XEV Financial Network',
    category: 'Investment Division',
    description: 'Investment & funding network for entrepreneurs and investors',
    members: 523,
    tier: 'Elite',
    status: 'Active',
    tags: ['Investment', 'Funding'],
    logo: '/images/logos/xevfin-logo.png',
    color: 'green-500',
    isMember: false,
    userTier: null,
    userTierName: null,
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
  },
  {
    id: 3,
    name: 'XEVTG',
    fullName: 'XEV Tech Talent Group',
    category: 'Technology Division',
    description: 'Technology professionals network for skill development',
    members: 2156,
    tier: 'Standard',
    status: 'Active',
    tags: ['Tech Skills', 'Career Growth'],
    logo: '/images/logos/xevtg-logo.png',
    color: 'purple-500',
    isMember: true,
    userTier: 'x1',
    userTierName: 'Starter Member',
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
  },
]

// Tasks data for dashboard
const dashboardTasksData = [
  {
    id: 't1',
    title: 'Design new landing page',
    description: 'Create wireframes and mockups for the new landing page design',
    status: 'todo',
    priority: 'high',
    project: 'Event Organization Website',
    assignee: 'Gabrial Matula',
    dueDate: '2024-02-15',
    estimatedHours: 8,
    tags: ['design', 'frontend'],
    progress: 60,
    createdBy: 'me',
  },
  {
    id: 't2',
    title: 'Implement user authentication',
    description: 'Set up OAuth2 and JWT token management',
    status: 'in-progress',
    priority: 'urgent',
    project: 'Event Organization Website',
    assignee: 'Gabrial Matula',
    dueDate: '2024-02-10',
    estimatedHours: 12,
    tags: ['backend', 'security'],
    progress: 75,
    createdBy: 'me',
  },
  {
    id: 't3',
    title: 'Database optimization',
    description: 'Optimize queries and add proper indexing',
    status: 'in-progress',
    priority: 'high',
    project: 'Health Mobile App Design',
    assignee: 'Layla Amora',
    dueDate: '2024-02-18',
    estimatedHours: 6,
    tags: ['database', 'optimization'],
    progress: 40,
    createdBy: 'shared',
  },
  {
    id: 't4',
    title: 'Code review for payment module',
    description: 'Review the implementation of the new payment processing module',
    status: 'review',
    priority: 'high',
    project: 'Advance SEO Service',
    assignee: 'Ansel Finn',
    dueDate: '2024-02-12',
    estimatedHours: 2,
    tags: ['code-review', 'payments'],
    progress: 90,
    createdBy: 'shared',
  },
]

// Quick actions for the dropdown
const quickActions = [
  {
    id: 1,
    title: 'New Project',
    description: 'Start a new project',
    icon: Folder,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 2,
    title: 'New Task',
    description: 'Create a new task',
    icon: CheckSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 3,
    title: 'New Event',
    description: 'Schedule an event',
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 4,
    title: 'New Message',
    description: 'Send a message',
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const dropdownRef = useRef(null)

  // Task states
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [clientMembers, setClientMembers] = useState([])
  const [currentAccountId, setCurrentAccountId] = useState(null)
  const [tasksReloadKey, setTasksReloadKey] = useState(0)

  // Community states
  const [communities, setCommunities] = useState([])
  const [communityMemberships, setCommunityMemberships] = useState([])
  const [communitiesLoading, setCommunitiesLoading] = useState(true)

  // KPI states
  const [kpiStats, setKpiStats] = useState({
    totalProjects: 0,
    pendingTasks: 0,
    totalTasks: 0,
    taskCompletion: 0,
  })

  // Today's schedule states
  const [todaysSchedule, setTodaysSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(true)

  // Get current date (short: sat, 4/18/2026)
  const getCurrentDate = () => {
    const now = new Date()
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
    const datePart = now.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
    return `${weekday}, ${datePart}`
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Get user display name
  const getUserDisplayName = () => {
    const sessionAccount = session?.account || session?.user?.account || session

    let storedAccount = null
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('client_account')
        if (raw) storedAccount = JSON.parse(raw)
      } catch {
        storedAccount = null
      }
    }

    const account = storedAccount || sessionAccount
    const company =
      resolveClientAccountCompanyName(account) || String(account?.companyName || '').trim()
    if (company) return company

    // Last-resort fallbacks (should rarely be used in client portal).
    return String(account?.email || '').split('@')[0] || 'User'
  }

  // Fetch projects from API
  useEffect(() => {
    if (session) {
      fetchProjects()
    }
  }, [session])

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true)

      const accountId = await resolveClientAccountId(session)

      if (!accountId) {
        console.warn('No account ID found in session or localStorage')
        setProjects([])
        setProjectsLoading(false)
        return
      }

      const projectRows = await listProjectsForClient(accountId)
      setProjects(projectRows)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setProjects([])
    } finally {
      setProjectsLoading(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      if (!session) return

      try {
        setTasksLoading(true)

        const accountId = await resolveClientAccountId(session)

        if (!accountId) {
          console.warn('No account ID found for tasks')
          setTasks([])
          setTasksLoading(false)
          return
        }

        setCurrentAccountId(accountId)
        try {
          const membersResponse = await listCompanyMembers()
          setClientMembers(membersResponse?.data || [])
        } catch (membersError) {
          console.warn('Unable to load company members for task assignment', membersError)
          setClientMembers([])
        }

        try {
          const projectRows = await listProjectsForClient(accountId)
          setProjects(projectRows)
        } catch {
          /* projects list is refreshed separately */
        }

        const rawTasks = await listTasksForClient(accountId)

        const transformedTasks = rawTasks.map((task) => {
          const taskData = task.attributes || task
          const strapiStatus = (taskData.status || 'ASSIGNED').toUpperCase()
          const stageHistory = Array.isArray(taskData.stageHistory) ? taskData.stageHistory : []
          const projectsArray = taskData.projects?.data || taskData.projects || []
          const singleProject =
            taskData.project?.data?.attributes ||
            taskData.project?.data ||
            taskData.project?.attributes ||
            taskData.project

          let project = null
          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            const firstProject = projectsArray[0]
            project = firstProject.attributes || firstProject
          } else if (singleProject) {
            project = singleProject
          }

          const assignee =
            taskData.assignee?.data?.attributes ||
            taskData.assignee?.attributes ||
            taskData.assignee

          return {
            id: task.id || task.documentId,
            name: taskData.name || taskData.title || 'Untitled Task',
            description: taskData.description || '',
            strapiStatus,
            status: getTaskStatusLabel(strapiStatus, {
              variant: 'client',
              task: { strapiStatus, stageHistory },
            }),
            stageHistory,
            priority: (taskData.priority || 'medium').toLowerCase(),
            project: project
              ? {
                  name: project.name || 'Unknown Project',
                  id: project.id || project.documentId,
                }
              : null,
            assignee: assignee
              ? {
                  name:
                    assignee.firstName && assignee.lastName
                      ? `${assignee.firstName} ${assignee.lastName}`
                      : assignee.name || assignee.email?.split('@')[0] || 'Unknown',
                  avatar: assignee.avatar || null,
                  id: assignee.id || assignee.documentId,
                }
              : null,
            scheduledDate: taskData.scheduledDate || taskData.dueDate || null,
            clientActionRequired: !!taskData.clientActionRequired,
            clientApproval: taskData.clientApproval || null,
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: taskData.updatedAt || taskData.createdAt || new Date().toISOString(),
          }
        })

        setTasks(transformedTasks)
      } catch (error) {
        console.error('Error loading tasks:', error)
        setTasks([])
      } finally {
        setTasksLoading(false)
      }
    }

    if (session) {
      loadTasks()
    }
  }, [session, tasksReloadKey])

  const handleCreateTask = async (taskInput) => {
    const priority = (taskInput.priority || 'medium').toLowerCase()
    const projectId = taskInput.projectId ? String(taskInput.projectId).trim() : ''
    await createClientTask({
      name: taskInput.title,
      description: taskInput.description || '',
      projects: projectId ? { set: [projectId] } : undefined,
      scheduledDate: taskInput.dueDate
        ? new Date(`${taskInput.dueDate}T00:00:00`).toISOString()
        : null,
      priority: priority === 'urgent' ? 'high' : priority,
    })
    setTasksReloadKey((prev) => prev + 1)
  }

  const openCreateTaskModal = () => {
    setIsCreateTaskModalOpen(true)
    fetchProjects()
  }

  const taskProjectOptions = mapProjectsForTaskSelect(projects)

  // Calculate KPIs from real data
  useEffect(() => {
    // Calculate Total Projects
    const totalProjects = projects.length

    // Calculate Pending Tasks (tasks requiring client action - client review only)
    const pendingTasks = tasks.filter((task) => {
      const status = (task.strapiStatus || '').toUpperCase()
      return (
        status === 'CLIENT_REVIEW' ||
        task.clientActionRequired ||
        (status === 'PENDING_CLIENT_ACTION' && !task.clientApproval)
      )
    }).length

    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => {
      const status = (task.strapiStatus || '').toUpperCase()
      return ['COMPLETED', 'DONE', 'APPROVED'].includes(status)
    }).length
    const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    setKpiStats({
      totalProjects,
      pendingTasks,
      totalTasks,
      taskCompletion,
    })
  }, [projects, tasks])

  useEffect(() => {
    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()

    if (tasksLoading) {
      setScheduleLoading(true)
      return
    }

    const now = new Date()
    const scheduled = tasks
      .filter((task) => task?.scheduledDate)
      .filter((task) => {
        const scheduledDate = new Date(task.scheduledDate)
        return !Number.isNaN(scheduledDate.getTime()) && isSameDay(scheduledDate, now)
      })
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
      .map((task) => {
        const scheduledDate = new Date(task.scheduledDate)
        const statusUpper = String(task.strapiStatus || '').toUpperCase()
        const done = ['COMPLETED', 'DONE', 'APPROVED'].includes(statusUpper)
        const inProgress = statusUpper === 'IN_PROGRESS' || statusUpper === 'ACTIVE'
        const status = done ? 'Completed' : inProgress ? 'In Progress' : 'Scheduled'
        return {
          id: task.id,
          title: task.name,
          time: scheduledDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timeInfo: task.project?.name || 'General',
          status,
          statusColor: done
            ? 'text-green-700 bg-green-100'
            : inProgress
              ? 'text-yellow-700 bg-yellow-100'
              : 'text-blue-700 bg-blue-100',
          bgColor: done ? 'bg-green-50' : inProgress ? 'bg-yellow-50' : 'bg-blue-50',
          borderColor: done
            ? 'border-green-200'
            : inProgress
              ? 'border-yellow-200'
              : 'border-blue-200',
          dotColor: done ? 'bg-green-500' : inProgress ? 'bg-yellow-500' : 'bg-blue-500',
          icon: Calendar,
          task,
          scheduledDate: task.scheduledDate,
        }
      })

    setTodaysSchedule(scheduled)
    setScheduleLoading(false)
  }, [tasks, tasksLoading])

  // Fetch communities and memberships
  useEffect(() => {
    const loadCommunities = async () => {
      if (!session) return

      try {
        setCommunitiesLoading(true)

        // Get client account ID
        let accountId =
          session?.account?.id ||
          session?.account?.documentId ||
          session?.user?.id ||
          session?.user?.profile?.id ||
          session?.id ||
          session?.documentId

        if (!accountId && typeof window !== 'undefined') {
          const accountData = localStorage.getItem('client_account')
          if (accountData) {
            try {
              const account = JSON.parse(accountData)
              accountId = account.id || account.documentId
            } catch (error) {
              console.error('Error parsing client account data:', error)
            }
          }
        }

        if (!accountId) {
          accountId = strapiClient.getCurrentAccountId()
        }

        if (!accountId) {
          console.warn('No account ID found for communities')
          setCommunities([])
          setCommunityMemberships([])
          setCommunitiesLoading(false)
          return
        }

        const activeMemberships = await listActiveMembershipsForClient(accountId)

        const communitiesWithMembership = COMMUNITIES_LIST.map((community) => {
          const membership = activeMemberships.find(
            (m) =>
              String(m.community || '').toUpperCase() ===
              String(community.strapiEnum || '').toUpperCase()
          )
          return {
            id: community.id,
            name: community.name,
            fullName: community.fullName,
            category: community.category,
            description: community.description || '',
            members: community.members || 0,
            tier: membership?.membershipType || community.tier || 'Standard',
            status: membership ? 'Active' : 'Available',
            isMember: Boolean(membership),
            membership: membership || null,
            color: community.color || 'blue-500',
            icon: community.icon || null,
          }
        })

        setCommunities(communitiesWithMembership)
        setCommunityMemberships(activeMemberships)
      } catch (error) {
        console.error('Error loading communities:', error)
        setCommunities([])
        setCommunityMemberships([])
      } finally {
        setCommunitiesLoading(false)
      }
    }

    if (session) {
      loadCommunities()
    }
  }, [session])

  if (loading) {
    return (
      <PortalPageShell>
        <PageHeader subtitle={getCurrentDate()} breadcrumb={[]} showSearch={false} />
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </PortalPageShell>
    )
  }

  return (
    <PortalPageShell>
      <PageHeader
        subtitle={getCurrentDate()}
        breadcrumb={[]}
        showSearch={true}
        searchPlaceholder="Search anything..."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Projects"
          value={kpiStats.totalProjects.toString()}
          change={`${projects.length} active`}
          changeType="increase"
          icon={Folder}
          colorScheme="orange"
        />
        <KPICard
          title="Pending Tasks"
          value={kpiStats.pendingTasks.toString()}
          change="Action required"
          changeType={kpiStats.pendingTasks > 0 ? 'increase' : 'decrease'}
          icon={AlertCircle}
          colorScheme="orange"
        />
        <KPICard
          title="Total Tasks"
          value={kpiStats.totalTasks.toString()}
          change={`${kpiStats.pendingTasks} pending`}
          changeType="increase"
          icon={CheckSquare}
          colorScheme="orange"
        />
        <KPICard
          title="Task Completion"
          value={`${kpiStats.taskCompletion}%`}
          change="+0%"
          changeType="increase"
          icon={Target}
          colorScheme="orange"
        />
      </div>

      {/* Enhanced Dashboard Sections */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left Column - Tasks & Projects */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tasks Section */}
          <DashboardTasksWidget
            tasks={tasks}
            loading={tasksLoading}
            onAddTask={openCreateTaskModal}
          />
          <DashboardProjectsWidget projects={projects} loading={projectsLoading} />
        </div>

        {/* Right Column - Communities & Quick Access */}
        <div className="space-y-6">
          {/* Communities Section */}
          <Card
            outlined={true}
            title="Joined Communities"
            subtitle="Communities you joined from website and portal"
            actions={
              <button
                onClick={() => router.push('/communities')}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors shadow-lg"
              >
                Join
              </button>
            }
          >
            {communitiesLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              </div>
            ) : communities.filter((community) => community.isMember).length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No joined communities yet</p>
                <p className="text-sm text-gray-500 mt-1">Join a community to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {communities
                  .filter((community) => community.isMember)
                  .map((community) => {
                    return (
                      <div
                        key={community.id}
                        className={`group relative overflow-hidden rounded-xl border border-white/20 transition-all duration-300 hover:shadow-lg ${
                          community.isMember
                            ? 'shadow-md bg-white/40 backdrop-blur-sm'
                            : 'shadow-md bg-white/30 backdrop-blur-sm'
                        }`}
                      >
                        {/* Content */}
                        <div className="relative z-10 p-4">
                          {/* Header Section */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm mb-0.5">
                                {community.name}
                              </h3>
                              <p className="text-xs text-gray-500 font-medium">
                                {community.category}
                              </p>
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded-lg font-semibold shadow-sm ${
                                community.isMember
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              {community.isMember ? 'Member' : community.status}
                            </div>
                          </div>

                          {/* Primary CTA */}
                          {community.isMember ? (
                            <button
                              onClick={() => {
                                router.push(`/communities/${community.id}`)
                              }}
                              className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-md"
                            >
                              View Community
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                router.push(`/communities/${community.id}/join`)
                              }}
                              className="w-full px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-gray-900 rounded-lg text-sm font-medium hover:bg-white/30 hover:border-white/40 transition-all"
                            >
                              Join Community
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>

          {/* Schedule/Calendar */}
          <Card
            glass={true}
            title="Today's Schedule"
            subtitle={new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
            actions={
              <button
                onClick={() => router.push('/tasks')}
                className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 hover:border-white/40 transition-all duration-300 text-sm font-medium text-gray-900 flex items-center gap-2 shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                View Calendar
              </button>
            }
          >
            {scheduleLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              </div>
            ) : todaysSchedule.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No scheduled tasks today</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tasks scheduled for today will appear here
                </p>
              </div>
            ) : (
              <div className="relative z-10">
                <div className="space-y-4">
                  {todaysSchedule.map((item) => {
                    const Icon = item.icon
                    const isInProgress =
                      item.status === 'In Progress' ||
                      (item.scheduledDate && new Date(item.scheduledDate) <= new Date())
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedTask(item.task)
                          setIsTaskModalOpen(true)
                        }}
                        className={`group relative ${item.bgColor} rounded-xl border ${item.borderColor} p-4 hover:shadow-lg transition-all duration-300 cursor-pointer`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div
                              className={`w-4 h-4 ${item.dotColor} rounded-full shadow-sm`}
                            ></div>
                            {isInProgress && (
                              <div
                                className={`absolute inset-0 w-4 h-4 ${item.dotColor} rounded-full animate-ping opacity-30`}
                              ></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 text-base group-hover:text-gray-700 transition-colors">
                                {item.title}
                              </h4>
                              <span
                                className={`text-xs ${item.statusColor} px-2 py-1 rounded-full font-medium`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <p className="text-sm text-gray-600">{item.time}</p>
                              <span className="text-xs text-gray-500">•</span>
                              <p className="text-xs text-gray-500">{item.timeInfo}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-8 h-8 ${item.dotColor} rounded-full flex items-center justify-center shadow-sm`}
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projects={taskProjectOptions}
        clientMembers={clientMembers}
        onTaskCreate={async (taskData) => {
          try {
            await handleCreateTask(taskData)
            setIsCreateTaskModalOpen(false)
          } catch (error) {
            console.error('Error creating task:', error)
            alert(error.message || 'Failed to create task')
            throw error
          }
        }}
      />
    </PortalPageShell>
  )
}
