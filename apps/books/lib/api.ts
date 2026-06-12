/**
 * Books API client — wired to real Strapi backend endpoints.
 * All monetary values in paise/cents (integer). Display layer converts.
 */

import { listCacheBust, paginateStrapiList } from '@webfudge/utils'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:1338'

type ListParams = Record<string, string | number | boolean | undefined>

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token =
    localStorage.getItem('strapi_token') ||
    localStorage.getItem('auth-token') ||
    sessionStorage.getItem('auth-token') ||
    ''
  const orgId = localStorage.getItem('current-org-id') || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { 'X-Organization-Id': orgId } : {}),
  }
}

function qs(params?: ListParams): string {
  if (!params) return ''
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${path} failed (${res.status}): ${text}`)
  }
  return res.json()
}

const get = <T>(path: string, params?: ListParams) =>
  request<T>(`${path}${qs(params)}`)

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

const put = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })

const del = <T>(path: string) =>
  request<T>(path, { method: 'DELETE' })

// ΓöÇΓöÇΓöÇ DASHBOARD ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const dashboardApi = {
  kpis: () => get('/books/dashboard/kpis'),
  profitLoss: (params?: ListParams) => get('/books/dashboard/profit-loss', params),
  cashFlow: (params?: ListParams) => get('/books/dashboard/cash-flow', params),
  recentActivities: (params?: ListParams) => get('/books/dashboard/recent-activities', params),
  topExpenses: (params?: ListParams) => get('/books/dashboard/top-expenses', params),
}

// ΓöÇΓöÇΓöÇ BOOKS ACTIVATION ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const booksActivate = () => post('/books/activate', {})

// ΓöÇΓöÇΓöÇ ITEMS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const itemsApi = {
  list:   (params?: ListParams) => get('/items', params),
  get:    (id: number | string) => get(`/items/${id}`),
  create: (data: Record<string, unknown>) => post('/items', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/items/${id}`, { data }),
  delete: (id: number | string) => del(`/items/${id}`),
  softDelete: (id: number | string) => put(`/items/${id}`, { data: { isActive: false } }),
}

// ΓöÇΓöÇΓöÇ BANKING ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const bankingApi = {
  overview: () => get('/books/banking/overview'),

  accounts: {
    list:         (params?: ListParams) => get('/bank-accounts', params),
    get:          (id: number | string) => get(`/bank-accounts/${id}`),
    create:       (data: Record<string, unknown>) => post('/bank-accounts', { data }),
    update:       (id: number | string, data: Record<string, unknown>) => put(`/bank-accounts/${id}`, { data }),
    delete:       (id: number | string) => del(`/bank-accounts/${id}`),
    transactions: (id: number | string, params?: ListParams) => get(`/bank-accounts/${id}/transactions`, params),
  },

  transactions: {
    list:           (params?: ListParams) => get('/bank-transactions', params),
    uncategorized:  (params?: ListParams) => get('/bank-transactions/uncategorized', params),
    categorize:     (id: number | string, data: Record<string, unknown>) => put(`/bank-transactions/${id}/categorize`, { data }),
    bulkCategorize: (data: { ids: number[]; category: string }) => post('/bank-transactions/bulk-categorize', { data }),
    create:         (data: Record<string, unknown>) => post('/bank-transactions', { data }),
    update:         (id: number | string, data: Record<string, unknown>) => put(`/bank-transactions/${id}`, { data }),
  },
}

// ΓöÇΓöÇΓöÇ SALES ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const customersApi = {
  list:      (params?: ListParams) => get('/contacts', { isCustomer: true, ...params }),
  get:       (id: number | string) => get(`/contacts/${id}`),
  create:    (data: Record<string, unknown>) => post('/contacts', { data: { ...data, isCustomer: true } }),
  update:    (id: number | string, data: Record<string, unknown>) => put(`/contacts/${id}`, { data }),
  statement: (id: number | string) => get(`/contacts/${id}`),
}

