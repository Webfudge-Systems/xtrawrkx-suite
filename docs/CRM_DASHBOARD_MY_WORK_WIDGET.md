# CRM Dashboard: My work widget

## Summary

The home dashboard **Quick Access** (counts + shortcuts) and **Templates** (placeholder list) blocks were removed. **My work** — the same task summary previously shown in the sidebar (from `GET /tasks/my-work`) — now lives in a dedicated dashboard card. Tasks are shown as a **vertical list**: sections **Overdue → Due today → Upcoming**, each with full-width rows (left accent stripe, hover, chevron), not a three-column grid.

The sidebar **My work** section was removed so task context is not duplicated; users open **Dashboard** or **Clients → Tasks** for the full list.

## Scope

- `apps/crm/components/dashboard/MyWorkWidget.jsx` — new widget
- `apps/crm/components/dashboard/index.js` — export `MyWorkWidget` (replaces `QuickActionsWidget`)
- `apps/crm/app/page.js` — right column uses `MyWorkWidget`
- Removed `apps/crm/components/dashboard/QuickActionsWidget.jsx`
- `apps/crm/components/CRMSidebar.jsx` — removed My work state, polling, and UI
- `apps/crm/lib/api/taskService.js` — comment update only (`my-work` usage)

## Usage

- Dashboard loads My work automatically; data refreshes every 60 seconds (same interval as the former sidebar).
- Task rows link to the related lead company when `leadCompany` is present; otherwise they link to `/clients/tasks`.
- **View all tasks** in the widget footer goes to `/clients/tasks`.

## API

Unchanged: `fetchMyWorkSummary()` → Strapi `GET /tasks/my-work`.
