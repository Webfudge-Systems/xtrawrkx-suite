import { Boxes } from 'lucide-react'
import type BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export const INVENTORY_ADJUSTMENT_FORM_SECTIONS: Parameters<typeof BooksCrmAddEntityPage>[0]['sections'] = [
  {
    icon: Boxes,
    title: 'Inventory Adjustment',
    description: 'Record stock corrections and audit trails.',
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'Reference Name *',
        placeholder: 'Stock count — May 2026',
        required: true,
        colSpan: 'span2',
      },
      {
        key: 'reference',
        type: 'input',
        label: 'Reference Code',
        placeholder: 'ADJ-2026-05-001',
      },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'Draft', label: 'Draft' },
          { value: 'Posted', label: 'Posted' },
        ],
      },
      {
        key: 'notes',
        type: 'textarea',
        label: 'Reason / Notes',
        placeholder: 'Describe the adjustment…',
        rows: 4,
        colSpan: 'full',
      },
    ],
  },
]

export const INVENTORY_ADJUSTMENT_FORM_FIELD_KEYS = INVENTORY_ADJUSTMENT_FORM_SECTIONS.flatMap((s) =>
  s.fields.map((f) => f.key)
)
