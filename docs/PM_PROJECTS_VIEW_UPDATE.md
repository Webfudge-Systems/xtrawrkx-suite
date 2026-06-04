# PM Projects View Update (View All)

## Summary
Refreshed the PM “Projects” view-all page to better match the provided reference UI: updated KPI cards and status tabs, and rebuilt the table to use the same 5-column structure (Project Name, Status, Project Lead, Progress, Team).

## Scope
- `apps/pm/app/projects/page.js`
- Uses existing `@webfudge/ui` components: `KPICard`, `TabsWithActions`, `Table`, `TableResultsCount`, `TableEmptyBelow`, `Avatar`, `Badge` (where applicable).

## Key UI Changes
- KPI cards: `Active`, `Planning`, `Completed`, `Overdue`
- Tabs: `All Projects`, `Active`, `Planning`, `Completed`, `On Hold`, `Overdue`
- Table columns:
- `PROJECT NAME`
- `STATUS` (UI-only dropdown)
- `PROJECT LEAD`
- `PROGRESS`
- `TEAM`
- `DATES` (start/end)
- `TASKS` (total tasks count)
- `ACTIONS` (view/edit/delete icons)

Note: `ACTIONS` are UI affordances in this table view (navigation + delete modal).

## Notes
- `Overdue` is derived client-side using `endDate < now` and excluding `COMPLETED`/`CANCELLED`.

## Header Alignment
- Updated `PMPageHeader` usage to include breadcrumb, inline search, icon-style Add/Export actions to match `ref-image 2`.
- Disabled search/add/export controls in `TabsWithActions` to avoid duplicates (header now owns those controls).

