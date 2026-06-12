'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LoadingSpinner, SidebarProductBranding } from '@webfudge/ui'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  FileText,
  Receipt,
  CheckSquare,
  BarChart3,
  Calendar,
  GitBranch,
  MessageSquare,
  FolderOpen,
  FileStack,
  PanelLeftClose,
  Plus,
  DollarSign,
  Pencil,
  Trash2,
  Activity,
  CalendarDays,
} from 'lucide-react'
import SubSidebar from './SubSidebar'
import { fetchGlobalActivityFeed } from '../lib/api/crmActivityService'
import { canReadCRM } from '../lib/rbac'
import { CRM_SITE } from '../lib/site'

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function activityDetailHref(row) {
  const st = String(row?.subjectType || '').toLowerCase()
  const id = row?.subjectId
  if (id == null || id === '') return null
  if (st === 'contact') return `/sales/contacts/${id}`
  if (st === 'lead_company') return `/sales/lead-companies/${id}`
  if (st === 'deal') return `/sales/deals/${id}`
  return null
}

function activityIconFor(row) {
  const action = String(row?.action || '').toLowerCase()
  if (action === 'comment') return MessageSquare
  if (action === 'create') return Plus
  if (action === 'update') return Pencil
  if (action === 'delete') return Trash2
  return Activity
}

const comingSoonHref = (feature) => `/coming-soon?feature=${encodeURIComponent(feature)}`

const SIDEBAR_ACTIVITY_LIMIT = 10

