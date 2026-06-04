'use client'

import { Building2, Mail, Phone, Receipt, Users } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export default function NewVendorPage() {
  return (
    <BooksCrmAddEntityPage
      submitLabel="Create Vendor"
      redirectOnCancelHref="/purchases/vendors"
      sections={[
        {
          icon: Building2,
          title: 'Vendor Information',
          description: 'Basic vendor information',
          fields: [
            { key: 'vendorName', type: 'input', label: 'Vendor Name *', placeholder: 'Enter vendor name', required: true, colSpan: 'span2' },
            { key: 'industry', type: 'input', label: 'Category', placeholder: 'e.g. Marketing, Travel' },
            { key: 'type', type: 'select', label: 'Vendor Type', options: [{ value: 'Service', label: 'Service' }, { value: 'Goods', label: 'Goods' }, { value: 'Partner', label: 'Partner' }] },
            { key: 'website', type: 'input', label: 'Website', placeholder: 'https://vendor.com', inputType: 'url' },
            { key: 'phone', type: 'input', label: 'Phone', placeholder: '+1 (555) 123-4567', inputType: 'tel' },
            { key: 'email', type: 'input', label: 'Email *', placeholder: 'vendor@company.com', inputType: 'email', required: true },
          ],
        },
        {
          icon: Users,
          title: 'Additional Details',
          description: 'Optional onboarding notes',
          fields: [
            { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Any additional vendor details...', rows: 4 },
            { key: 'currency', type: 'input', label: 'Currency', placeholder: 'INR' },
          ],
        },
      ]}
    />
  )
}
