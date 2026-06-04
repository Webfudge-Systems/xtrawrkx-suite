# Books Home Dashboard — KPI, Layout & Dark Mode

## Summary

Books home (`/home`) uses CRM-style KPI tiles and a wireframe-aligned grid: **Total Income** + **Quick Access** on top, **Total Balance** + **Monthly Limit** in the middle, **My Wallet** + **Recent Activities** on the bottom. All surfaces use `@webfudge/ui/book-components` with `--books-*` tokens for light/dark consistency.

## Scope

- `apps/books/app/(dashboard)/home/page.tsx` — layout grid, KPI row spacing, quick-access counts
- `packages/ui/book-components/cards/BooksKPICard.tsx` — optional `change` / `changeType` (CRM trend footer)
- `packages/ui/book-components/cards/BooksQuickAccessCard.tsx` — new CRM-style Quick Access grid

## Layout (desktop `xl+`)

| Row | Left (8 cols) | Right (4 cols) |
|-----|---------------|----------------|
| 1 | Total Income (P&amp;L chart) | Quick Access (row-span 2) |
| 2 | Total Balance (4) + Monthly Limit (4) | ↑ |
| 3 | My Wallet (3) + Recent Activities (5) | — |

Equal row heights: top/middle rows `280px`, bottom row `340px`.

## Details

- KPIs: `BooksKPICard` (not raw `KPICard`) so cards match dark `--books-bg-card`.
- Quick Access: Invoices, Customers, Expenses, Reports with live counts where available.
- KPI row: `pt-4`–`pt-6` top spacing below header tabs.

## Usage

Reload Books home after pull. No migration.
