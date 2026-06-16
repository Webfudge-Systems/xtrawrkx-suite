# Client Portal Global Search Update

## Summary

The dashboard header search bar (`Search anything...`) now opens a global search results modal, matching the CRM and PM workspace pattern (`WorkspaceSearchModal`).

## Scope

- `apps/xtrawrkx-client-portal/src/components/search/GlobalSearchModal.jsx` — modal UI
- `apps/xtrawrkx-client-portal/src/lib/api/portalGlobalSearchService.js` — client-scoped search
- `apps/xtrawrkx-client-portal/src/components/ui/PageHeader.jsx` — modal wiring, ⌘K / Ctrl+K shortcut
- `apps/xtrawrkx-client-portal/src/app/(protected)/dashboard/page.jsx` — uses global search (no page-local filter)

## Details

### How to use

- **Click** the dashboard search field, type a query, press **Enter** to open the modal with that text.
- Press **⌘K** (Mac) or **Ctrl+K** (Windows) from the dashboard to open search immediately.
- Press **Esc** to close the modal.

### What is searched

Results are scoped to the signed-in client account:

| Section | Source | Navigates to |
|---------|--------|--------------|
| Tasks | `/tasks/list-for-client` | `/tasks/[id]` |
| Projects | `/projects/list-for-client` | `/projects/[slug\|id]` |
| Communities | Static `COMMUNITIES_LIST` catalog | `/communities/[id]` |
| Company members | Company members API / cache | `/company/[memberId]` |

Up to 5 results per section; debounced 300ms while typing in the modal.

### Parity with CRM / PM

- Reuses shared `@webfudge/ui` `WorkspaceSearchModal` shell (same layout, footer hints, Esc handling).
- `PageHeader` accepts optional `renderGlobalSearchModal` for custom search UIs (same hook pattern as `AppPageHeader`).

## Migration

No API or config changes. Pages that pass `onSearchChange` to `PageHeader` keep inline filtering behavior and do not open the global modal.
