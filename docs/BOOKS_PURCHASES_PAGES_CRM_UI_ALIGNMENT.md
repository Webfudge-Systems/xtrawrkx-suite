# Books Purchases Pages – CRM UI Alignment

## Summary
Aligned Books **Purchases** pages with the same CRM-style list-page patterns used in Books Sales: KPI cards, tabs/actions bar, results count, table container, and empty states — all using `@webfudge/ui` components for consistent UI.

## Scope
- App: `apps/books`
- Routes:
  - `/purchases` (Purchases landing)
  - `/purchases/vendors`
  - `/purchases/expenses`
  - `/purchases/recurring-expenses`
  - `/purchases/purchase-orders`
  - `/purchases/bills`
  - `/purchases/payments-made`
  - `/purchases/recurring-bills`
  - `/purchases/vendor-credits`

## Key files
- `apps/books/app/purchases/page.tsx`
- `apps/books/app/purchases/_components/BooksPurchasesListShell.tsx`
- Module list pages under `apps/books/app/purchases/*/page.tsx`
- `apps/books/components/layout/Topbar.tsx` (Purchases headbar parity with Sales)

## Details
- Added Purchases landing page cards using `Card` from `@webfudge/ui`.
- Added shared `BooksPurchasesListShell` using:
  - `KPICard`
  - `TabsWithActions` (search + icons bar)
  - `TableResultsCount`
  - `Table` (modern)
  - `TableEmptyBelow` with primary “Add …” action when create route exists (Vendors)
- Updated `Topbar` to treat `/purchases/*` like `/sales/*` (leaf title, module subtitle, actions, no header search).

