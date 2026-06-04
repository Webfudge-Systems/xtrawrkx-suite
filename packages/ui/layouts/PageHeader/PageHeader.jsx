'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  ChevronDown,
  Search,
  Upload,
  Download,
  Settings,
  User,
  Share,
  Bell,
  Image,
} from 'lucide-react'
import { Card } from '../../components/Card'

export default function PageHeader({
  title,
  subtitle,
  breadcrumb = [],
  showSearch = false,
  showActions = false,
  showProfile = true,
  searchPlaceholder,
  onSearchChange,
  onAddClick,
  onFilterClick,
  onImportClick,
  onExportClick,
  onShareImageClick,
  actions,
  children,
  hasActiveFilters = false,
}) {
  const pathname = usePathname()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState('')

  // Build breadcrumb from pathname if not provided
  const breadcrumbItems =
    breadcrumb.length > 0
      ? breadcrumb.map((item) => {
          if (typeof item === 'string') {
            const segments = pathname.split('/').filter(Boolean)
            const itemIndex = breadcrumb.findIndex((b) => b === item)
            if (itemIndex >= 0 && itemIndex < segments.length) {
              const href = '/' + segments.slice(0, itemIndex + 1).join('/')
              return { label: item, href }
            }
            return { label: item, href: '#' }
          }
          const label =
            typeof item.label === 'string' ? item.label : typeof item === 'string' ? item : ''
          return {
            label: label || 'Page',
            href: item.href || '#',
          }
        })
      : pathname
          .split('/')
          .filter(Boolean)
          .map((segment, index, array) => {
            const href = '/' + array.slice(0, index + 1).join('/')
            const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
            return { label, href }
          })

  return (
    <Card glass={true} className="relative z-[40]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Breadcrumb */}
          {breadcrumbItems.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-gray-900 font-medium">
                      {typeof item.label === 'string' ? item.label : String(item.label || '')}
                    </span>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                    >
                      {typeof item.label === 'string' ? item.label : String(item.label || '')}
                    </Link>
                  )}
                  {index < breadcrumbItems.length - 1 && <ChevronRight className="w-4 h-4" />}
                </div>
              ))}
            </div>
          )}

          {/* Title and Subtitle */}
          <h1 className="text-xl sm:text-4xl font-normal text-gray-900 mb-0.5 tracking-tight leading-snug">
            {title}
          </h1>
          {subtitle && <p className="text-gray-600 leading-relaxed">{subtitle}</p>}
        </div>

        {/* Custom content or default actions */}
        {(children || showSearch || showActions || actions) && (
          <div className="flex items-center gap-4 ml-4">
            {/* Search Bar */}
            {showSearch && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || 'Search...'}
                  value={searchInputValue}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchInputValue(value)
                    if (onSearchChange) {
                      onSearchChange(value)
                    }
                  }}
                  className="w-64 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white/15 transition-all duration-300 placeholder:text-gray-400 shadow-lg"
                />
              </div>
            )}

            {/* Actions */}
            {children ||
              (showActions && (
                <div className="flex items-center gap-2">
                  {onImportClick && (
                    <button
                      onClick={onImportClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Upload className="w-5 h-5 text-gray-600" />
                    </button>
                  )}

                  {onExportClick && (
                    <button
                      onClick={onExportClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                  )}

                  {onShareImageClick && (
                    <button
                      onClick={onShareImageClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                      title="Share Image"
                    >
                      <Image className="w-5 h-5 text-gray-600" />
                    </button>
                  )}
                </div>
              ))}

            {/* Custom Actions */}
            {actions &&
              actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg ${
                    action.className || ''
                  }`}
                >
                  {action.icon && <action.icon className="w-5 h-5 text-gray-600" />}
                </button>
              ))}
          </div>
        )}

        {/* User Profile (simplified - without auth dependency) */}
        {showProfile && (
          <div className="flex items-center gap-3 ml-4">
            <div className="relative">
              <button
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300"
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-orange-500 text-sm font-medium">U</span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900">User</p>
                    <p className="text-xs text-gray-600">Role</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showProfileDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
