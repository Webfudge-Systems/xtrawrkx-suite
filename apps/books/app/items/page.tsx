'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@webfudge/ui'
import { Boxes, ListOrdered, Package } from 'lucide-react'

const itemsModules = [
  {
    title: 'All Items',
    description: 'Services, products, and bundles you sell.',
    icon: Package,
    href: '/items/all',
  },
  {
    title: 'Price Lists',
    description: 'Customer-specific and group pricing rules.',
    icon: ListOrdered,
    href: '/items/price-lists',
  },
  {
    title: 'Inventory Adjustments',
    description: 'Stock corrections and audit trails.',
    icon: Boxes,
    href: '/items/inventory-adjustments',
  },
] as const

export default function ItemsHubPage() {
  const router = useRouter()

  return (
    <div className="min-h-full space-y-6 bg-white">
      <p className="max-w-2xl text-sm text-gray-600">
        Choose a workspace to manage your catalog, pricing, or stock — same layout as Sales and Purchases.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {itemsModules.map((m) => {
          const Icon = m.icon
          return (
            <Card
              key={m.href}
              variant="elevated"
              hoverable
              padding={false}
              onClick={() => router.push(m.href)}
              className="overflow-hidden p-6 transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900">{m.title}</div>
                  <div className="mt-1 text-sm text-gray-500">{m.description}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
