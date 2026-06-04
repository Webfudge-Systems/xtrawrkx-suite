# PM CRM Parity Upgrade

## Summary

The PM app was upgraded to feel like a native extension of the CRM app. Project and task workflows now use the CRM page rhythm, table structure, record detail layouts, action menus, tabs, badges, empty states, and modal-based editing patterns.

This pass is frontend-first for comments, activity, and files. Those tabs now have CRM-style surfaces and accurate empty states, while backend schema support for persisted comments/activity/files remains deferred.

## Scope

- `apps/pm/app/projects/page.js`
- `apps/pm/app/projects/[slug]/page.js`
- `apps/pm/app/my-tasks/page.js`
- `apps/pm/app/tasks/[id]/page.js`
- `apps/pm/app/page.js`
- `apps/pm/components/GlobalSearchModal.jsx`
- `apps/pm/components/pmEntityDetailInfo.jsx`
- `apps/pm/components/PMStatusBadge.jsx`
- `apps/pm/components/PMProgress.jsx`
- `apps/pm/components/PMRowActions.jsx`
- `apps/pm/components/QuickCreateTaskModal.jsx`
- `apps/pm/lib/api/dataTransformers.js`
- `apps/pm/lib/api/projectService.js`
- `apps/pm/lib/api/taskService.js`

## Details

- Project list now uses a CRM-style table with search, filters, owner/status fields, inline status updates, row action menus, pagination, and a Kanban board view.
- Task list now uses CRM-style table cells, shared quick-create/edit modal, inline status/priority/assignee updates, bulk delete, and row links to task detail records.
- Project detail now follows the CRM detail pattern: header badges/actions, pill tabs, overview cards, embedded task table, activity tab, and files tab.
- Task detail was added at `/tasks/[id]` with overview, comments, activity, and files tabs.
- Shared PM components centralize status/priority badges, detail field typography, progress bars, row actions, and quick-create task forms.
- PM data transforms now expose `projectId`, `assigneeId`, `clientName`, and `team` aliases so tables, forms, and details use consistent normalized data.

## Usage / Migration

- Use `/projects` for the upgraded project list and Kanban view.
- Use `/projects/[slug]` for CRM-style project records.
- Use `/my-tasks` for task list management and quick-create.
- Use `/tasks/[id]` for task records. Global search and dashboard task links now route here instead of the previous dead `?task=` query flow.

Backend support for comments, activity logs, and attachments can be added later without changing the tab structure introduced in this pass.
