/** Keys match `ConfigureFeaturesModal` / `books-features` localStorage JSON. */

const SALES_TITLE_TO_KEY: Record<string, string> = {
  Estimates: 'estimates',
  'Retainer Invoices': 'retainerInvoices',
  'Sales Orders': 'salesOrders',
  'Delivery Challans': 'deliveryChallans',
}

const PURCHASES_TITLE_TO_KEY: Record<string, string> = {
  'Purchase Orders': 'purchaseOrders',
}

export function isSalesHubModuleEnabled(title: string, features: Record<string, unknown>): boolean {
  const key = SALES_TITLE_TO_KEY[title]
  if (!key) return true
  return features[key] !== false
}

export function isPurchasesHubModuleEnabled(title: string, features: Record<string, unknown>): boolean {
  const key = PURCHASES_TITLE_TO_KEY[title]
  if (!key) return true
  return features[key] !== false
}

export function readBooksFeaturesFromStorage(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('books-features')
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
