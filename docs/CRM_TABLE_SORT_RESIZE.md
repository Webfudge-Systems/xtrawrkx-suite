# CRM Table Sort & Column Resize

## Summary

Added **multi-column sort** and **drag-to-resize columns** to the three main CRM sales list tables (Lead Companies, Contacts, Deals), matching the feature set that already existed in the PM app.

## Scope

| File | Change |
|---|---|
| `apps/crm/lib/tableSortColumns.js` | New — sort column definitions for `leadCompany`, `contact`, `deal` entities |
| `apps/crm/lib/tableSortValues.js` | New — sort value getters for those entities |
| `apps/crm/hooks/useCrmTableSort.js` | New — wraps `useTableSort` from `@webfudge/ui` |
| `apps/crm/components/CrmTableSortDropdown.jsx` | New — thin wrapper around `TableSortPanel` from `@webfudge/ui` |
| `apps/crm/app/sales/lead-companies/page.js` | Sort + resize wired in |
| `apps/crm/app/sales/contacts/page.js` | Sort + resize wired in |
| `apps/crm/app/sales/deals/page.js` | Sort + resize wired in |

## Details

### Sort

- **Multi-column** — up to 5 sort rules, applied in priority order.
- **Persisted** — each page stores its sort rules in `localStorage` under a unique key (e.g. `crm.leadCompanies.tableSort`).
- **Client-side** — sort is applied after filtering on the current loaded page.
- **UI** — a "Sort" button appears in the `TabsWithActions` toolbar (uses the existing `showSort`/`onSortClick`/`hasActiveSort` props that were already built into the component). Clicking opens a `TableSortPanel` dropdown.
- **Header click** — clicking a sortable column header toggles sort; Shift-click adds a multi-column rule.
- **Sort panel** — rule priority numbers, Asc/Desc toggle buttons, up/down reorder, individual remove, and a "Clear all" button.

### Column Resize

- Drag the handle on the right edge of any column header to resize.
- Double-click the handle resets that column to its default width.
- Width state is kept in component state (per session); extend to `localStorage` if persistence across refreshes is desired.

## Entity Sort Columns

| Entity | Sortable keys |
|---|---|
| `leadCompany` | companyName, status, source, dealValue, contactsCount, assignedTo, type, subType, industry, score, healthScore, city, country, createdAt, updatedAt |
| `contact` | name, email, phone, jobTitle, company, source, assignedTo, city, country, createdAt, updatedAt |
| `deal` | deal, value, stage, priority, probability, company, owner, expectedCloseDate, createdAt, updatedAt |

## Architecture

The pattern mirrors PM:

```
PM:  usePmTableSort (pm/hooks) → useTableSort (@webfudge/ui) → TableSortPanel (@webfudge/ui)
CRM: useCrmTableSort (crm/hooks) → useTableSort (@webfudge/ui) → TableSortPanel (@webfudge/ui)
```

CRM adds its own entity-specific `tableSortColumns.js` and `tableSortValues.js` (parallel to PM's). The shared sort logic (`useTableSort`, `TableSortPanel`, `Table` with `resizableColumns`) lives entirely in `@webfudge/ui`.
