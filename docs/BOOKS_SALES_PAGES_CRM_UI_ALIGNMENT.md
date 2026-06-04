# Books Sales Pages – CRM UI Alignment

## Summary
Aligned Books **Sales** pages with CRM list-page UI patterns for consistent look and behavior across modules.

## Scope
- App: `apps/books`
- Routes:
  - `/sales` (Sales landing)
  - `/sales/customers`
  - `/sales/invoices`
  - `/sales/estimates`
  - `/sales/sales-orders`
  - `/sales/delivery-challans`
  - `/sales/retainer-invoices`
  - `/sales/recurring-invoices`
  - `/sales/credit-notes`
  - `/sales/payments-received`

## Key files
- `apps/books/app/sales/page.tsx`
- `apps/books/app/sales/_components/BooksSalesListShell.tsx`
- Module list pages under `apps/books/app/sales/*/page.tsx`

## Details
- Added a shared CRM-like list shell (`BooksSalesListShell`) built with `@webfudge/ui`:
  - KPI cards row (`KPICard`)
  - Tab + actions toolbar (`TabsWithActions`) with search and action buttons
  - Results count (`TableResultsCount`)
  - CRM-style table container (`Table` in `modern` variant)
  - Empty state (`TableEmptyBelow`) with primary “Add …” action when a create route exists
- Implemented a Sales landing page (`/sales`) with CRM-like module cards using `Card` and lucide icons.
- Updated existing Sales pages to use the shared shell (Customers + Invoices + placeholder modules).