export default function CRMSidebar({ collapsed = false, onToggle }) {
  const [subSidebarOpen, setSubSidebarOpen] = useState(false)
  const [currentSection, setCurrentSection] = useState(null)
  const [feedItems, setFeedItems] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href) => {
    if (!href || href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isSalesActive = () => pathname.startsWith('/sales/')
  /** Proposals / tasks live under /clients/* URLs but belong to Workspace in the nav. */
  const isWorkspaceClientRoute = () =>
    pathname.startsWith('/clients/proposals') || pathname.startsWith('/clients/tasks')
  const isWorkspaceActive = () =>
    pathname.startsWith('/workspace') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/meetings') ||
    pathname.startsWith('/threads') ||
    pathname.startsWith('/activities') ||
    isWorkspaceClientRoute()
  const isClientsActive = () => pathname.startsWith('/clients/') && !isWorkspaceClientRoute()
  const isAnalyticsActive = () => pathname.startsWith('/analytics')

  const handleTopLevelClick = (sectionId) => {
    setCurrentSection(sectionId)
    setSubSidebarOpen(true)
  }

  const closeSubSidebar = () => {
    setSubSidebarOpen(false)
    setCurrentSection(null)
  }

  const handleNavigate = () => {
    closeSubSidebar()
  }

  const loadFeed = useCallback(async () => {
    try {
      setLoadingFeed(true)
      const { data } = await fetchGlobalActivityFeed({ limit: SIDEBAR_ACTIVITY_LIMIT })
      setFeedItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Sidebar activity feed:', e)
      setFeedItems([])
    } finally {
      setLoadingFeed(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
    const interval = setInterval(loadFeed, 30000)
    return () => clearInterval(interval)
  }, [loadFeed])

  const onActivityClick = (row) => {
    const href = activityDetailHref(row)
    if (href) router.push(href)
  }

  const mainNavigationItems = [
    {
      id: 'dashboard',
      module: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
      hasSubNav: false,
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: DollarSign,
      hasSubNav: true,
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: FolderKanban,
      hasSubNav: true,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Building2,
      hasSubNav: true,
    },
  ]

  const navigationData = [
    {
      id: 'sales',
      label: 'Sales',
      children: [
        {
          id: 'lead-companies',
          module: 'leads',
          label: 'Lead Companies',
          icon: Users,
          href: '/sales/lead-companies',
        },
        {
          id: 'contacts',
          module: 'contacts',
          label: 'Contacts',
          icon: UserCheck,
          href: '/sales/contacts',
        },
        {
          id: 'opportunities',
          module: 'deals',
          label: 'Deals',
          icon: Briefcase,
          href: '/sales/deals',
        },
        {
          id: 'pipeline',
          module: 'deals',
          label: 'Pipeline Board',
          icon: BarChart3,
          href: '/sales/deals/pipeline',
        },
      ],
    },
    {
      id: 'workspace',
      label: 'Workspace',
      children: [
        {
          id: 'threads',
          module: 'leads',
          label: 'Threads',
          icon: MessageSquare,
          href: '/threads',
        },
        {
          id: 'activity-log',
          module: 'dashboard',
          label: 'Activity log',
          icon: Activity,
          href: '/activities',
        },
        {
          id: 'proposals',
          module: 'proposals',
          label: 'Proposals',
          icon: FileText,
          href: '/clients/proposals',
        },
        {
          id: 'tasks',
          module: 'client_projects',
          label: 'Tasks',
          icon: CheckSquare,
          href: '/clients/tasks',
        },
        {
          id: 'meetings',
          module: 'meetings',
          label: 'Meetings',
          icon: Calendar,
          href: '/meetings',
        },
        {
          id: 'calendar',
          module: 'calendar',
          label: 'Calendar',
          icon: CalendarDays,
          href: '/calendar',
        },
        {
          id: 'documents',
          label: 'Documents',
          icon: FileStack,
          href: comingSoonHref('Documents'),
        },
      ],
    },
    {
      id: 'clients',
      label: 'Clients',
      children: [
        {
          id: 'client-accounts',
          module: 'client_accounts',
          label: 'Client Accounts',
          icon: Building2,
          href: '/clients/accounts',
        },
        {
          id: 'invoices',
          module: 'client_invoices',
          label: 'Invoices',
          icon: Receipt,
          href: '/clients/invoices',
        },
        {
          id: 'projects',
          module: 'client_projects',
          label: 'Projects',
          icon: FolderOpen,
          href: '/clients/projects',
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      children: [
        {
          id: 'analytics-home',
          module: 'analytics',
          label: 'Overview',
          icon: BarChart3,
          href: '/analytics',
        },
        {
          id: 'reports',
          module: 'analytics',
          label: 'Reports & Forecasts',
          icon: BarChart3,
          href: comingSoonHref('Analytics'),
        },
      ],
    },
  ]

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

  const visibleNavigationData = navigationData
    .map((section) => ({
      ...section,
      children: (section.children || []).filter((item) => !item.module || canReadCRM(item.module)),
    }))
    .filter((section) => section.children.length > 0)
  const visibleMainNavigationItems = mainNavigationItems.filter((item) => {
    if (item.module) return canReadCRM(item.module)
    if (!item.hasSubNav) return true
    return visibleNavigationData.some((section) => section.id === item.id)
  })
  const canReadAnalytics = canReadCRM('analytics')

  return (
    <>
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
              <Link href="/" className="flex shrink-0" aria-label={`${CRM_SITE.name} home`}>
                <Image
                  src={CRM_SITE.logoPath}
                  alt={CRM_SITE.brandName}
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
                aria-label={`${CRM_SITE.name} home`}
              >
                <Image
                  src={CRM_SITE.logoPath}
                  alt={CRM_SITE.brandName}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 object-contain"
                  priority
                />
                <SidebarProductBranding
                  productName={CRM_SITE.name}
                  companyName={CRM_SITE.brandName}
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

        {/* Scrollable main column */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Navigation */}
          <div className="px-3 pt-3 pb-2">
            {sectionRule('Navigate')}
            <div
              className={`grid gap-2.5 ${
                collapsed ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {visibleMainNavigationItems.map((item) => {
                const Icon = item.icon
                const sectionActive =
                  (item.id === 'sales' && isSalesActive()) ||
                  (item.id === 'workspace' && isWorkspaceActive()) ||
                  (item.id === 'clients' && isClientsActive())
                const linkActive = item.href ? isActive(item.href) : false
                const active = item.hasSubNav ? sectionActive : linkActive
                const tileClass = `relative rounded-xl px-2 py-3.5 flex flex-col items-center justify-center gap-1.5 min-h-[4.5rem] transition-all border shadow-md ${
                  active
                    ? 'bg-brand-primary text-white border-brand-primary/40 shadow-lg shadow-orange-500/25'
                    : 'bg-white/20 backdrop-blur-md border-white/30 text-brand-foreground hover:bg-white/35 hover:shadow-lg'
                }`

                if (item.hasSubNav) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTopLevelClick(item.id)}
                      className={tileClass}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-6 h-6 shrink-0" strokeWidth={2} />
                      {!collapsed && (
                        <span className="text-xs font-semibold text-center leading-snug px-0.5 line-clamp-2">
                          {item.label}
                        </span>
                      )}
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={tileClass}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-6 h-6 shrink-0" strokeWidth={2} />
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

          {!collapsed && (
            <div className="px-3 pt-2 pb-2">
              <Link
                href="/automations"
                className={`w-full rounded-xl px-3 py-3 flex items-center justify-center gap-2 text-sm font-semibold shadow-md border transition-all ${
                  pathname.startsWith('/automations')
                    ? 'bg-brand-primary text-white border-brand-primary/40 shadow-lg shadow-orange-500/25'
                    : 'bg-white/20 backdrop-blur-md border-white/30 text-brand-foreground hover:bg-white/35 hover:shadow-lg'
                }`}
              >
                <GitBranch className="w-5 h-5 shrink-0" strokeWidth={2} />
                Automation
              </Link>
            </div>
          )}

          {/* Activity feed — match list-table chrome (lead companies / contacts): border + shadow-md */}
          {!collapsed && canReadCRM('dashboard') && (
            <div className="px-3 py-2 relative z-0">
              {sectionRule('Activity')}
              <div className="rounded-xl border border-gray-300 bg-white shadow-md overflow-hidden relative z-0 ring-1 ring-black/[0.04]">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-900">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Activity className="w-3.5 h-3.5 shrink-0 text-gray-600" />
                    <span className="truncate">Latest activity</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/activities"
                      className="text-[10px] font-medium text-brand-primary hover:underline"
                    >
                      Full log
                    </Link>
                    <button
                      type="button"
                      onClick={() => loadFeed()}
                      className="text-[10px] text-gray-500 hover:text-gray-800"
                    >
                      Refresh
                    </button>
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto overscroll-contain divide-y divide-gray-100">
                  {loadingFeed ? (
                    <div className="flex justify-center py-6">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : feedItems.length === 0 ? (
                    <p className="text-center py-6 px-3 text-[11px] text-gray-500">
                      No activity yet
                    </p>
                  ) : (
                    feedItems.slice(0, SIDEBAR_ACTIVITY_LIMIT).map((row) => {
                      const AIcon = activityIconFor(row)
                      const href = activityDetailHref(row)
                      const summary = String(row.summary || 'Activity').trim() || 'Activity'
                      const ts = formatRelativeTime(row.createdAt)
                      return (
                        <button
                          key={row.id}
                          type="button"
                          disabled={!href}
                          onClick={() => onActivityClick(row)}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left text-[11px] transition-colors ${
                            href
                              ? 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                              : 'text-gray-500 cursor-default'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 line-clamp-2 leading-snug">
                              {summary}
                            </div>
                            {ts && <div className="text-[10px] text-gray-500 mt-0.5">{ts}</div>}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System + profile scroll with the rest (not pinned to viewport bottom) */}
          {!collapsed && canReadAnalytics && (
            <div className="px-3 pt-2 pb-2 space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="flex-1 h-px bg-white/25" />
                <span className="text-[10px] uppercase tracking-wider text-brand-text-light font-semibold">
                  System
                </span>
                <div className="flex-1 h-px bg-white/25" />
              </div>
              <button
                type="button"
                onClick={() => handleTopLevelClick('analytics')}
                className={`w-full rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 shadow-md border transition-all ${
                  isAnalyticsActive()
                    ? 'bg-brand-primary text-white border-brand-primary/40 shadow-lg shadow-orange-500/25'
                    : 'bg-white/20 backdrop-blur-md border-white/30 text-brand-foreground hover:bg-white/35 hover:shadow-lg'
                }`}
              >
                <BarChart3 className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span className="text-xs font-semibold text-center">Analytics</span>
              </button>
            </div>
          )}

          {collapsed && canReadAnalytics && (
            <div className="px-2 py-2 flex justify-center">
              <button
                type="button"
                onClick={() => handleTopLevelClick('analytics')}
                className={`p-3 rounded-xl border shadow-md transition-all ${
                  isAnalyticsActive()
                    ? 'bg-brand-primary text-white border-brand-primary/40 shadow-lg shadow-orange-500/25'
                    : 'bg-white/20 border-white/30 text-brand-foreground hover:bg-white/35'
                }`}
                title="Analytics"
              >
                <BarChart3 className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          )}

        </div>
      </div>

      <SubSidebar
        isOpen={subSidebarOpen}
        onClose={closeSubSidebar}
        currentSection={currentSection}
        navigationData={visibleNavigationData}
        onNavigate={handleNavigate}
      />
    </>
  )
}
