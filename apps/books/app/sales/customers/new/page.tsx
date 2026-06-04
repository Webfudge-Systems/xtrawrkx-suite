'use client'

import { Building2, Mail, Phone, Globe, Users } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export default function NewCustomerPage() {
  return (
    <BooksCrmAddEntityPage
      submitLabel="Create Customer"
      redirectOnCancelHref="/sales/customers"
      sections={[
        {
          icon: Building2,
          title: 'Customer Information',
          description: 'Basic information about the customer',
          fields: [
            { key: 'companyName', type: 'input', label: 'Company Name *', placeholder: 'Enter company name', required: true, colSpan: 'span2' },
            {
              key: 'clientType',
              type: 'select',
              label: 'Client Type',
              required: true,
              options: [
                { value: 'AgencyClient', label: 'Agency Client' },
                { value: 'DirectClient', label: 'Direct Client' },
                { value: 'Partner', label: 'Partner' },
              ],
            },
            { key: 'industry', type: 'input', label: 'Industry', placeholder: 'Industry' },
            { key: 'website', type: 'input', label: 'Website', placeholder: 'https://company.com', inputType: 'url' },
            { key: 'phone', type: 'input', label: 'Phone', placeholder: '+1 (555) 123-4567', inputType: 'tel' },
            { key: 'email', type: 'input', label: 'Email *', placeholder: 'contact@company.com', inputType: 'email', required: true },
          ],
        },
        {
          icon: Users,
          title: 'Additional Details',
          description: 'Optional fields for better customer onboarding',
          fields: [
            { key: 'billingNotes', type: 'textarea', label: 'Billing Notes', placeholder: 'Notes for billing...' },
            { key: 'portalLink', type: 'input', label: 'Portal Link', placeholder: 'https://portal.company.com', inputType: 'url' },
            { key: 'description', type: 'textarea', label: 'Description', placeholder: 'Short description...', rows: 4 },
          ],
        },
      ]}
    />
  )
}
