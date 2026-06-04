'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@webfudge/ui'
import { Clock3, CreditCard, FileText, Package, Receipt, Repeat, Truck, Users, Wallet } from 'lucide-react'
import { isSalesHubModuleEnabled, readBooksFeaturesFromStorage } from '@/lib/books-features'

const salesModules = [
  {
    title: 'Customers',
    subtitle: 'View and manage',
    icon: Users,
    href: '/sales/customers',
  },
  {
    title: 'Estimates',
    subtitle: 'View and manage',
    icon: FileText,
    href: '/sales/estimates',
  },
  {
    title: 'Retainer Invoices',
    subtitle: 'View and manage',
    icon: Clock3,
    href: '/sales/retainer-invoices',
  },
  {
    title: 'Sales Orders',
    subtitle: 'View and manage',
    icon: Package,
    href: '/sales/sales-orders',
  },
  {
    title: 'Delivery Challans',
    subtitle: 'View and manage',
    icon: Truck,
    href: '/sales/delivery-challans',
  },
  {
    title: 'Invoices',
    subtitle: 'View and manage',
    icon: Receipt,
    href: '/sales/invoices',
  },
  {
    title: 'Payments Received',
    subtitle: 'View and manage',
    icon: Wallet,
    href: '/sales/payments-received',
  },
  {
    title: 'Recurring Invoices',
    subtitle: 'View and manage',
    icon: Repeat,
    href: '/sales/recurring-invoices',
  },
  {
    title: 'Credit Notes',
    subtitle: 'View and manage',
    icon: CreditCard,
    href: '/sales/credit-notes',
  },
] as const

export default function SalesPage() {
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
    () => salesModules.filter((m) => isSalesHubModuleEnabled(m.title, features)),
    [features]
  )

  return (
    <div className="min-h-full space-y-6 bg-white">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
        <p className="mt-1 text-sm text-gray-600">Manage customers, estimates, invoices, and recurring billing.</p>
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

