'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { isOrganizationAdmin } from '../lib/accountsAccess'
import {
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  UsersRound,
  Lock,
  ClipboardList,
  Settings,
  Grid3X3,
  PanelLeftClose,
} from 'lucide-react'
import { ACCOUNTS_SITE } from '../lib/site'

const items = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Roles & Permissions', href: '/roles', icon: Shield },
  { label: 'Departments', href: '/departments', icon: Building2 },
  { label: 'Teams', href: '/teams', icon: UsersRound },
  { label: 'Security', href: '/security', icon: Lock },
  { label: 'Audit Logs', href: '/audit-logs', icon: ClipboardList },
  { label: 'Organization', href: '/settings', icon: Settings },
  { label: 'App Access', href: '/app-access', icon: Grid3X3 },
]

function isItemActive(pathname, item) {
  if (item.href === '/') return pathname === '/'
  return pathname.startsWith(item.href.split('?')[0])
}

export default function AccountsSidebar({ collapsed = false, onToggle }) {
  const pathname = usePathname()
  const navItems = useMemo(
    () => items.filter((item) => item.href !== '/security' || isOrganizationAdmin()),
    []
  )

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } h-full min-h-0 bg-white border border-gray-200/90 flex flex-col shadow-[0_8px_24px_rgba(15,23,42,0.08)] overflow-hidden transition-[width] duration-300`}
    >
      <div className="shrink-0 p-4 border-b border-white/20">
        <div className="flex items-center justify-between gap-2">
          {collapsed ? (
            <Link href="/" className="flex shrink-0" aria-label={`${ACCOUNTS_SITE.brandName} home`}>
              <Image
                src={ACCOUNTS_SITE.logoPath}
                alt={ACCOUNTS_SITE.brandName}
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
              aria-label={`${ACCOUNTS_SITE.brandName} home`}
            >
              <Image
                src={ACCOUNTS_SITE.logoPath}
                alt={ACCOUNTS_SITE.brandName}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain"
                priority
              />
              <div className="min-w-0">
                <span className="block font-bold text-xl tracking-tight bg-gradient-to-r from-orange-700 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  {ACCOUNTS_SITE.name}
                </span>
              </div>
            </Link>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isItemActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                active
                  ? 'bg-brand-primary text-white border-brand-primary/30'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