export const invoicesApi = {
  list:       (params?: ListParams) => get('/invoices', params),
  get:        (id: number | string) => get(`/invoices/${id}`),
  create:     (data: Record<string, unknown>) => post('/invoices', { data }),
  update:     (id: number | string, data: Record<string, unknown>) => put(`/invoices/${id}`, { data }),
  delete:     (id: number | string) => del(`/invoices/${id}`),
  updateStatus: (id: number | string, data: { status: string; voidReason?: string }) => put(`/invoices/${id}/status`, { data }),
  fromTime:   (data: { projectId?: number; customerId?: number; timeEntryIds: number[] }) => post('/invoices/from-time', { data }),
}

export const estimatesApi = {
  list:             (params?: ListParams) => get('/estimates', params),
  get:              (id: number | string) => get(`/estimates/${id}`),
  create:           (data: Record<string, unknown>) => post('/estimates', { data }),
  update:           (id: number | string, data: Record<string, unknown>) => put(`/estimates/${id}`, { data }),
  delete:           (id: number | string) => del(`/estimates/${id}`),
  updateStatus:     (id: number | string, status: string) => put(`/estimates/${id}/status`, { data: { status } }),
  convertToInvoice: (id: number | string) => post(`/estimates/${id}/convert-to-invoice`, {}),
}

export const creditNotesApi = {
  list:   (params?: ListParams) => get('/credit-notes', params),
  get:    (id: number | string) => get(`/credit-notes/${id}`),
  create: (data: Record<string, unknown>) => post('/credit-notes', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/credit-notes/${id}`, { data }),
  delete: (id: number | string) => del(`/credit-notes/${id}`),
}

export const paymentsReceivedApi = {
  list:   (params?: ListParams) => get('/payments-received', params),
  get:    (id: number | string) => get(`/payments-received/${id}`),
  create: (data: Record<string, unknown>) => post('/payments-received', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/payments-received/${id}`, { data }),
  delete: (id: number | string) => del(`/payments-received/${id}`),
}

export const retainerInvoicesApi = {
  list:   (params?: ListParams) => get('/retainer-invoices', params),
  get:    (id: number | string) => get(`/retainer-invoices/${id}`),
  create: (data: Record<string, unknown>) => post('/retainer-invoices', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/retainer-invoices/${id}`, { data }),
  delete: (id: number | string) => del(`/retainer-invoices/${id}`),
}

export const salesOrdersApi = {
  list:   (params?: ListParams) => get('/sales-orders', params),
  get:    (id: number | string) => get(`/sales-orders/${id}`),
  create: (data: Record<string, unknown>) => post('/sales-orders', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/sales-orders/${id}`, { data }),
  delete: (id: number | string) => del(`/sales-orders/${id}`),
}

export const deliveryChallansApi = {
  list:   (params?: ListParams) => get('/delivery-challans', params),
  get:    (id: number | string) => get(`/delivery-challans/${id}`),
  create: (data: Record<string, unknown>) => post('/delivery-challans', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/delivery-challans/${id}`, { data }),
  delete: (id: number | string) => del(`/delivery-challans/${id}`),
}

export const recurringInvoicesApi = {
  list:   (params?: ListParams) => get('/recurring-invoices', params),
  get:    (id: number | string) => get(`/recurring-invoices/${id}`),
  create: (data: Record<string, unknown>) => post('/recurring-invoices', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/recurring-invoices/${id}`, { data }),
  delete: (id: number | string) => del(`/recurring-invoices/${id}`),
}

// ΓöÇΓöÇΓöÇ PURCHASES ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const vendorsApi = {
  list:   (params?: ListParams) => get('/vendors', params),
  get:    (id: number | string) => get(`/vendors/${id}`),
  create: (data: Record<string, unknown>) => post('/vendors', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/vendors/${id}`, { data }),
  delete: (id: number | string) => del(`/vendors/${id}`),
}

export const billsApi = {
  list:         (params?: ListParams) => get('/bills', params),
  get:          (id: number | string) => get(`/bills/${id}`),
  create:       (data: Record<string, unknown>) => post('/bills', { data }),
  update:       (id: number | string, data: Record<string, unknown>) => put(`/bills/${id}`, { data }),
  delete:       (id: number | string) => del(`/bills/${id}`),
  updateStatus: (id: number | string, status: string) => put(`/bills/${id}/status`, { data: { status } }),
}

export const expensesApi = {
  list:         (params?: ListParams) => get('/expenses', params),
  get:          (id: number | string) => get(`/expenses/${id}`),
  create:       (data: Record<string, unknown>) => post('/expenses', { data }),
  update:       (id: number | string, data: Record<string, unknown>) => put(`/expenses/${id}`, { data }),
  delete:       (id: number | string) => del(`/expenses/${id}`),
  addToInvoice: (id: number | string, invoiceId: number | string) => post(`/expenses/${id}/invoice`, { data: { invoiceId } }),
}

export const paymentsMadeApi = {
  list:   (params?: ListParams) => get('/payments-made', params),
  get:    (id: number | string) => get(`/payments-made/${id}`),
  create: (data: Record<string, unknown>) => post('/payments-made', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/payments-made/${id}`, { data }),
  delete: (id: number | string) => del(`/payments-made/${id}`),
}

