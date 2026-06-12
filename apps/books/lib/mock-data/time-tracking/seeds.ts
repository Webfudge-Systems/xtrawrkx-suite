import type { BillingMethod, CurrencyCode, Project, TimeEntry } from '@/lib/types'

export type ProjectRow = Project & {
  customerName: string
  createdAt: string
  updatedAt?: string
}

export type TimeEntryRow = TimeEntry & {
  projectName: string
  createdAt: string
  updatedAt?: string
}

export const MOCK_PROJECT_ROWS: ProjectRow[] = [
  {
    id: 1,
    name: 'Acme Website Redesign',
    customerId: 1,
    customerName: 'Acme Corp',
    billingMethod: 'FixedCost',
    budget: 15000000,
    currency: 'INR',
    status: 'active',
    totalLoggedHours: 42.5,
    billableHours: 38,
    unbilledAmount: 3200000,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-05-27T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Brightline Retainer Q2',
    customerId: 3,
    customerName: 'Brightline Studio',
    billingMethod: 'DailyRatePerUser',
    budget: 8000000,
    currency: 'INR',
    status: 'active',
    totalLoggedHours: 64,
    billableHours: 60,
    unbilledAmount: 4500000,
    createdAt: '2026-02-10T11:00:00.000Z',
    updatedAt: '2026-05-26T08:00:00.000Z',
  },
  {
    id: 3,
    name: 'Northwind Brand Rollout',
    customerId: 2,
    customerName: 'Northwind Traders',
    billingMethod: 'BasedOnTasks',
    budget: 10500000,
    currency: 'INR',
    status: 'completed',
    totalLoggedHours: 88,
    billableHours: 88,
    unbilledAmount: 0,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-05-10T14:00:00.000Z',
  },
]

export const MOCK_TIME_ENTRY_ROWS: TimeEntryRow[] = [
  {
    id: 1,
    projectId: 1,
    projectName: 'Acme Website Redesign',
    task: 'Homepage wireframes',
    userId: 1,
    date: '2026-05-27',
    hours: 4,
    billable: true,
    invoiced: false,
    createdAt: '2026-05-27T09:00:00.000Z',
  },
  {
    id: 2,
    projectId: 1,
    projectName: 'Acme Website Redesign',
    task: 'Component library',
    userId: 1,
    date: '2026-05-26',
    hours: 6,
    billable: true,
    invoiced: false,
    createdAt: '2026-05-26T09:00:00.000Z',
  },
  {
    id: 3,
    projectId: 2,
    projectName: 'Brightline Retainer Q2',
    task: 'Sprint planning',
    userId: 2,
    date: '2026-05-27',
    hours: 2,
    billable: true,
    invoiced: true,
    createdAt: '2026-05-27T10:00:00.000Z',
  },
  {
    id: 4,
    projectId: 2,
    projectName: 'Brightline Retainer Q2',
    task: 'Client sync',
    userId: 2,
    date: '2026-05-25',
    hours: 1.5,
    billable: false,
    invoiced: false,
    createdAt: '2026-05-25T11:00:00.000Z',
  },
  {
    id: 5,
    projectId: 3,
    projectName: 'Northwind Brand Rollout',
    task: 'Final deliverables',
    userId: 1,
    date: '2026-05-10',
    hours: 8,
    billable: true,
    invoiced: true,
    createdAt: '2026-05-10T09:00:00.000Z',
  },
]

export function buildProjectFromForm(values: Record<string, string>): Omit<ProjectRow, 'id' | 'createdAt' | 'updatedAt'> {
  const budget = Number(values.budget) || 0
  return {
    name: values.name?.trim() || 'New Project',
    customerId: Number(values.customerId) || 1,
    customerName: values.customerName?.trim() || 'Customer',
    billingMethod: (values.billingMethod as BillingMethod) || 'FixedCost',
    budget,
    currency: (values.currency as CurrencyCode) || 'INR',
    status: values.status?.trim().toLowerCase() || 'active',
    totalLoggedHours: 0,
    billableHours: 0,
    unbilledAmount: 0,
  }
}
