'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LoadingSpinner, SidebarProductBranding } from '@webfudge/ui'
import {
  LayoutDashboard,
  CheckSquare,
  Inbox,
  MessageCircle,
  BarChart3,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  PanelLeftClose,
  FileText,
  Calendar,
  Target,
  Building2,
  PieChart,
} from 'lucide-react'
import projectService from '../lib/api/projectService'
import { transformProject } from '../lib/api/dataTransformers'
import { canReadPM, canWritePM, canReadClientAccounts } from '../lib/rbac'
import { canCreateProjectsInPm } from '../lib/pmOrgRoles'
import { usePmSidebarBadges } from '../lib/usePmSidebarBadges'
import { PM_SITE } from '../lib/site'

export default function PMSidebar({ collapsed = false, onToggle }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const { inboxCount, messageCount } = usePmSidebarBadges()
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [expandedProjectId, setExpandedProjectId] = useState(null)

  const isActive = (href) => {
    if (!href || href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true)
        const response = await projectService.getAllProjects({
          pageSize: 20,
          sort: 'updatedAt:desc',
        })
        const items = response?.data || response || []
        setProjects(items.map(transformProject))
      } catch {
        setProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  const mainNavigationItems = [
    {
      id: 'dashboard',
      module: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
    },
    {
      id: 'my-tasks',
      module: 'my_tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      href: '/my-tasks',
    },
    {
      id: 'inbox',
      module: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      href: '/inbox',
      badge: inboxCount,
    },
    {
      id: 'message',
      module: 'inbox',
      label: 'Message',
      icon: MessageCircle,
      href: '/message',
      badge: messageCount,
    },
    {
      id: 'clients',
      module: 'client_accounts',
      label: 'Clients',
      icon: Building2,
      href: '/clients/accounts',
    },
    {
      id: 'reports',
      module: 'analytics',
      label: 'Reports',
      icon: PieChart,
      href: '/coming-soon?feature=reports',
    },
  ]

  const pmTools = [
    {
      label: 'Documents',
      icon: FileText,
      href: '/coming-soon?feature=documents',
      comingSoonFeature: 'documents',
    },
    { label: 'Calendar', module: 'calendar', icon: Calendar, href: '/calendar' },
  ]

  const visibleNavigationItems = mainNavigationItems.filter((item) => {
    if (item.id === 'clients') return canReadClientAccounts()
    return canReadPM(item.module)
  })
  const visiblePmTools = pmTools.filter((item) => !item.module || canReadPM(item.module))
  const canReadProjects = canReadPM('projects')
  const canCreateProjects = canWritePM('projects') && canCreateProjectsInPm()

  const isPmToolActive = (item) => {
    if (item.comingSoonFeature) {
      return pathname === '/coming-soon' && searchParams.get('feature') === item.comingSoonFeature
    }
    if (item.href?.startsWith('/coming-soon')) {
      const feature = item.href.split('feature=')[1]?.split('&')[0]
      return pathname === '/coming-soon' && searchParams.get('feature') === feature
    }
    const pathOnly = item.href.split('?')[0]
    if (!pathOnly) return false
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
  }

  const displayedProjects = useMemo(() => {
    if (loadingProjects) return []
    const collapsedCount = 4
    const expandedCount = 6
    if (showAllProjects) return projects.slice(0, expandedCount)
    return projects.slice(0, collapsedCount)
  }, [projects, showAllProjects, loadingProjects])

  const PROJECT_AVATAR_PALETTE = [
    'bg-orange-500',
    'bg-sky-500',
    'bg-violet-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-600',
    'bg-indigo-500',
    'bg-fuchsia-600',
    'bg-slate-700',
  ]

  const getProjectAvatarClass = (project) => {
    const key = project?.id ?? project?.name ?? ''
    let n = 0
    if (typeof key === 'number') n = Math.abs(key)
    else {
      const s = String(key)
      for (let i = 0; i < s.length; i += 1) n += s.charCodeAt(i)
    }
    return PROJECT_AVATAR_PALETTE[n % PROJECT_AVATAR_PALETTE.length]
  }

  const getProjectHealthStyles = (project) => {
    const s = project?.strapiStatus
    if (s === 'COMPLETED') return { icon: 'text-emerald-600', label: 'Completed' }
    if (s === 'CANCELLED') return { icon: 'text-gray-500', label: 'Cancelled' }
    if (s === 'ON_HOLD') return { icon: 'text-sky-600', label: 'On hold' }
    const total = project?.totalTasks ?? 0
    const p = project?.progress ?? 0
    if (total === 0) return { icon: 'text-slate-500', label: 'No tasks yet' }
    if (p >= 72) return { icon: 'text-emerald-600', label: 'On track' }
    if (p >= 38) return { icon: 'text-amber-500', label: 'In progress' }
    return { icon: 'text-rose-600', label: 'Needs attention' }
  }

  const sectionRule = (id) =>
    !collapsed && (
      <div className="flex items-center gap-2 px-1 mb-2">
        <div className="flex-1 h-px bg-white/25" />
        <span className="text-[10px] uppercase tracking-wider text-brand-text-light font-semibold">
          {id}
        </span>
        <div className="flex-1 h-px bg-white/25" />
      </div>
    )

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } h-full min-h-0 bg-white backdrop-blur-xl border-r border-white/30 flex flex-col shadow-xl overflow-hidden transition-[width] duration-300 flex-shrink-0`}
    >
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div
          className={`flex gap-2 ${
            collapsed ? 'flex-col items-center' : 'items-center justify-between'
          }`}
        >
          {collapsed ? (
            <Link href="/" className="flex shrink-0" aria-label={`${PM_SITE.name} home`}>
              <Image
                src={PM_SITE.logoPath}
                alt={PM_SITE.brandName}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
            </Link>
          ) : (
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center gap-2.5"
              aria-label={`${PM_SITE.name} home`}
            >
              <Image
                src={PM_SITE.logoPath}
                alt={PM_SITE.brandName}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain"
                priority
              />
              <SidebarProductBranding
                productName={PM_SITE.name}
                companyName={PM_SITE.brandName}
              />
            </Link>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="w-5 h-5 text-brand-foreground" strokeWidth={1.75} />
          </button>
        </div>
        {!collapsed ? (
          <div
            className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-orange-400/50 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-3 pt-3 pb-2">
          {sectionRule('Navigate')}
          <div
            className={`grid gap-2.5 ${
              collapsed ? 'grid-cols-1' : 'grid-cols-2'
            }`}
          >
            {visibleNavigationItems.map((item) => {
              const Icon = item.icon
              const active = item.href
                ? item.id === 'clients'
                  ? pathname.startsWith('/clients')
                  : item.href.startsWith('/coming-soon')
                    ? pathname === '/coming-soon' &&
                      searchParams.get('feature') === item.href.split('feature=')[1]?.split('&')[0]
                    : isActive(item.href.split('?')[0])
                : false
              const badge = item.badge > 0 ? item.badge : 0
              const badgeLabel = badge > 9 ? '9+' : String(badge)
              return (
                <Link
                  key={item.id}
                  href={item.href || '/'}
                  className={`relative rounded-xl px-2 py-3.5 flex flex-col items-center justify-center gap-1.5 min-h-[4.5rem] transition-all border shadow-md ${
                    active
                      ? 'bg-brand-primary text-white border-brand-primary/40 shadow-lg shadow-orange-500/25'
                      : 'bg-white/20 backdrop-blur-md border-white/30 text-brand-foreground hover:bg-white/35 hover:shadow-lg'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="relative inline-flex">
                    <Icon className="w-6 h-6 shrink-0" strokeWidth={2} />
                    {badge > 0 ? (
                      <span
                        className={`absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold leading-none ${
                          active
                            ? 'bg-white text-orange-600 ring-1 ring-orange-200'
                            : 'bg-red-500 text-white ring-2 ring-white'
                        }`}
                      >
                        {badgeLabel}
                      </span>
                    ) : null}
                  </span>
                  {!collapsed && (
                    <span className="text-xs font-semibold text-center leading-snug px-0.5 line-clamp-2">
                      {item.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Projects */}
        {!collapsed && canReadProjects && (
          <div className="px-3 py-2 relative z-0">
            {sectionRule('Projects')}
            <div className="rounded-xl border border-orange-200/80 bg-gradient-to-b from-orange-50/50 via-white to-white shadow-md overflow-hidden ring-1 ring-orange-100/60">
              <div className="flex items-center justify-between border-b border-orange-200/50 bg-gradient-to-r from-orange-500/12 via-orange-50/90 to-transparent px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-300/40">
                    <FolderOpen className="h-4 w-4 text-orange-600" strokeWidth={2.25} />
                  </span>
                  <span className="truncate text-xs font-bold tracking-wide text-orange-900">
                    Projects
                  </span>
                </span>
                {canCreateProjects ? (
                  <button
                    type="button"
                    onClick={() => router.push('/projects/add')}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm shadow-orange-500/30 transition-colors hover:bg-orange-600"
                    title="New project"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>

              <div className="px-1.5 py-1.5">
                {loadingProjects ? (
                  <div className="flex justify-center py-6">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <p className="text-[11px] font-medium text-gray-700">No projects yet</p>
                    <p className="mt-1 text-[11px] leading-snug text-gray-500">
                      Projects you have access to will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {displayedProjects.map((project) => {
                      const slugPath = project.slug || project.id
                      const routeActive = pathname.startsWith(`/projects/${slugPath}`)
                      const health = getProjectHealthStyles(project)
                      const isOpen = expandedProjectId === project.id
                      return (
                        <div key={project.id}>
                          <div
                            className={`flex items-center gap-1 rounded-lg border-l-[3px] transition-colors ${
                              routeActive
                                ? 'border-l-orange-500 bg-orange-100/70 shadow-sm shadow-orange-500/10'
                                : 'border-l-transparent hover:border-l-orange-300/80 hover:bg-orange-50/80'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => router.push(`/projects/${slugPath}`)}
                              className="flex min-w-0 flex-1 items-center gap-2.5 py-2.5 pl-2 pr-1 text-left"
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm ${getProjectAvatarClass(project)}`}
                              >
                                {(project.name || 'P').charAt(0).toUpperCase()}
                              </span>
                              <span
                                className={`truncate text-sm font-medium ${
                                  routeActive ? 'text-orange-950' : 'text-gray-800'
                                }`}
                              >
                                {project.name}
                              </span>
                            </button>
                            <span
                              className={`inline-flex shrink-0 rounded-md border p-1 shadow-sm ${
                                routeActive
                                  ? 'border-orange-200/90 bg-white'
                                  : 'border-orange-100/80 bg-white/90'
                              }`}
                              title={`${health.label} · ${project.progress ?? 0}% complete`}
                            >
                              <BarChart3
                                className={`h-3.5 w-3.5 ${routeActive ? 'text-orange-600' : health.icon}`}
                                strokeWidth={2.5}
                              />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedProjectId((id) =>
                                  id === project.id ? null : project.id
                                )
                              }}
                              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-orange-400/90 transition-colors hover:bg-orange-100/80 hover:text-orange-700"
                              aria-expanded={isOpen}
                              aria-label={
                                isOpen ? 'Collapse project details' : 'Expand project details'
                              }
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>
                          {isOpen && (
                            <div className="border-t border-orange-100/80 bg-orange-50/60 px-3 py-2 pl-[3.25rem] text-[11px] leading-relaxed text-gray-600">
                              <span className="font-medium text-orange-800">{project.status}</span>
                              <span className="mx-1.5 text-gray-300">·</span>
                              <span>{project.progress ?? 0}% done</span>
                              {(project.totalTasks ?? 0) > 0 && (
                                <>
                                  <span className="mx-1.5 text-gray-300">·</span>
                                  <span>
                                    {project.completedTasks ?? 0}/{project.totalTasks} tasks
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {projects.length > 4 && (
                      <div className="px-1 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAllProjects(!showAllProjects)}
                          className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                        >
                          <span>{showAllProjects ? 'Show less' : 'Load more'}</span>
                          {showAllProjects ? (
                            <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    )}
                    <div className="px-1 pb-1 pt-1">
                      <Link
                        href="/projects"
                        className="flex w-full items-center gap-2 rounded-lg border border-orange-200/70 bg-white px-3 py-2 text-[11px] font-semibold text-orange-800 transition-colors hover:border-orange-300 hover:bg-orange-50"
                      >
                        <FolderOpen className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                        <span>All projects</span>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 text-orange-500" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tools — CRM-style panel + links */}
        {!collapsed && (
          <div className="px-3 pt-2 pb-2">
            {sectionRule('Tools')}
            <div className="rounded-xl border border-gray-300 bg-white shadow-md overflow-hidden ring-1 ring-black/[0.04]">
              <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-900">
                <Target className="w-3.5 h-3.5 shrink-0 text-gray-600" />
                <span>Workspace tools</span>
              </div>
              <div className="p-2 space-y-0.5">
                {visiblePmTools.map((item, index) => {
                  const Icon = item.icon
                  const active = isPmToolActive(item)
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors group/item ${
                        active
                          ? 'bg-gray-50 text-gray-900 font-semibold'
                          : 'text-gray-800 font-medium hover:bg-gray-50'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-gray-700' : 'text-gray-500'}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
