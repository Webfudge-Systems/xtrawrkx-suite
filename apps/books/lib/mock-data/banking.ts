import type { BankAccount, BankAccountType } from '@/lib/types'

export type BankAccountRow = {
  id: number
  name: string
  institution: string
  accountType: string
  balance: number
  status: string
  lastSyncAt: string | null
  createdAt: string
  updatedAt?: string
}

export const MOCK_UNCATEGORIZED_COUNT = 18

export const MOCK_BANK_ACCOUNTS: BankAccountRow[] = [
  {
    id: 1,
    name: 'HDFC Operating',
    institution: 'HDFC Bank',
    accountType: 'Bank',
    balance: 12450000,
    status: 'connected',
    lastSyncAt: '2026-05-27T09:15:00.000Z',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-05-27T09:15:00.000Z',
  },
  {
    id: 2,
    name: 'ICICI Payroll',
    institution: 'ICICI Bank',
    accountType: 'Bank',
    balance: 4725000,
    status: 'connected',
    lastSyncAt: '2026-05-26T18:30:00.000Z',
    createdAt: '2026-02-04T11:00:00.000Z',
    updatedAt: '2026-05-26T18:30:00.000Z',
  },
  {
    id: 3,
    name: 'Petty Cash',
    institution: 'Manual',
    accountType: 'Cash',
    balance: 1250000,
    status: 'manual',
    lastSyncAt: null,
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
]

/** @deprecated Use MOCK_BANK_ACCOUNTS and store helpers instead. */
export type BankingOverviewMock = {
  totalBalance: number
  bankAccountsCount: number
  uncategorizedCount: number
  cashAndManual: number
  accounts: Array<{
    id: number
    accountName: string
    accountType?: string
    bankName?: string
    balance: number
    status?: string
    lastSyncAt?: string | null
  }>
}

export function computeBankingMetrics(accounts: BankAccountRow[]) {
  const totalBalance = accounts.reduce((sum, row) => sum + (row.balance || 0), 0)
  const bankAccountsCount = accounts.filter((row) => row.accountType === 'Bank').length
  const cashAndManual = accounts
    .filter((row) => row.status === 'manual' || row.accountType === 'Cash')
    .reduce((sum, row) => sum + (row.balance || 0), 0)
  return { totalBalance, bankAccountsCount, cashAndManual }
}

export const MOCK_BANKING_OVERVIEW: BankingOverviewMock = {
  uncategorizedCount: MOCK_UNCATEGORIZED_COUNT,
  ...computeBankingMetrics(MOCK_BANK_ACCOUNTS),
  accounts: MOCK_BANK_ACCOUNTS.map((a) => ({
    id: a.id,
    accountName: a.name,
    accountType: a.accountType,
    bankName: a.institution,
    balance: a.balance,
    status: a.status,
    lastSyncAt: a.lastSyncAt,
  })),
}

export function mapBankAccountRowToLegacy(row: BankAccountRow): BankAccount {
  return {
    id: row.id,
    name: row.name,
    accountNumber: `****${String(row.id).padStart(4, '0')}`,
    type: (row.accountType === 'Cash' ? 'Cash' : 'Bank') as BankAccountType,
    balance: row.balance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Legacy `BankAccount` shape for reports widgets. */
export const MOCK_BANK_ACCOUNTS_LEGACY: BankAccount[] = MOCK_BANK_ACCOUNTS.map(mapBankAccountRowToLegacy)
