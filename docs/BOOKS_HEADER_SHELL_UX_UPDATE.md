# Books Header Shell UX Update

## Summary
Wired Books layout header controls to match CRM/PM behavior: clickable breadcrumbs, sub-page tab dropdown, functional toolbar icons, and hover profile card.

## Scope
- `apps/books/components/layout/Topbar.tsx` — clickable breadcrumb links
- `apps/books/components/layout/LayoutContent.tsx` — top padding + actions provider
- `apps/books/components/layout/SubPageTabs.tsx` — chevron tab picker for compact modules
- `apps/books/components/layout/TopbarTrailing.tsx` — filter/export/import/add, notifications, profile hover card
- `apps/books/context/BooksShellActionsContext.tsx` — page → header action bridge
- `apps/books/lib/routes.ts` — `getBreadcrumbItems()`, improved `getAddHref()` for items
- `apps/books/app/_components/BooksListPageShell.tsx` — registers filter/export handlers
- `apps/books/app/(dashboard)/home/_components/BooksHomeHubDataShell.tsx` — registers filter/export handlers

## Details
1. **Breadcrumbs** — `Dashboard > Items > All Items` links navigate back through the hierarchy.
2. **Tab dropdown** — Modules with ≤4 tabs (e.g. Items) show a chevron menu listing all sibling pages; larger modules keep the existing **More** overflow menu.
3. **Header actions** — Filter and export in the top pill call into the active list page via `BooksShellActionsContext`. Add navigates to the route’s create URL. Import opens a CSV file picker.
4. **Notifications** — Bell icon loads Books notifications from Strapi (same service as CRM) with unread badge and mark-read actions.
5. **Profile** — Avatar hover opens a fixed profile card (role, org, sign out) like CRM/PM `WorkspaceHeader`.

## Usage
List pages using `BooksListPageShell` automatically register header filter/export. Custom pages can call `useRegisterBooksShellActions({ onFilter, onExport, onImport })`.
