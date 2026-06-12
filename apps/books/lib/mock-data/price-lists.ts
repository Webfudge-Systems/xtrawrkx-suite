export type PriceListRow = {
  id: number
  name: string
  code: string
  status: string
  description?: string
  createdAt: string
  updatedAt?: string
}

export const MOCK_PRICE_LISTS: PriceListRow[] = [
  {
    id: 1,
    name: 'Agency Partners — 10% off',
    code: 'PL-AGENCY-10',
    status: 'Active',
    description: '10% discount for agency partner accounts on all services.',
    createdAt: '2026-04-12T09:00:00.000Z',
    updatedAt: '2026-05-24T14:30:00.000Z',
  },
  {
    id: 2,
    name: 'Northwind Traders — Custom',
    code: 'PL-NWT-CUST',
    status: 'Active',
    description: 'Custom rate card for Northwind Traders retainer line items.',
    createdAt: '2026-03-08T11:15:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'Standard Retail',
    code: 'PL-RETAIL-STD',
    status: 'Draft',
    description: 'Default retail pricing — pending finance approval.',
    createdAt: '2026-05-10T16:20:00.000Z',
    updatedAt: '2026-05-10T16:20:00.000Z',
  },
  {
    id: 4,
    name: 'Enterprise Volume — 15%',
    code: 'PL-ENT-15',
    status: 'Active',
    description: 'Volume discount for enterprise accounts billing over ₹10L/month.',
    createdAt: '2026-02-20T08:45:00.000Z',
    updatedAt: '2026-04-01T12:00:00.000Z',
  },
]
