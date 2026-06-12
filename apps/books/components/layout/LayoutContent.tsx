'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import { Loader2 } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SubPageTabs from './SubPageTabs'
import TopbarTrailing from './TopbarTrailing'
import ConfigureFeaturesModal from '../configure-features/ConfigureFeaturesModal'
import { BooksShellActionsProvider } from '@/context/BooksShellActionsContext'
import { BooksRecordsStoreProvider } from '@/lib/mock-data/BooksRecordsStoreProvider'
import { getDefaultTabHref } from '@/lib/tabs'
import { isBooksEntityPage } from '@/lib/routes'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const [showConfigure, setShowConfigure] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/login'
  const isUnauthorizedPage = pathname === '/unauthorized'

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage && !isUnauthorizedPage) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoginPage, isUnauthorizedPage, loading, router])

  useEffect(() => {
    if (loading || !isAuthenticated || isLoginPage || isUnauthorizedPage) return
    const target = getDefaultTabHref(pathname)
    if (target && target !== pathname) {
      router.replace(target)
    }
  }, [isAuthenticated, isLoginPage, isUnauthorizedPage, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--books-bg-page)]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (isLoginPage || isUnauthorizedPage) return <>{children}</>
  if (!isAuthenticated) return null

  const hideModuleChrome = isBooksEntityPage(pathname)

  return (
    <BooksRecordsStoreProvider>
      <BooksShellActionsProvider>
        <div className="flex h-screen bg-[var(--books-bg-page)]">
        <Sidebar onConfigureFeatures={() => setShowConfigure(true)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 pb-6">
            <div className="min-h-full" key={pathname}>
              {!hideModuleChrome ? (
                <div className="relative z-30 flex w-full min-w-0 flex-col gap-3 pb-2 pt-5 md:flex-row md:items-end md:justify-between md:gap-6 md:pt-6">
                  <Topbar className="min-w-0 md:max-w-[min(100%,36rem)] md:flex-1" />
                  <Suspense fallback={null}>
                    <SubPageTabs trailing={<TopbarTrailing />} />
                  </Suspense>
                </div>
              ) : (
                <div className="pt-5 md:pt-6" />
              )}
              {children}
            </div>
          </main>
        </div>
        <ConfigureFeaturesModal
          isOpen={showConfigure}
          onClose={() => setShowConfigure(false)}
        />
        </div>
      </BooksShellActionsProvider>
    </BooksRecordsStoreProvider>
  )
}
