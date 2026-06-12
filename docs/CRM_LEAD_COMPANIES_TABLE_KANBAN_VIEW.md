# CRM Lead Companies — Table + Kanban on one page

## Summary

The **Lead Companies** list (`/sales/lead-companies`) supports **Table**, **Kanban**, and **By members** layouts on the same route. The choice is stored in `localStorage` as `crm.leadCompanies.viewMode` (`table` | `kanban` | `members`). Kanban uses drag-and-drop to update lead status. **By members** is visible only to org **Managers** and **Admins**.

## Scope

- **Apps:** `apps/crm` — `app/sales/lead-companies/page.js`
- **Components:** `apps/crm/components/LeadsKanbanBoard.jsx`, `apps/crm/components/LeadsByMembersView.jsx`
- **RBAC:** `isCrmManagerOrAdmin()` in `apps/crm/lib/rbac.js`
- **UI:** `ViewToggleGroup` / `ViewToggleButton`, `TabsWithActions.afterTabs`

## Behavior

| Area | Notes |
|------|--------|
| Lead list | Status tabs + segmented **Table / Kanban / By members** icons after tabs (members icon managers/admins only); search; column picker and sort only in **Table** view. |
| Kanban | Columns: New → Contacted → Qualified → Lost → Converted → Client; drag card onto column calls `leadCompanyService.update` with new `status`. Status tabs filter visible columns (e.g. **New** shows only that column). |
| By members | One collapsible block per org user (all users listed, including zero leads); click member name to show/hide their leads table. Unassigned leads appear in an **Unassigned** section. Assigned-to column hidden. |
| Data | Kanban and By members load up to 500 leads per request (page 1) with current tab/search/filter applied server-side. |

## Usage / Migration

Optional: clear `crm.leadCompanies.viewMode` in devtools to reset. Default is **table**.
