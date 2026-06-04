'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, X } from 'lucide-react'

export default function SubSidebar({
  isOpen,
  onClose,
  currentSection,
  navigationData,
  onNavigate,
}) {
  const pathname = usePathname()

  const isActive = (href) => {
    if (!href || href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const renderNavigationItem = (item) => {
    const isItemActive = isActive(item.href)

    if (!item.href) return null

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => onNavigate(item.href)}
        className={`flex items-center gap-3 p-3 rounded-lg transition-colors duration-150 ${
          isItemActive
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        {item.icon && <item.icon className="w-4 h-4" />}
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    )
  }

  if (!isOpen || !currentSection) return null

  const sectionData = navigationData.find((item) => item.id === currentSection)

  if (!sectionData) return null

  return (
    <>
      {/* Mobile Overlay */}
      <div className="fixed inset-0 z-40 lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Mobile Sub Sidebar */}
        <div className="fixed right-4 top-4 bottom-4 w-80 bg-white shadow-xl rounded-xl transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {sectionData.label}
                </h2>
                <p className="text-sm text-gray-600">Navigation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Content */}
          <div className="p-4 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
            {sectionData.children?.map((item) => renderNavigationItem(item))}
          </div>
        </div>
      </div>

      {/* Desktop Sub Sidebar */}
      <div className="hidden lg:block">
        {/* Desktop Backdrop */}
        {isOpen && <div className="fixed inset-0 bg-black bg-opacity-25 z-50" onClick={onClose} />}

        <div
          className={`fixed right-4 top-4 bottom-4 w-80 bg-white overflow-hidden shadow-xl rounded-2xl transform transition-transform duration-300 ease-in-out z-[60] ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {sectionData.label}
                </h2>
                <p className="text-sm text-gray-600">Navigation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Navigation Content */}
          <div className="p-4 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
            {sectionData.children?.map((item) => renderNavigationItem(item))}
          </div>
        </div>
      </div>
    </>
  )
}
