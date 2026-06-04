# Books Home Hub Pages (Activity, Announcements, Recent Updates)

## Summary

Three separate Books home routes replace query-param tabs. Each page is frontend-only with Zoho Books–inspired content, shared `@webfudge/ui` / `book-components` surfaces, and `--books-*` dark mode tokens.

## Scope

| Route | Purpose |
|-------|---------|
| `/home` | Dashboard (KPIs, charts, wallet, recent activities widget) |
| `/home/activity` | Org activity timeline (sales, purchases, banking, etc.) |
| `/home/announcements` | Product news, webinars, maintenance |
| `/home/recent-updates` | Audit-style record change log |

**Key files**

- `apps/books/app/(dashboard)/home/activity|announcements|recent-updates/page.tsx`
- `apps/books/app/(dashboard)/home/_components/BooksHome*Page.tsx`
- `apps/books/app/(dashboard)/home/_data/homeHubMock.ts`
- `packages/ui/book-components/layout/BooksHubToolbar.tsx`
- `apps/books/components/layout/SubPageTabs.tsx` — path-based tabs
- `apps/books/lib/routes.ts` — topbar meta per route

## UI building blocks

- `BooksHomeHubDataShell` — same CRM list chrome as `BooksSalesListShell`: `TabsWithActions` (`variant="booksModern"`) with tab badges, search, filter, column visibility, export; `BooksTableResultsCount`; `BooksListTableCard` with uppercase column header + body.
- `BooksKPICard`, `BooksListTableCard`, `BooksDataTable`, `BooksTableEmptyBelow`
- `booksToolbarSearchInputClassName` for in-toolbar search (matches CRM list pages)
- `Card`, `Badge`, `Button` from `@webfudge/ui`

## Usage

Navigate via home sub-tabs: **Dashboard · Activity · Announcements · Recent Updates**. Search and filter controls are visual only until backend wiring.

## Migration

Old URLs `?tab=activity` etc. are replaced by dedicated paths. Update bookmarks to `/home/activity`, `/home/announcements`, `/home/recent-updates`.
