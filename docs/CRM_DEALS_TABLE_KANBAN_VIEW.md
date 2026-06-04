# CRM Deals — Table + Kanban on one page

## Summary

The **Deals** list (`/sales/deals`) supports **Table** and **Kanban** layouts on the same route. The choice is stored in `localStorage` as `crm.deals.viewMode` (`table` | `kanban`). The dedicated **Pipeline** page (`/sales/deals/pipeline`) still loads pipeline data via `getPipeline()` and uses the same shared **`DealsKanbanBoard`** component.

## Scope

- **Apps:** `apps/crm` — `app/sales/deals/page.js`, `app/sales/deals/pipeline/page.js`
- **Components:** `apps/crm/components/DealsKanbanBoard.jsx` (kanban + `DEAL_PIPELINE_STAGES` export)
- **UI:** `ViewToggleGroup` / `ViewToggleButton`, `TabsWithActions.afterTabs`

## Behavior

| Area | Notes |
|------|--------|
| Deals list | Tabs + segmented **Table / Kanban** icons after tabs; search; column picker only in **Table** view. |
| Kanban | Buckets from `DEAL_PIPELINE_STAGES`; drag column updates stage via existing `handleStageChange` / won prompt. |
| Pipeline route | Toolbar icons: **Table** → sets view to table and navigates to `/sales/deals`; **Kanban** stays on pipeline (active). |

## Usage / Migration

Optional: clear `crm.deals.viewMode` in devtools to reset. **Full pipeline** from the deals empty state still navigates to `/sales/deals/pipeline` (separate API surface).
