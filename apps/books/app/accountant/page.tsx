'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@webfudge/ui'
import { Banknote, BarChart3, BookOpen, ClipboardList, Lock } from 'lucide-react'

const accountantModules = [
  { title: 'Manual Journals', subtitle: 'View and manage', icon: BookOpen, href: '/accountant/manual-journals' },
  { title: 'Bulk Update', subtitle: 'View and manage', icon: ClipboardList, href: '/accountant/bulk-update' },
  { title: 'Currency Adjustments', subtitle: 'View and manage', icon: Banknote, href: '/accountant/currency-adjustments' },
  { title: 'Chart of Accounts', subtitle: 'View and manage', icon: BarChart3, href: '/accountant/chart-of-accounts' },
  { title: 'Transaction Locking', subtitle: 'View and manage', icon: Lock, href: '/accountant/transaction-locking' },
] as const

export default function AccountantPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 bg-white min-h-full">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Accountant</h1>
        <p className="text-sm text-gray-600 mt-1">Manage journals, accounts, currency adjustments, and controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accountantModules.map((m) => {
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

