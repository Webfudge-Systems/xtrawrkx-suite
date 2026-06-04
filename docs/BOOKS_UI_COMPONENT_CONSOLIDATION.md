# Books UI Component Consolidation

## Summary

Books list and dashboard pages now use shared primitives from `@webfudge/ui` (`Card`, `KPICard`, `Table`, `TableResultsCount`, `TableEmptyBelow`) with a **`books` theme/surface** instead of duplicate wrappers in `packages/ui/book-components`.

`book-components` keeps only Books-specific widgets (banking cards, charts, activity feed, hub shells, toolbar tokens).

## Scope

- `packages/ui/components/*` — `theme` / `surface` props
- `packages/ui/themes/booksSurface.js` — shared Books CSS class tokens
- `packages/ui/book-components` — removed `BooksKPICard`, `BooksDataTable`, `BooksTableChrome`
- `apps/books` — imports updated

## Shared components (use from `@webfudge/ui`)

| Need | Use |
|------|-----|
| KPI tile (list + home) | `<KPICard theme="books" … />` |
| List table | `<Table variant="books" … />` inside `<Card surface="books" padding={false} />` |
| Results count | `<TableResultsCount theme="books" count={n} />` |
| Empty state below table | `<TableEmptyBelow theme="books" … />` |
| Generic elevated card | `<Card surface="books" variant="elevated" />` |

## Still in `@webfudge/ui/book-components`

- Dashboard: `StackedBankCards`, `TotalBalanceCard`, `MonthlySpendingLimitCard`, `BooksQuickAccessCard`, `BooksChartViewSwitcher`, `RecentActivitiesTable`, etc.
- Hub layout: `BooksHubDataShell`, `BooksHubToolbar`, `BooksHubFeedBody`
- Tokens: `booksToolbarSearchInputClassName`, `BooksDataColumn` type
- Types: `BooksDataColumn` in `book-components/types.ts`

## Migration

Replace:

```tsx
import { BooksKPICard, BooksDataTable, BooksListTableCard } from '@webfudge/ui/book-components'
```

With:

```tsx
import { Card, KPICard, Table, TableResultsCount, TableEmptyBelow } from '@webfudge/ui'
```
