export type ItemRow = {
  id: number
  name: string
  sku: string
  type: string
  rate: string
  status: string
  createdAt: string
  updatedAt?: string
  unit?: string
  description?: string
}

export const MOCK_ITEMS: ItemRow[] = [
  {
    id: 1,
    name: 'Website Design Sprint',
    sku: 'SVC-WEB-001',
    type: 'Service',
    rate: '₹2,00,000.00',
    status: 'Active',
    unit: 'fixed',
    description: 'Two-week design sprint covering UX audit, wireframes, and high-fidelity UI for marketing sites.',
    createdAt: '2026-03-12T10:30:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 2,
    name: 'Retainer Package',
    sku: 'PKG-RET-001',
    type: 'RetainerPackage',
    rate: '₹5,00,000.00',
    status: 'Active',
    unit: 'month',
    description: 'Monthly retainer for ongoing design, development, and account management.',
    createdAt: '2026-02-04T14:15:00.000Z',
    updatedAt: '2026-04-10T12:00:00.000Z',
  },
  {
    id: 3,
    name: 'SEO Audit',
    sku: 'SVC-SEO-001',
    type: 'Service',
    rate: '₹35,000.00',
    status: 'Active',
    unit: 'fixed',
    description: 'Technical SEO review with prioritized recommendations and competitor snapshot.',
    createdAt: '2026-04-18T09:00:00.000Z',
    updatedAt: '2026-04-18T09:00:00.000Z',
  },
  {
    id: 4,
    name: 'Brand Strategy Workshop',
    sku: 'SVC-STRATEGY',
    type: 'Service',
    rate: '₹52,500.00',
    status: 'Active',
    unit: 'fixed',
    description: 'Facilitated workshop to align positioning, messaging, and visual direction.',
    createdAt: '2026-01-22T16:45:00.000Z',
    updatedAt: '2026-03-01T11:30:00.000Z',
  },
  {
    id: 5,
    name: 'UI Kit License',
    sku: 'DIG-UI-001',
    type: 'Digital',
    rate: '₹12,000.00',
    status: 'Draft',
    unit: 'unit',
    description: 'Commercial license for the agency UI kit — Figma and React tokens included.',
    createdAt: '2026-05-30T11:20:00.000Z',
    updatedAt: '2026-05-30T11:20:00.000Z',
  },
]

export { MOCK_PRICE_LISTS, type PriceListRow } from './price-lists'
export { MOCK_INVENTORY_ADJUSTMENTS, type InventoryAdjustmentRow } from './inventory-adjustments'

