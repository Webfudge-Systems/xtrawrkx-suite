/**
 * CRM app base URL for cross-app links from PM (contacts, deals, leads).
 * Set NEXT_PUBLIC_CRM_APP_URL in apps/pm/.env.local (e.g. http://localhost:3007).
 */
export function getCrmAppBaseUrl() {
  return (process.env.NEXT_PUBLIC_CRM_APP_URL || 'http://localhost:3007').replace(/\/$/, '')
}

export function crmContactUrl(contactId) {
  if (contactId == null || contactId === '') return `${getCrmAppBaseUrl()}/sales/contacts`
  return `${getCrmAppBaseUrl()}/sales/contacts/${encodeURIComponent(String(contactId))}`
}

export function crmContactEditUrl(contactId) {
  return `${crmContactUrl(contactId)}/edit`
}

export function crmDealUrl(dealId) {
  if (dealId == null || dealId === '') return `${getCrmAppBaseUrl()}/sales/deals`
  return `${getCrmAppBaseUrl()}/sales/deals/${encodeURIComponent(String(dealId))}`
}

export function crmDealEditUrl(dealId) {
  return `${crmDealUrl(dealId)}/edit`
}

export function crmNewDealUrl(clientAccountId) {
  const base = `${getCrmAppBaseUrl()}/sales/deals/new`
  if (clientAccountId == null || clientAccountId === '') return base
  return `${base}?clientAccount=${encodeURIComponent(String(clientAccountId))}`
}

export function crmNewContactUrl(clientAccountId) {
  const base = `${getCrmAppBaseUrl()}/sales/contacts/new`
  if (clientAccountId == null || clientAccountId === '') return base
  return `${base}?clientAccount=${encodeURIComponent(String(clientAccountId))}`
}

export function crmLeadCompanyUrl(leadId) {
  if (leadId == null || leadId === '') return `${getCrmAppBaseUrl()}/sales/lead-companies`
  return `${getCrmAppBaseUrl()}/sales/lead-companies/${encodeURIComponent(String(leadId))}`
}

export function crmInvoiceUrl(invoiceId) {
  if (invoiceId == null || invoiceId === '') return `${getCrmAppBaseUrl()}/clients/invoices`
  return `${getCrmAppBaseUrl()}/clients/invoices/${encodeURIComponent(String(invoiceId))}`
}

export function crmInvoiceEditUrl(invoiceId) {
  return `${crmInvoiceUrl(invoiceId)}/edit`
}

export function crmNewInvoiceUrl(clientAccountId) {
  const base = `${getCrmAppBaseUrl()}/clients/invoices/new`
  if (clientAccountId == null || clientAccountId === '') return base
  return `${base}?clientAccount=${encodeURIComponent(String(clientAccountId))}`
}
