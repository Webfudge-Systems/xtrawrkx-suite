'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@webfudge/ui'
import {
  Plus,
  Users,
  FileText,
  Target,
  TrendingUp,
  ClipboardList,
  Wallet,
} from 'lucide-react'

export default function QuickActionsWidget() {
  const router = useRouter()
  // Books doesn’t have the same deal/contact/company counting endpoints as CRM.
  // Keep the UI identical and display 0 until backend wiring is added.
  const [loading] = useState(false)
  const counts = useMemo(
    () => ({ sales: 0, customers: 0, retainerInvoices: 0, reports: 0 }),
    []
  )

  // Align with `ConfigureFeaturesModal` defaults used throughout Books.
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
    try {
      const raw = localStorage.getItem('books-features')
      if (!raw) return
      const parsed = JSON.parse(raw)
      setFeatures({ ...defaultFeatures, ...parsed })
    } catch {
      // Fallback to defaults if localStorage contains invalid JSON.
      setFeatures(defaultFeatures)
    }
  }, [defaultFeatures])

  // Feature-gated actions (same intent as sidebar gating via `books-features`).
  const salesEnabled =
    features.estimates || features.retainerInvoices || features.salesOrders || features.deliveryChallans

  const retainerEnabled = !!features.retainerInvoices

  const shortcuts = useMemo(() => {
    return [
      {
        id: 'sales',
        title: 'Sales',
        count: counts.sales,
        icon: ClipboardList,
        enabled: salesEnabled,
        action: () => {
          // Prefer the most “primary” enabled sales flow.
          if (features.salesOrders) return router.push('/sales/sales-orders')
          if (features.deliveryChallans) return router.push('/sales/delivery-challans')
          if (features.estimates) return router.push('/sales/estimates')
          return router.push('/sales/retainer-invoices')
        },
      },
      {
        id: 'customers',
        title: 'Customers',
        count: counts.customers,
        icon: Users,
        enabled: salesEnabled,
        action: () => router.push('/sales/customers'),
      },
      {
        id: 'retainerInvoices',
        title: 'Retainer Invoices',
        count: counts.retainerInvoices,
        icon: Wallet,
        enabled: retainerEnabled,
        action: () => router.push('/sales/retainer-invoices'),
      },
      {
        id: 'reports',
        title: 'Reports',
        count: counts.reports,
        icon: TrendingUp,
        enabled: true,
        action: () => router.push('/reports'),
      },
    ]
  }, [counts, router, salesEnabled, retainerEnabled, features])

  const templates = useMemo(() => {
    return [
      {
        id: 'invoice',
        name: 'Invoice',
        type: 'Invoice Template',
        enabled: true,
      },
      {
        id: 'sales-order',
        name: 'Sales Order',
        type: 'Order Template',
        enabled: !!features.salesOrders,
      },
    ]
  }, [features.salesOrders])

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quick Access</h2>
          <p className="text-sm text-gray-600">Navigate to key sections</p>
        </div>
        <Target className="w-6 h-6 text-gray-400" />
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          {shortcuts.map((shortcut) => {
            const IconComponent = shortcut.icon
            return (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => {
                  if (!shortcut.enabled) return
                  shortcut.action()
                }}
                disabled={!shortcut.enabled}
                className={`rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group ${
                  shortcut.enabled ? '' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
                    <IconComponent className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium">{shortcut.title}</p>
                    {loading ? (
                      <div className="flex items-center justify-center mt-1" />
                    ) : (
                      <>
                        <p className="text-2xl font-black text-gray-800 mt-1">
                          {typeof shortcut.count === 'number'
                            ? shortcut.count.toLocaleString()
                            : shortcut.count}
                        </p>
                        <div className="mt-1 flex items-center justify-center text-xs text-gray-500">
                          <span className="w-2 h-2 rounded-full mr-1 bg-orange-500"></span>
                          Total items
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates</h3>
        <div className="space-y-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={!template.enabled}
              className="w-full rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-orange-200">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.type}</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}

