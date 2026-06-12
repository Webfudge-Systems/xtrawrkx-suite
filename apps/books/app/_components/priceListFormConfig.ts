import { ListOrdered } from 'lucide-react'
import type BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export const PRICE_LIST_FORM_SECTIONS: Parameters<typeof BooksCrmAddEntityPage>[0]['sections'] = [
  {
    icon: ListOrdered,
    title: 'Price List Details',
    description: 'Custom pricing rules by customer or group.',
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'Price List Name *',
        placeholder: 'Agency Partners — 10% off',
        required: true,
        colSpan: 'span2',
      },
      {
        key: 'code',
        type: 'input',
        label: 'Code',
        placeholder: 'PL-AGENCY-10',
      },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Draft', label: 'Draft' },
        ],
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Notes',
        placeholder: 'Optional pricing notes…',
        rows: 4,
        colSpan: 'full',
      },
    ],
  },
]

export const PRICE_LIST_FORM_FIELD_KEYS = PRICE_LIST_FORM_SECTIONS.flatMap((s) => s.fields.map((f) => f.key))
