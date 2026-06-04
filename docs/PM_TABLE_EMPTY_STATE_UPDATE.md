# PM Table Empty State (CRM-Aligned)

## Summary

PM list views now use the same pattern as CRM Lead Companies: a **“Showing N results”** line, a **white rounded shell** with border/shadow, a **`Table` header row** (even when there are zero rows), and a **`TableEmptyBelow`** block (icon, title, description, optional primary button) separated by a top border.

## Scope

- **UI package:** `Table` gained `variant="modernEmbedded"` (modern styling without an extra outer border; parent shell provides the frame). New exports: `TableResultsCount`, `TableEmptyBelow`.
- **PM app:** `app/my-tasks/page.js`, `app/projects/page.js`, `app/projects/[slug]/page.js` (Tasks and Members tabs when empty).

## Usage

```jsx
import { Table, TableResultsCount, TableEmptyBelow } from '@webfudge/ui'

<TableResultsCount count={rows.length} />
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <Table columns={columns} data={rows} variant="modernEmbedded" keyField="id" />
  {rows.length === 0 && (
    <TableEmptyBelow icon={MyIcon} title="..." description="..." action={<Button>...</Button>} />
  )}
</div>
```

## Migration

Existing `EmptyState` usage for standalone full-page empty UI is unchanged. Use `TableEmptyBelow` when the empty case belongs **below a table header** in a list page.
