import type { BankCardDisplay } from '@webfudge/ui/book-components'
import type { BankAccountRow } from '@/lib/mock-data/banking'

const WALLET_GRADIENTS = [
  'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400',
  'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
  'bg-gradient-to-br from-indigo-400 via-blue-400 to-sky-300',
  'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400',
  'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-400',
] as const

function formatMaskedAccountNumber(id: number): string {
  const last4 = String(id).padStart(4, '0').slice(-4)
  return `•••• •••• ${last4}`
}

function formatCardExpiry(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—/—'
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${month}/${year}`
}

export function mapBankAccountsToWalletCards(accounts: BankAccountRow[]): BankCardDisplay[] {
  return accounts.map((account, index) => ({
    id: String(account.id),
    bankName: account.institution?.trim() || account.name,
    maskedNumber: formatMaskedAccountNumber(account.id),
    expiry: formatCardExpiry(account.updatedAt ?? account.createdAt),
    gradientClassName: WALLET_GRADIENTS[index % WALLET_GRADIENTS.length],
  }))
}
