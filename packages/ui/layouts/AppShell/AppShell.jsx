'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import { Loader2 } from 'lucide-react'
import { WorkspaceTopBar } from './WorkspaceTopBar'

export function AppShell({
  children,
  sidebar: Sidebar,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
  loadingMessage = 'Loading...',
  redirectingMessage = 'Redirecting to login...',
  /** 'collapse' narrows the sidebar; 'hide' removes it entirely with a top bar to reopen. */
  sidebarBehavior = 'collapse',
  /** Shown in the top bar when sidebar is hidden (logo + label). */
  sidebarBranding,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const isHideMode = sidebarBehavior === 'hide'
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === loginPath
  const isUnauthorizedPage = pathname === unauthorizedPath

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage && !isUnauthorizedPage) {
      router.push(loginPath)
    }
  }, [isAuthenticated, loading, isLoginPage, isUnauthorizedPage, router, loginPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <p className="text-gray-900">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  if (isLoginPage || isUnauthorizedPage) {
    return <>{children}</>
  }

  if (isAuthenticated) {
    const showSidebar = Sidebar && (!isHideMode || !sidebarHidden)

    return (
      <div className="flex h-screen overflow-hidden bg-white flex-col">
        {isHideMode && sidebarHidden ? (
          <WorkspaceTopBar
            onOpenSidebar={() => setSidebarHidden(false)}
            branding={sidebarBranding}
          />
        ) : null}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {showSidebar ? (
            <Sidebar
              collapsed={isHideMode ? false : sidebarCollapsed}
              onToggle={
                isHideMode
                  ? () => setSidebarHidden(true)
                  : () => setSidebarCollapsed((value) => !value)
              }
            />
          ) : null}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-white">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        <p className="text-gray-900">{redirectingMessage}</p>
      </div>
    </div>
  )
}

export default AppShell
