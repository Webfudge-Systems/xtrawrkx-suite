import { Landmark } from 'lucide-react'
import type BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export const BANK_ACCOUNT_FORM_SECTIONS: Parameters<typeof BooksCrmAddEntityPage>[0]['sections'] = [
  {
    icon: Landmark,
    title: 'Account Details',
    description: 'Bank feed or manual cash account for reconciliation.',
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'Account Name *',
        placeholder: 'HDFC Operating',
        required: true,
        colSpan: 'span2',
      },
      {
        key: 'institution',
        type: 'input',
        label: 'Bank / Source *',
        placeholder: 'HDFC Bank',
        required: true,
      },
      {
        key: 'accountType',
        type: 'select',
        label: 'Account Type',
        options: [
          { value: 'Bank', label: 'Bank' },
          { value: 'Cash', label: 'Cash' },
        ],
      },
      {
        key: 'balance',
        type: 'input',
        label: 'Opening Balance *',
        placeholder: '₹12,50,000',
        required: true,
      },
      {
        key: 'status',
        type: 'select',
        label: 'Feed Status',
        options: [
          { value: 'connected', label: 'Connected' },
          { value: 'manual', label: 'Manual' },
        ],
      },
    ],
  },
]
