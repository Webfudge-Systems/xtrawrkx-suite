'use client'

import { useCallback, useEffect, useState } from 'react'
import { CreditCard, RefreshCw } from 'lucide-react'
import { Badge, Button, Card, KPICard, LoadingSpinner, Table, TableCellText, TableEmptyBelow } from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { billingService } from '../../lib/api'

function formatCurrency(value) {
  const n = Number(value || 0)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(value) {
  if (!value) return 'â€”'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'â€”'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusBadge(status) {
  const map = {
    trial: 'bg-orange-100 text-orange-700',
    active: 'bg-emerald-100 text-emerald-700',
    suspended: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
  }
  return map[String(status || '').toLowerCase()] || 'bg-gray-100 text-gray-700'
}

export default function BillingPage() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await billingService.getOverview()
      setOverview(data)
    } catch (err) {
      setError(err?.message || 'Failed to load billing overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const org = overview?.organization || {}
  const seats = overview?.seatUtilization || {}
  const subscriptions = overview?.subscriptions || []

  const columns = [
    { key: 'app', label: 'App', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'cycle', label: 'Billing cycle', sortable: false },
    { key: 'seats', label: 'Seats', sortable: false },
    { key: 'price', label: 'Price', sortable: false },
    { key: 'next', label: 'Next billing', sortable: false },
  ]

  return (
    <div className="min-h-full bg-gray-50">
      <AccountsPageHeader
        title="Billing & Subscriptions"
        subtitle="Plan management, seat utilization, and subscription status."
        breadcrumb={[{ label: 'Billing', href: '/billing' }]}
        actions={
          <Button variant="secondary" onClick={load} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <KPICard title="Organization status" value={org.status || 'â€”'} icon={CreditCard} />
              <KPICard title="Active users" value={String(seats.activeUsers ?? 0)} subtitle={`${seats.totalUsers ?? 0} total`} />
              <KPICard title="Billed seats" value={String(seats.billedSeats ?? 0)} />
              <KPICard
                title="Monthly spend"
                value={formatCurrency(overview?.monthlySpend)}
                subtitle={org.trialDaysRemaining != null ? `${org.trialDaysRemaining} trial days left` : undefined}
              />
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Subscriptions</h2>
                <p className="text-sm text-gray-500">Apps and modules enabled for your organization.</p>
              </div>
              {subscriptions.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No subscriptions found for this organization.</div>
              ) : (
                <>
                  <Table
                    columns={columns}
                    data={subscriptions}
                    renderCell={(row, column) => {
                      if (column.key === 'app') {
                        return (
                          <TableCellText
                            primary={row.app?.name || row.app?.slug || 'App'}
                            secondary={(row.modules || []).map((m) => m.name || m.slug).filter(Boolean).join(', ') || undefined}
                          />
                        )
                      }
                      if (column.key === 'status') {
                        return (
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(row.status)}`}>
                            {row.status || 'unknown'}
                          </span>
                        )
                      }
                      if (column.key === 'cycle') return <TableCellText primary={row.billingCycle || 'â€”'} />
                      if (column.key === 'seats') return <TableCellText primary={String(row.totalUsers ?? 'â€”')} />
                      if (column.key === 'price') return <TableCellText primary={formatCurrency(row.calculatedPrice)} />
                      if (column.key === 'next') return <TableCellText primary={formatDate(row.nextBillingDate)} />
                      return null
                    }}
                  />
                  <TableEmptyBelow count={subscriptions.length} noun="subscription" />
                </>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Payment methods</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Online payment gateway integration (Razorpay/Stripe) can be connected here when enabled.
                  </p>
                </div>
                <Badge variant="secondary">Coming soon</Badge>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