export const vendorCreditsApi = {
  list:   (params?: ListParams) => get('/vendor-credits', params),
  get:    (id: number | string) => get(`/vendor-credits/${id}`),
  create: (data: Record<string, unknown>) => post('/vendor-credits', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/vendor-credits/${id}`, { data }),
  delete: (id: number | string) => del(`/vendor-credits/${id}`),
}

export const purchaseOrdersApi = {
  list:   (params?: ListParams) => get('/purchase-orders', params),
  get:    (id: number | string) => get(`/purchase-orders/${id}`),
  create: (data: Record<string, unknown>) => post('/purchase-orders', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/purchase-orders/${id}`, { data }),
  delete: (id: number | string) => del(`/purchase-orders/${id}`),
}

export const recurringExpensesApi = {
  list:   (params?: ListParams) => get('/recurring-expenses', params),
  get:    (id: number | string) => get(`/recurring-expenses/${id}`),
  create: (data: Record<string, unknown>) => post('/recurring-expenses', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/recurring-expenses/${id}`, { data }),
  delete: (id: number | string) => del(`/recurring-expenses/${id}`),
}

// ΓöÇΓöÇΓöÇ TIME TRACKING ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const projectsApi = {
  list:    (params?: ListParams) => get('/projects', params),
  get:     (id: number | string) => get(`/projects/${id}`),
  summary: (id: number | string) => get(`/projects/${id}/summary`),
  create:  (data: Record<string, unknown>) => post('/projects', { data }),
  update:  (id: number | string, data: Record<string, unknown>) => put(`/projects/${id}`, { data }),
  delete:  (id: number | string) => del(`/projects/${id}`),
}

export const tasksApi = {
  list:       (params?: ListParams) => get('/tasks', params),
  listAll:    (params?: ListParams) => fetchAllTasks(params),
  get:        (id: number | string) => get(`/tasks/${id}`),
  create:     (data: Record<string, unknown>) => post('/tasks', { data }),
  update:     (id: number | string, data: Record<string, unknown>) => put(`/tasks/${id}`, { data }),
  delete:     (id: number | string) => del(`/tasks/${id}`),
  timerStart: (id: number | string) => post(`/tasks/${id}/timer/start`, {}),
  timerStop:  (id: number | string) => post(`/tasks/${id}/timer/stop`, {}),
}

async function fetchAllTasks(params?: ListParams) {
  const cacheBust = listCacheBust({})
  const pageSize = 500
  const data = await paginateStrapiList(
    (page, ps, bust) =>
      get<{ data?: unknown[]; meta?: { pagination?: Record<string, number> } }>('/tasks', {
        ...params,
        'pagination[page]': page,
        'pagination[pageSize]': ps,
        _: bust,
      }),
    { pageSize, cacheBust }
  )
  return {
    data,
    meta: {
      pagination: { page: 1, pageSize: data.length, pageCount: 1, total: data.length },
    },
  }
}

export const timesheetApi = {
  weekly: (params?: { weekStart?: string; userId?: number }) => get('/books/timesheet/weekly', params),
}

// ΓöÇΓöÇΓöÇ ACCOUNTANT ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const journalsApi = {
  list:    (params?: ListParams) => get('/manual-journals', params),
  get:     (id: number | string) => get(`/manual-journals/${id}`),
  create:  (data: Record<string, unknown>) => post('/manual-journals', { data }),
  update:  (id: number | string, data: Record<string, unknown>) => put(`/manual-journals/${id}`, { data }),
  delete:  (id: number | string) => del(`/manual-journals/${id}`),
  publish: (id: number | string) => put(`/manual-journals/${id}/publish`, {}),
  reverse: (id: number | string) => post(`/manual-journals/${id}/reverse`, {}),
  postingTrend: (params?: ListParams) => get('/books/accountant/posting-trend', params),
}

export const chartOfAccountsApi = {
  list:         (params?: ListParams) => get('/chart-of-accounts', params),
  get:          (id: number | string) => get(`/chart-of-accounts/${id}`),
  create:       (data: Record<string, unknown>) => post('/chart-of-accounts', { data }),
  update:       (id: number | string, data: Record<string, unknown>) => put(`/chart-of-accounts/${id}`, { data }),
  delete:       (id: number | string) => del(`/chart-of-accounts/${id}`),
  trialBalance: () => get('/chart-of-accounts/trial-balance'),
}

// ΓöÇΓöÇΓöÇ REPORTS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const reportsApi = {
  profitLoss:          (params?: ListParams) => get('/books/reports/profit-loss', params),
  balanceSheet:        (params?: ListParams) => get('/books/reports/balance-sheet', params),
  cashFlow:            (params?: ListParams) => get('/books/reports/cash-flow', params),
  salesByCustomer:     (params?: ListParams) => get('/books/reports/sales-by-customer', params),
  expensesByCategory:  (params?: ListParams) => get('/books/reports/expenses-by-category', params),
  receivablesAging:    () => get('/books/reports/receivables-aging'),
  payablesAging:       () => get('/books/reports/payables-aging'),
  utilization:         (params?: ListParams) => get('/books/reports/utilization', params),
}

// ΓöÇΓöÇΓöÇ DOCUMENTS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export const documentsApi = {
  list:   (params?: ListParams) => get('/documents', params),
  get:    (id: number | string) => get(`/documents/${id}`),
  create: (data: Record<string, unknown>) => post('/documents', { data }),
  update: (id: number | string, data: Record<string, unknown>) => put(`/documents/${id}`, { data }),
  delete: (id: number | string) => del(`/documents/${id}`),
}

// ΓöÇΓöÇΓöÇ Legacy booksApi shim (keeps old imports compiling) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
type AnyResponse = Promise<any>

export const booksApi = {
  fetchCustomers:         (params?: ListParams): AnyResponse => customersApi.list(params),
  fetchCustomerById:      (id: number | string): AnyResponse => customersApi.get(id),
  createCustomer:         (data: Record<string, unknown>): AnyResponse => customersApi.create(data),
  updateCustomer:         (id: number | string, data: Record<string, unknown>): AnyResponse => customersApi.update(id, data),
  fetchVendors:           (params?: ListParams): AnyResponse => vendorsApi.list(params),
  fetchItems:             (params?: ListParams): AnyResponse => itemsApi.list(params),
  fetchInvoices:          (params?: ListParams): AnyResponse => invoicesApi.list(params),
  fetchInvoiceById:       (id: number | string): AnyResponse => invoicesApi.get(id),
  createInvoice:          (data: Record<string, unknown>): AnyResponse => invoicesApi.create(data),
  updateInvoice:          (id: number | string, data: Record<string, unknown>): AnyResponse => invoicesApi.update(id, data),
  fetchExpenses:          (params?: ListParams): AnyResponse => expensesApi.list(params),
  fetchProjects:          (params?: ListParams): AnyResponse => projectsApi.list(params),
  fetchTimeEntries:       (params?: ListParams): AnyResponse => tasksApi.listAll(params),
  fetchBills:             (params?: ListParams): AnyResponse => billsApi.list(params),
  fetchManualJournals:    (params?: ListParams): AnyResponse => journalsApi.list(params),
  fetchBankAccounts:      (params?: ListParams): AnyResponse => bankingApi.accounts.list(params),
  fetchBankTransactions:  (params?: ListParams): AnyResponse => bankingApi.transactions.list(params),
  fetchDocuments:         (params?: ListParams): AnyResponse => documentsApi.list(params),
}

export type { ListParams }
