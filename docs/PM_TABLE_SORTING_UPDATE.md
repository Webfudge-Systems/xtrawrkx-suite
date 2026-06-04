# PM Table Sorting Update Summary

## Summary

Added client-side **single- and multi-column sorting** to PM data tables: clickable column headers (with Shift+click for additional sort keys), a toolbar **Sort** button with a multi-rule panel, and persisted sort preferences per screen via `localStorage`.

## Scope

### Shared UI (`packages/ui`)

- `utils/tableSort.js` — compare, multi-rule sort, column enrichment, storage helpers
- `hooks/useTableSort.js` — React state for sort rules
- `components/TableSortPanel/` — UI to add, reorder, and clear sort rules
- `components/Table/Table.jsx` — sortable headers with direction icons and priority badges
- `components/TabsWithActions/` — optional Sort toolbar button (`showSort`, `hasActiveSort`)

### PM app

- `apps/pm/lib/tableSortValues.js` — value extractors per entity (task, project, client account, contact, deal, invoice, account project)
- `apps/pm/lib/tableSortColumns.js` — sortable field labels per entity
- `apps/pm/hooks/usePmTableSort.js` — PM wrapper around `useTableSort`
- `apps/pm/components/PmTableSortDropdown.jsx` — positioned sort panel for list toolbars

### Pages / components wired

| Location | Storage key (example) |
| -------- | --------------------- |
| My Tasks (`/my-tasks`) table view | `pm.myTasks.tableSort` |
| Projects list | `pm.projects.tableSort` |
| Project detail → Tasks tab | `pm.projectTasks.tableSort` |
| Client accounts list | `pm.clientAccounts.tableSort` |
| Client account detail tabs (contacts, deals, projects, invoices) | `pm.accountDetail.{id}.*.sort` |
| Dashboard My Tasks widget | `pm.dashboard.myTasks.sort` |
| Task detail → Subtasks tab | `pm.taskDetail.{id}.subtasks.sort` |
| Inline / nested subtask tables | Session-only (no storage) |

## Usage

1. **Quick sort:** Click a column header — cycles **asc → desc → off**. Only that column applies unless you use multi-sort.
2. **Multi-sort:** Hold **Shift** and click another header, or open the **Sort** button (↕) in the toolbar and add rules. Rules run **top to bottom** (first rule = highest priority).
3. **Clear:** Use **Clear all sorts** in the sort panel, or click the active column header until sort is removed.

## Migration

No API or schema changes. Existing column visibility / order preferences are unchanged. Users may clear sort via the panel if a stored rule behaves unexpectedly.
