import { DollarSign, Package } from 'lucide-react'
import type BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export const ITEM_FORM_SECTIONS: Parameters<typeof BooksCrmAddEntityPage>[0]['sections'] = [
  {
    icon: Package,
    title: 'Item Information',
    description: 'Basic details for services, packages, and products you bill against.',
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'Item Name *',
        placeholder: 'Enter item name',
        required: true,
        colSpan: 'span2',
      },
      {
        key: 'type',
        type: 'select',
        label: 'Item Type *',
        required: true,
        options: [
          { value: 'Service', label: 'Service' },
          { value: 'RetainerPackage', label: 'Retainer Package' },
          { value: 'Digital', label: 'Digital Product' },
          { value: 'Product', label: 'Physical Product' },
        ],
      },
      { key: 'sku', type: 'input', label: 'SKU', placeholder: 'SVC-001' },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Draft', label: 'Draft' },
        ],
      },
    ],
  },
  {
    icon: DollarSign,
    title: 'Pricing & Description',
    description: 'Rate and optional notes for invoices and estimates.',
    fields: [
      {
        key: 'rate',
        type: 'input',
        label: 'Rate / Unit Price *',
        placeholder: '₹7,00,000.00',
        required: true,
      },
      {
        key: 'unit',
        type: 'select',
        label: 'Unit',
        options: [
          { value: 'hour', label: 'Per hour' },
          { value: 'fixed', label: 'Fixed price' },
          { value: 'month', label: 'Per month' },
          { value: 'unit', label: 'Per unit' },
        ],
      },
      {
        key: 'description',
        type: 'textarea',
        label: 'Description',
        placeholder: 'Brief description of this item…',
        rows: 4,
        colSpan: 'full',
      },
    ],
  },
]

export const ITEM_FORM_FIELD_KEYS = ITEM_FORM_SECTIONS.flatMap((s) => s.fields.map((f) => f.key))
