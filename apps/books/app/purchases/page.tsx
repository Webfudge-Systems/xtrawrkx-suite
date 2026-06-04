'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@webfudge/ui'
import { CreditCard, FileText, Receipt, Repeat, ShoppingCart, Users } from 'lucide-react'
import { isPurchasesHubModuleEnabled, readBooksFeaturesFromStorage } from '@/lib/books-features'

const purchaseModules = [
  { title: 'Vendors', subtitle: 'View and manage', icon: Users, href: '/purchases/vendors' },
  { title: 'Expenses', subtitle: 'View and manage', icon: Receipt, href: '/purchases/expenses' },
  { title: 'Recurring Expenses', subtitle: 'View and manage', icon: Repeat, href: '/purchases/recurring-expenses' },
  { title: 'Purchase Orders', subtitle: 'View and manage', icon: ShoppingCart, href: '/purchases/purchase-orders' },
  { title: 'Bills', subtitle: 'View and manage', icon: FileText, href: '/purchases/bills' },
  { title: 'Payments Made', subtitle: 'View and manage', icon: CreditCard, href: '/purchases/payments-made' },
  { title: 'Recurring Bills', subtitle: 'View and manage', icon: Repeat, href: '/purchases/recurring-bills' },
  { title: 'Vendor Credits', subtitle: 'View and manage', icon: Receipt, href: '/purchases/vendor-credits' },
] as const

export default function PurchasesPage() {
  const router = useRouter()
  const [features, setFeatures] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const refresh = () => setFeatures(readBooksFeaturesFromStorage())
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const visibleModules = useMemo(
    () => purchaseModules.filter((m) => isPurchasesHubModuleEnabled(m.title, features)),
    [features]
  )

  return (
    <div className="min-h-full space-y-6 bg-white">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Purchases</h1>
        <p className="mt-1 text-sm text-gray-600">Manage vendors, expenses, bills, and purchase orders.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visibleModules.map((m) => {
          const Icon = m.icon
          return (
            <Card
              key={m.href}
              variant="outlined"
              hoverable={true}
              onClick={() => router.push(m.href)}
              className="p-6"
              padding={false}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900">{m.title}</div>
                  <div className="text-sm text-gray-500">{m.subtitle}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

