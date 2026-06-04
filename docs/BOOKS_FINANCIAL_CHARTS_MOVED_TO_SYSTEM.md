# Books Dashboard → System: Financial Charts Relocation

## Summary
Moved the Books dashboard financial chart blocks (**Cash Flow**, **Income and Expense**, **Top Expenses**) out of the Books Dashboard tab and into the Books **System → Analytics** area (`/reports`).

In the Dashboard tab, replaced those charts with **Books Sales Analytics** + **Invoices Pipeline** blocks (modeled after CRM’s `Sales Analytics` + `Deals Pipeline` layout).

## Scope
- `apps/books/app/(dashboard)/home/components/DashboardTab.tsx`
  - Removed financial chart UI
  - Added `BooksSalesAnalyticsWidget` and `BooksSalesPipelineWidget`
- `apps/books/app/(dashboard)/home/components/BooksSalesAnalyticsWidget.tsx` (new)
- `apps/books/app/(dashboard)/home/components/BooksSalesPipelineWidget.tsx` (new)
- `apps/books/app/reports/components/BooksFinancialCharts.tsx` (new)
- `apps/books/app/reports/page.tsx`
  - Now renders `BooksFinancialCharts`

## Notes
Chart data is still computed from existing Books APIs (`booksApi.fetchInvoices`, `booksApi.fetchExpenses`).
Sales Analytics and Pipeline are derived from invoice statuses (`Draft`, `Sent`, `Viewed`, `Partial`, `Paid`, `Overdue`).

