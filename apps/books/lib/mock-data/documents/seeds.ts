export type DocumentRow = {
  id: number
  name: string
  status: string
  updatedAt: string
  createdAt: string
}

export const MOCK_DOCUMENT_ROWS: DocumentRow[] = [
  { id: 1, name: 'INV-2026-0142.pdf', status: 'Processed', updatedAt: 'May 27, 2026', createdAt: '2026-05-27T09:00:00.000Z' },
  { id: 2, name: 'BILL-0091.pdf', status: 'Processed', updatedAt: 'May 27, 2026', createdAt: '2026-05-27T09:00:00.000Z' },
  { id: 3, name: 'contract-acme-signed.pdf', status: 'Active', updatedAt: 'May 20, 2026', createdAt: '2026-05-20T09:00:00.000Z' },
  { id: 4, name: 'scan-may-expenses.jpg', status: 'Draft', updatedAt: 'May 18, 2026', createdAt: '2026-05-18T09:00:00.000Z' },
]

export const MOCK_BANK_STATEMENT_ROWS: DocumentRow[] = [
  { id: 1, name: 'HDFC_May_2026.csv', status: 'Processed', updatedAt: 'May 27, 2026', createdAt: '2026-05-27T09:00:00.000Z' },
  { id: 2, name: 'ICICI_Apr_2026.pdf', status: 'Processed', updatedAt: 'May 02, 2026', createdAt: '2026-05-02T09:00:00.000Z' },
  { id: 3, name: 'HDFC_Apr_2026.csv', status: 'Draft', updatedAt: 'Apr 30, 2026', createdAt: '2026-04-30T09:00:00.000Z' },
]
