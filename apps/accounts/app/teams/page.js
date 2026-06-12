'use client'

import { Clock } from 'lucide-react'
import AccountsPageHeader from '../../components/AccountsPageHeader'

export default function TeamsPage() {
  return (
    <div className="min-h-full space-y-4 bg-white p-4">
      <AccountsPageHeader
        title="Teams"
        subtitle="Create teams, assign leaders, and map members to departments."
        breadcrumb={[{ label: 'Teams', href: '/teams' }]}
      />

      <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <Clock className="h-10 w-10 text-orange-600" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Coming Soon</h2>
          <p className="mb-2 text-gray-600">
            <span className="font-semibold text-gray-900">Teams</span> is currently under development.
          </p>
          <p className="text-gray-500">We&apos;re working on this feature. Check back soon.</p>
        </div>
      </div>
    </div>
  )
}
