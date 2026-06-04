# Books Accountant Pages – CRM UI Alignment

## Summary
Aligned Books **Accountant** pages with the same UI system used for Books Sales/Purchases: CRM-style headbar behavior, KPI cards, tabs/actions bar, results count, tables, empty states, and placeholder chart cards — all using `@webfudge/ui` for consistency.

## Scope
- App: `apps/books`
- Routes:
  - `/accountant` (Accountant landing)
  - `/accountant/manual-journals`
  - `/accountant/bulk-update`
  - `/accountant/currency-adjustments`
  - `/accountant/chart-of-accounts`
  - `/accountant/transaction-locking`

## Key files
- `apps/books/app/accountant/page.tsx`
- `apps/books/app/accountant/_components/BooksAccountantListShell.tsx`
- Module pages under `apps/books/app/accountant/*/page.tsx`
- `apps/books/components/layout/Topbar.tsx` (Accountant headbar parity)

## Details
- Added an Accountant landing page with module cards using `Card` from `@webfudge/ui`.
- Added `BooksAccountantListShell` with:
  - `KPICard`
  - `TabsWithActions` (search + icons bar)
  - `TableResultsCount`
  - `Table` (modern)
  - `TableEmptyBelow`
  - Optional chart blocks (placeholder “0 data” cards) for modules where charts are expected.
- Updated `Topbar` to treat `/accountant/*` like `/sales/*` and `/purchases/*` (leaf title + module subtitles + actions, no header search).

