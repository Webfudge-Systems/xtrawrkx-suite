# Shared table column preferences (`@webfudge/ui`)

## Summary

CRM and PM data tables can use **`useTableColumnPreferences`** and **`TableColumnPicker`** from `@webfudge/ui` for a consistent column experience: show/hide, drag-reorder, and drag-to-resize (via `Table` + `tableResizeProps`).

## Scope

- **Package:** `packages/ui` — `hooks/useTableColumnPreferences.js`, `components/TableColumnPicker/`
- **Table:** `resizableColumns` + visible resize handles on column header edges
- **Adopted:** All main list tables in **CRM**, **PM**, and **Accounts** apps (see below)

### CRM list pages
Lead Companies, Contacts, Deals, Client Accounts, Client Projects, Client Tasks, Client Invoices, Client Proposals, Automations, Meetings

### PM list pages
Projects, My Tasks, Client Accounts

### Accounts list pages
Users, Departments, Roles, Audit Logs, App Access

## Usage

```javascript
import { Table, TableColumnPicker, useTableColumnPreferences } from '@webfudge/ui';

const {
  columnVisibility,
  columnOrder,
  columnPickerOpen,
  setColumnPickerOpen,
  tableResizeProps,
  // …picker drag handlers, reset, etc.
} = useTableColumnPreferences({
  visibilityStorageKey: 'crm.myEntity.tableColumnVisibility',
  orderStorageKey: 'crm.myEntity.tableColumnOrder',
  widthsStorageKey: 'crm.myEntity.tableColumnWidths',
  defaultVisibility,
  reorderableKeys,
  defaultWidths,
  minWidths,
});

<Table columns={visibleColumns} data={rows} {...tableResizeProps} />
<TableColumnPicker open={columnPickerOpen} /* … */ />
```

## Column adjustment

| Feature | How |
|--------|-----|
| Show / hide | Eye toolbar → `TableColumnPicker` checkboxes |
| Reorder | Drag grip in picker dropdown |
| Resize | Drag the gray line on the right edge of each column header (double-click resets to default width) |

Preferences persist in `localStorage` per page `storageKey`.
