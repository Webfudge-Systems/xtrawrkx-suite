'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@webfudge/ui'
import { booksApi } from '@/lib/api'
import type { Expense, Invoice, TimeEntry } from '@/lib/types'
import { BarChart3, Clock3, Receipt, Wallet } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'

function parseDate(dateStr: string | undefined) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function BooksSalesAnalyticsWidget() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])

  const defaultFeatures = useMemo(
    () => ({
      estimates: false,
      retainerInvoices: true,
      timesheet: true,
      priceList: false,
      salesOrders: false,
      deliveryChallans: false,
      purchaseOrders: true,
      inventory: false,
    }),
    []
  )

  const [features, setFeatures] = useState(defaultFeatures)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    booksApi
      .fetchInvoices()
      .then((res) => {
        if (cancelled) return
        setInvoices(res.data ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setInvoices([])
      })

    booksApi
      .fetchExpenses()
      .then((res) => {
        if (cancelled) return
        setExpenses(res.data ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setExpenses([])
      })

    booksApi
      .fetchTimeEntries()
      .then((res) => {
        if (cancelled) return
        setTimeEntries(res.data ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setTimeEntries([])
      })

    Promise.allSettled([booksApi.fetchInvoices(), booksApi.fetchExpenses(), booksApi.fetchTimeEntries()]).finally(() => {
      if (cancelled) return
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('books-features')
      if (!raw) return
      const parsed = JSON.parse(raw)
      setFeatures({ ...defaultFeatures, ...parsed })
    } catch {
      setFeatures(defaultFeatures)
    }
  }, [defaultFeatures])

  const computed = useMemo(() => {
    const salesEnabled = features.estimates || features.retainerInvoices || features.salesOrders || features.deliveryChallans
    const purchaseEnabled = !!features.purchaseOrders
    const timesheetEnabled = !!features.timesheet

    const receivables = invoices.reduce((sum, invoice) => sum + (invoice.balanceDue ?? invoice.total ?? 0), 0)
    const payables = expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)

    const unbilledHours = timeEntries
      .filter((t) => t.billable && !t.invoiced)
      .reduce((sum, t) => sum + t.hours, 0)

    const unbilledExpenses = expenses
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + e.amount, 0)

    return { salesEnabled, purchaseEnabled, timesheetEnabled, receivables, payables, unbilledHours, unbilledExpenses }
  }, [expenses, features, invoices, timeEntries])

  if (loading) {
    return (
      <Card className="p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Books Analytics</h2>
          <p className="text-sm text-gray-600">Performance insights and trends</p>
        </div>
        <BarChart3 className="w-6 h-6 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1 font-medium">{computed.salesEnabled ? 'Receivables' : 'Receivables (off)'}</p>
              <p className="text-3xl font-black text-gray-800">
                {formatCurrency(computed.receivables, { notation: 'compact' })}
              </p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full mr-2 ${computed.salesEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                {computed.salesEnabled ? 'Current + overdue' : 'Enable sales features'}
              </div>
            </div>
            <div className="w-16 h-16 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
              <Receipt className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1 font-medium">
                {computed.purchaseEnabled ? 'Payables' : 'Payables (off)'}
              </p>
              <p className="text-3xl font-black text-gray-800">{formatCurrency(computed.payables, { notation: 'compact' })}</p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full mr-2 ${computed.purchaseEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                {computed.purchaseEnabled ? 'Current + overdue' : 'Enable purchase feature'}
              </div>
            </div>
            <div className="w-16 h-16 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
              <Wallet className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1 font-medium">
                {computed.timesheetEnabled ? 'Unbilled Hours' : 'Unbilled Expenses'}
              </p>
              <p className="text-3xl font-black text-gray-800">
                {computed.timesheetEnabled ? `${computed.unbilledHours.toFixed(1)}h` : formatCurrency(computed.unbilledExpenses, { notation: 'compact' })}
              </p>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full mr-2 ${computed.timesheetEnabled ? 'bg-orange-500' : 'bg-green-500'}`} />
                {computed.timesheetEnabled ? 'No unbilled time entries' : 'No pending billable expenses'}
              </div>
            </div>
            <div className="w-16 h-16 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
              {computed.timesheetEnabled ? (
                <Clock3 className="w-8 h-8 text-orange-600" />
              ) : (
                <Wallet className="w-8 h-8 text-orange-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receivables Trend</h3>
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg h-48 flex items-center justify-center">
            <p className="text-sm text-gray-500">Chart will appear here when connected to backend</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoices by Status</h3>
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-lg h-48 flex items-center justify-center">
            <p className="text-sm text-gray-500">Chart will appear here when connected to backend</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

