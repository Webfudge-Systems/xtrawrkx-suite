# Books Dark List UI Consistency

## Summary

Aligned Books list and hub pages with CRM/PM patterns for dark theme: **KPI row → `booksModern` toolbar (dark search + filter) → results count → table card**, plus filter **modals** and shared toolbar tokens.

## Scope

- `packages/ui/components/TabsWithActions/TabsWithActions.jsx` — `variant="booksModern"`, `searchInputClassName`
- `packages/ui/book-components/tables/booksToolbarStyles.ts` — search, filter, icon button classes
- `packages/ui/book-components/tables/RecentActivitiesTable.tsx`, `layout/BooksHubToolbar.tsx` — dark search/filter
- `apps/books/app/_components/BooksListPageShell.tsx` — shared list shell
- `apps/books/app/_components/ModulePage.tsx` — stub pages (documents, price lists, etc.) use the shell
- `apps/books/app/items/all/page.tsx`, `apps/books/app/reports/_components/BooksReportsHub.tsx`

## Layout pattern

1. **Top bar** — existing Books layout (`SubPageTabs` + `Topbar`)
2. **KPI row** — four `BooksKPICard` metrics
3. **Toolbar** — `TabsWithActions` with `booksModern` + `booksToolbarSearchInputClassName`
4. **Data** — `BooksListTableCard` + `BooksDataTable` + empty state
5. **Filter modal** — `Modal` at page bottom (CRM/PM style)

## Reports & documents

- **`/reports`** — `BooksReportsHub`: KPI row, insight cards (P&L, balance sheet, cash flow, document vault), then `BooksSystemAnalytics` charts.
- **`/documents/*`** — `ModulePage` now uses the full list shell until backend wiring.

## Usage

Import toolbar tokens from `@webfudge/ui/book-components`:

```ts
import { booksToolbarSearchInputClassName } from '@webfudge/ui/book-components'
```

List pages should use `BooksListPageShell` or domain wrappers (`BooksSalesListShell`, etc.) that re-export it.

## Migration

Replace bare `ModulePage` table-only layouts with `BooksListPageShell` when adding real API data; pass `kpis`, `tabs`, `columns`, and `filterModalBody` as needed.
