'use client'

import { BarChart3, BookOpen, Calendar, ClipboardList, FileText, Lock, Repeat, Receipt, Shield, Users, Wallet } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export default function AccountantAddModulePage({ params }: { params: { module: string } }) {
  const moduleKey = params.module

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Published', label: 'Published' },
    { value: 'Queued', label: 'Queued' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Active', label: 'Active' },
    { value: 'Archived', label: 'Archived' },
  ]

  const configs: Record<
    string,
    {
      submitLabel: string
      sections: Parameters<typeof BooksCrmAddEntityPage>[0]['sections']
    }
  > = {
    'manual-journals': {
      submitLabel: 'Create Manual Journal',
      sections: [
        {
          icon: BookOpen,
          title: 'Manual Journal',
          description: 'Create a manual journal entry',
          fields: [
            { key: 'journalNumber', type: 'input', label: 'Journal Number *', required: true, placeholder: 'MJ-1001' },
            { key: 'date', type: 'input', label: 'Date', inputType: 'date' },
            { key: 'reference', type: 'input', label: 'Reference', placeholder: 'Ref-123' },
            {
              key: 'status',
              type: 'select',
              label: 'Status',
              options: [
                { value: 'Draft', label: 'Draft' },
                { value: 'Published', label: 'Published' },
              ],
            },
          ],
        },
        {
          icon: FileText,
          title: 'Notes',
          fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
        },
      ],
    },
    'bulk-update': {
      submitLabel: 'Create Bulk Update Job',
      sections: [
        {
          icon: ClipboardList,
          title: 'Bulk Update Job',
          fields: [
            { key: 'jobId', type: 'input', label: 'Job ID *', required: true, placeholder: 'JOB-1001' },
            {
              key: 'module',
              type: 'select',
              label: 'Module',
              options: [
                { value: 'sales', label: 'Sales' },
                { value: 'purchases', label: 'Purchases' },
                { value: 'accountant', label: 'Accountant' },
              ],
            },
            {
              key: 'status',
              type: 'select',
              label: 'Status',
              options: [
                { value: 'Queued', label: 'Queued' },
                { value: 'Completed', label: 'Completed' },
              ],
            },
            { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 },
          ],
        },
      ],
    },
    'currency-adjustments': {
      submitLabel: 'Create Currency Adjustment',
      sections: [
        {
          icon: Wallet,
          title: 'Currency Adjustment',
          fields: [
            { key: 'reference', type: 'input', label: 'Reference *', required: true, placeholder: 'FX-1001' },
            { key: 'date', type: 'input', label: 'Date', inputType: 'date' },
            {
              key: 'currency',
              type: 'select',
              label: 'Currency',
              options: [
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'INR', label: 'INR' },
                { value: 'GBP', label: 'GBP' },
              ],
            },
            {
              key: 'status',
              type: 'select',
              label: 'Status',
              options: [
                { value: 'Draft', label: 'Draft' },
                { value: 'Published', label: 'Published' },
              ],
            },
            { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
          ],
        },
        { icon: FileText, title: 'Notes', fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }] },
      ],
    },
    'chart-of-accounts': {
      submitLabel: 'Create Account',
      sections: [
        {
          icon: BarChart3,
          title: 'Account',
          description: 'Add a new account to the chart of accounts',
          fields: [
            { key: 'name', type: 'input', label: 'Account Name *', required: true, placeholder: 'Cash on Hand' },
            { key: 'code', type: 'input', label: 'Code', placeholder: '1000' },
            {
              key: 'type',
              type: 'select',
              label: 'Type',
              options: [
                { value: 'Asset', label: 'Asset' },
                { value: 'Liability', label: 'Liability' },
                { value: 'Income', label: 'Income' },
                { value: 'Expense', label: 'Expense' },
              ],
            },
            { key: 'balance', type: 'input', label: 'Initial Balance', placeholder: '0', inputType: 'number' },
          ],
        },
      ],
    },
    'transaction-locking': {
      submitLabel: 'Create Transaction Lock Rule',
      sections: [
        {
          icon: Lock,
          title: 'Lock Rule',
          description: 'Define locked periods and overrides',
          fields: [
            { key: 'ruleName', type: 'input', label: 'Rule Name *', required: true, placeholder: 'Lock FY2026' },
            {
              key: 'period',
              type: 'select',
              label: 'Period',
              options: [
                { value: 'this_fiscal_year', label: 'This Fiscal Year' },
                { value: 'previous_fiscal_year', label: 'Previous Fiscal Year' },
                { value: 'last_12_months', label: 'Last 12 Months' },
              ],
            },
            {
              key: 'status',
              type: 'select',
              label: 'Status',
              options: [
                { value: 'Active', label: 'Active' },
                { value: 'Archived', label: 'Archived' },
              ],
            },
          ],
        },
        {
          icon: Shield,
          title: 'Notes',
          fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
        },
      ],
    },
  }

  const config =
    configs[moduleKey] ??
    ({
      submitLabel: `Create ${moduleKey}`,
      sections: [
        { icon: Receipt, title: 'Details', description: 'Create a new record', fields: [{ key: 'name', type: 'input', label: 'Name *', required: true, placeholder: 'Enter name' }] },
      ],
    } as const)

  return (
    <BooksCrmAddEntityPage
      sections={config.sections as any}
      submitLabel={config.submitLabel}
      redirectOnCancelHref={`/accountant/${moduleKey}`}
    />
  )
}

