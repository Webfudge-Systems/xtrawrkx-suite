# Books Shell Refactor (Sidebar, Header, Tabs)

## Summary
Books app shell was refactored to a Finexy-inspired layout pattern while preserving page/business logic. The update targets only shell zones: sidebar, header bar, and sub-page tabs.

## Scope
- App: `apps/books`
- New files:
  - `apps/books/components/layout/SubPageTabs.tsx`
  - `apps/books/lib/tabs.ts`
  - `apps/books/lib/routes.ts`
- Updated files:
  - `apps/books/components/layout/LayoutContent.tsx`
  - `apps/books/components/layout/Topbar.tsx`
  - `apps/books/components/layout/Sidebar.tsx`

## Details
### 1) Sub-page Tabs
- Added route-driven tab strip component rendered above the header.
- Active tab is derived from `usePathname()` and navigates via `next/link`.
- Tabs appear for Sales, Purchases, Items, Time Tracking, Accountant, and Documents.
- Tabs are hidden on Home, Banking, Reports, login, and unauthorized routes.

### 2) Header Bar
- Replaced boxed title/search header wrapper with a bare text header:
  - breadcrumb line
  - page title
  - subtitle
- Added right-side grouped controls:
  - action icon group (filter/export/import/add, route-aware)
  - notification button
  - profile chip
- Route metadata and action configuration are sourced from `lib/routes.ts`.

### 3) Sidebar
- Refactored into three floating containers:
  - branding pill
  - main navigation pill
  - utility pill
- Added collapsed/expanded behavior with localStorage persistence:
  - key: `books-sidebar-collapsed`
  - collapsed width: icon-only rail
  - expanded width: icon + labels
- Added internal grouping/dividers in nav stack and active-state styling using Books accent color.

## Notes
- No data-fetching, business logic, or module page body content was changed.
- Visual updates are scoped to Books shell layout only.
