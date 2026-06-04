'use client'

import { useEffect, useState } from 'react'
import { Button, Checkbox, Modal } from '@webfudge/ui'
import { getSupabaseClient } from '@/lib/supabase'

type ConfigureFeaturesModalProps = {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

const FEATURES = [
  { key: 'estimates', label: 'Estimates', description: 'Send proposals and get them approved.' },
  { key: 'retainerInvoices', label: 'Retainer Invoices', description: 'Collect retainers in advance.' },
  { key: 'timesheet', label: 'Timesheet', description: 'Track and bill project hours.' },
  { key: 'priceList', label: 'Price List', description: 'Create custom prices per client.' },
  { key: 'salesOrders', label: 'Sales Orders', description: 'Confirm customer orders.' },
  { key: 'deliveryChallans', label: 'Delivery Challans', description: 'Transfer goods effectively.' },
  { key: 'purchaseOrders', label: 'Purchase Orders', description: 'Create and send POs to vendors.' },
  { key: 'inventory', label: 'Inventory', description: 'Track stock levels and valuation.' },
] as const

type FeaturesState = Record<(typeof FEATURES)[number]['key'], boolean>

const defaultState: FeaturesState = {
  estimates: false,
  retainerInvoices: true,
  timesheet: true,
  priceList: false,
  salesOrders: false,
  deliveryChallans: false,
  purchaseOrders: true,
  inventory: false,
}

export default function ConfigureFeaturesModal({ isOpen, onClose, userId }: ConfigureFeaturesModalProps) {
  const [state, setState] = useState<FeaturesState>(defaultState)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const raw = localStorage.getItem('books-features')
    if (raw) setState({ ...defaultState, ...JSON.parse(raw) })
  }, [isOpen])

  const onToggle = (key: keyof FeaturesState) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const onSave = async () => {
    setSaving(true)
    localStorage.setItem('books-features', JSON.stringify(state))
    try {
      const supabase = getSupabaseClient()
      if (supabase && userId) {
        await supabase.from('books_features').upsert({ user_id: userId, preferences: state })
      }
    } catch (_error) {
      // Local persistence remains fallback for missing backend table.
    } finally {
      setSaving(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Features" subtitle="Enable modules for your business." size="lg">
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Invoices, Credit Notes, Expenses, Bills, Recurring Invoices and more are available by default.
        </div>
        <div className="space-y-3">
          {FEATURES.map((feature) => (
            <label key={feature.key} className="flex gap-3 rounded-lg border border-gray-200 p-3">
              <Checkbox checked={state[feature.key]} onChange={() => onToggle(feature.key)} />
              <div>
                <div className="text-sm font-medium">{feature.label}</div>
                <div className="text-xs text-gray-500">{feature.description}</div>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">You can change these details later in Settings, if needed.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
