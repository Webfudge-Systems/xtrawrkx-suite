'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, LayoutGrid, LogOut, Plus, X } from 'lucide-react'
import { useAuth } from '@webfudge/auth'
import { ORG_MANAGER_SITE } from '../lib/site'

const items = [
  { label: 'Organizations', href: '/organizations', icon: LayoutGrid },
  { label: 'Create organization', href: '/organizations/new', icon: Plus },
]

export default function PlatformSidebar({
  collapsed = false,
  onToggle,
  onMobileClose,
  isMobileDrawer = false,
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const handleNavClick = () => {
    onMobileClose?.()
  }

  const showExpanded = isMobileDrawer || !collapsed

  return (
    <div
      className={`${
        showExpanded ? 'w-64' : 'w-16'
      } h-full min-h-0 bg-white border border-gray-200/90 flex flex-col shadow-[0_8px_24px_rgba(15,23,42,0.08)] overflow-hidden transition-[width] duration-300`}
    >
      <div className="shrink-0 p-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2">
          {!showExpanded ? (
            <Link href="/organizations" className="flex shrink-0" aria-label={`${ORG_MANAGER_SITE.brandName} home`} onClick={handleNavClick}>
              <Image
                src={ORG_MANAGER_SITE.logoPath}
                alt={ORG_MANAGER_SITE.brandName}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
            </Link>
          ) : (
            <Link
              href="/organizations"
              className="flex min-w-0 flex-1 items-center gap-2.5"
              aria-label={`${ORG_MANAGER_SITE.brandName} home`}
              onClick={handleNavClick}
            >
              <Image
                src={ORG_MANAGER_SITE.logoPath}
                alt={ORG_MANAGER_SITE.brandName}
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-contain"
                priority
              />
              <div className="min-w-0">
                <span className="block font-bold text-lg tracking-tight bg-gradient-to-r from-orange-700 via-orange-500 to-amber-400 bg-clip-text text-transparent truncate">
                  {ORG_MANAGER_SITE.brandName}
                </span>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{ORG_MANAGER_SITE.name}</p>
              </div>
            </Link>
          )}
          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onMobileClose}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                active
                  ? 'bg-brand-primary text-white border-brand-primary/30'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title={!showExpanded ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {showExpanded && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          )
        })}
      </div>

      <div className="shrink-0 p-3 border-t border-gray-100">
        {showExpanded && user && (
          <p className="text-xs text-gray-500 mb-2 truncate px-1">{user.email}</p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {showExpanded && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </div>
  )
}
