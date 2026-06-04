# Books System Analytics UI Update

## Summary
Upgraded the Books “System Analytics” page (`/reports`) to look like a full analytics dashboard: added KPI cards (Receivables/Payables + Unbilled metrics), kept the moved financial charts (Cash Flow, Income & Expense, Top Expenses), and introduced lightweight “Projects” and “Bank and Credit Cards” sections for a consistent `@webfudge/ui`-based layout.

## Scope
- App: `apps/books`
- Route: `/reports` (Books “System” -> “Reports & Forecasts”)
- Key files:
  - `apps/books/app/reports/page.tsx`
  - `apps/books/app/reports/components/BooksSystemAnalytics.tsx`
  - (reused) `apps/books/app/reports/components/BooksFinancialCharts.tsx`
  - Sales list pages now use a shared CRM-like shell in `apps/books/app/sales/_components/BooksSalesListShell.tsx`

## Details
- Replaced the old `/reports` content (chart-only) with `BooksSystemAnalytics`.
- KPI cards compute values from backend data:
  - Total Receivables (invoice balance due/total)
  - Total Payables (expense amount)
  - Unbilled Hours (billable time entries not invoiced)
  - Unbilled Expenses (billable expenses)
- Projects + bank sections display top items as placeholder “feature” blocks until deeper backend analytics are connected.
- Added the reference UI filters + placeholders:
  - Fiscal range dropdown (`This Fiscal Year`, `Previous Fiscal Year`, `Last 12 Months`)
  - Accounting-basis dropdown (`Accrual` / `Cash`)
  - When the selected fiscal range is not `This Fiscal Year`, the KPI/summary/watchlist numeric data is forced to `0` to match the “data not connected yet” UI state.

