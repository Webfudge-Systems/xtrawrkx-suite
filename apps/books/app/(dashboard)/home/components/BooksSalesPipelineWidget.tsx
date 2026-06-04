'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@webfudge/ui'
import { ArrowRight } from 'lucide-react'
import { booksApi } from '@/lib/api'
import type { Invoice } from '@/lib/types'

export default function BooksSalesPipelineWidget() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])

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
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const stages = useMemo(() => {
    const countBy = (status: Invoice['status'] | Invoice['status'][]) => {
      const statuses = Array.isArray(status) ? status : [status]
      return invoices.filter((i) => statuses.includes(i.status)).length
    }

    return [
      { key: 'draft', label: 'Draft', count: countBy('Draft') },
      { key: 'sent', label: 'Sent', count: countBy(['Sent', 'Viewed']) },
      { key: 'partial', label: 'Partial', count: countBy('Partial') },
      { key: 'paid', label: 'Paid', count: countBy('Paid') },
      { key: 'overdue', label: 'Overdue', count: countBy('Overdue') },
    ]
  }, [invoices])

  return (
    <Card className="p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Invoices Pipeline</h2>
          <p className="text-sm text-gray-600">Track your invoices through statuses</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/sales/invoices')}
          className="text-sm text-brand-primary hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <div key={stage.key} className="min-w-[200px] flex-shrink-0">
              <div className="rounded-xl bg-white border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">{stage.label}</h3>
                <div className="text-2xl font-black text-gray-800 mb-1">{stage.count}</div>
                <p className="text-xs text-gray-500">invoices</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

