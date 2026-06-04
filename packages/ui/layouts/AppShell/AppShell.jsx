'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import { Loader2 } from 'lucide-react'

export function AppShell({
  children,
  sidebar: Sidebar,
  loginPath = '/login',
  unauthorizedPath = '/unauthorized',
  loadingMessage = 'Loading...',
  redirectingMessage = 'Redirecting to login...',
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
    return (
      <div className="flex h-screen overflow-hidden bg-white">
        {Sidebar ? (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        ) : null}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white">{children}</main>
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
