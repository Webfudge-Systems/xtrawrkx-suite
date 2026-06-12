export type InventoryAdjustmentRow = {
  id: number
  name: string
  reference: string
  status: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export const MOCK_INVENTORY_ADJUSTMENTS: InventoryAdjustmentRow[] = [
  {
    id: 1,
    name: 'Stock count — May 2026',
    reference: 'ADJ-2026-05-001',
    status: 'Posted',
    notes: 'Monthly warehouse count — 3 SKU variances corrected.',
    createdAt: '2026-05-27T10:00:00.000Z',
    updatedAt: '2026-05-27T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Damaged goods write-off',
    reference: 'ADJ-2026-05-002',
    status: 'Draft',
    notes: 'Water damage in storage bay B — pending approval.',
    createdAt: '2026-05-20T14:30:00.000Z',
    updatedAt: '2026-05-22T09:15:00.000Z',
  },
  {
    id: 3,
    name: 'Opening balance — Q2',
    reference: 'ADJ-2026-04-OPEN',
    status: 'Posted',
    notes: 'Opening inventory balance for Q2 fiscal period.',
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-01T08:00:00.000Z',
  },
]
