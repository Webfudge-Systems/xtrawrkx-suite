# CRM Clients — Tasks & Projects table pages

## Summary

The **Clients → Tasks** (`/clients/tasks`) and **Clients → Projects** (`/clients/projects`) list pages were rebuilt to match the **Lead Companies** table experience: KPI cards, `TabsWithActions` (search, add, filter, column visibility, export), filter modal, `Table` with `@webfudge/ui` cell components, pagination, row actions (including `TableRowActionMenuPortal`), and persisted column visibility + drag-to-reorder (separate `localStorage` keys per page).

## Scope

| Area | Files / modules |
|------|-----------------|
| Tasks UI | `apps/crm/app/clients/tasks/page.js` |
| Projects UI | `apps/crm/app/clients/projects/page.js` |
| Task API client | `apps/crm/lib/api/taskService.js` — `getAll`, `create`, `update`, `delete`; shared normalization for list responses |
| Project API client | `apps/crm/lib/api/projectService.js` — new Strapi REST wrapper |
| Header | `apps/crm/components/CRMPageHeader.jsx` — forwards `onAddClick` and `onFilterClick` to `WorkspaceHeader` |

## Behavior

### Tasks

- Loads up to 500 tasks (`GET /api/tasks`) with populate: `assignee`, `deal`, `clientAccount`, `projects`, `leadCompany`.
- Tabs: All, Overdue, Scheduled, In progress, Review, Completed, Cancelled (counts from loaded rows).
- Advanced filters: status, priority, assignee, scheduled range (overdue / today / 7 days / 30 days), name contains.
- Row click: navigates to linked deal when present (`/sales/deals/:id`).
- Modals: create task (name + optional schedule), edit task (name, description, status, priority, scheduled), delete confirm.
- Status quick menu updates via `PUT /tasks/:id`.

### Projects

- Loads up to 500 projects (`GET /api/projects`) with populate: `projectManager`, `clientAccount`, `tasks`, `sourceDeal`, `organization`.
- Tabs: **All** plus one tab per distinct `status` value in the dataset (uppercase keys).
- If the active status tab disappears after refresh (e.g. no rows with that status), selection resets to **All**.
- Advanced filters: status, project manager, client name contains, created date range, budget band.
- Modals: create project (name + optional description), edit project (name, description, status text, budget, start/end dates), delete confirm.
- Row actions: board shortcut (`/clients/projects/board`), open source deal when linked.

### Shared patterns (aligned with Lead Companies)

- Column picker: checkboxes + drag handles + “Reset to default”.
- `Table` `variant="modern"`, `Pagination` at 15 rows per page client-side.
- Import / export hooks in the header and toolbar log to console (same placeholder style as lead companies).

## Usage / migration

- No database migration. Ensure the Strapi user can access `task` and `project` collection types for the active org (existing policies).
- Column preferences are isolated keys: `crm.clientsTasks.*` and `crm.clientsProjects.*`.

## Related docs

- [CRM_WON_DEAL_DELIVERY_PROJECT.md](./CRM_WON_DEAL_DELIVERY_PROJECT.md) — delivery project from won deals.
- [LEAD_COMPANIES_TABLE_COLUMN_VISIBILITY.md](./LEAD_COMPANIES_TABLE_COLUMN_VISIBILITY.md) — original column visibility pattern.
