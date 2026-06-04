# CRM Task Scope Filter

## Summary

CRM surfaces now show **CRM-scoped tasks only** — tasks linked to a lead company, client account, contact, or deal. **PM project-only tasks** (no CRM relations) are excluded from My work, dashboard widgets, the tasks list, manager views, team performance, and calendar task events.

This mirrors the inverse of PM `getPMTasksByAssignee`, which already excludes CRM-linked tasks from PM My Tasks.

## Scope

- **CRM app**: `apps/crm/lib/crmTasks.js`, `apps/crm/lib/api/taskService.js` (all list/my-work calls pass `scope=crm` + client-side filter)
- **Backend**: `apps/backend/src/utils/task-scope.js`, `apps/backend/src/api/task/controllers/task.js` (`find` + `my-work` with `?scope=crm`)

## CRM task definition

A task is CRM-scoped when any of these relations is set:

- `leadCompany`
- `clientAccount`
- `contact`
- `deal`

Tasks linked **only** to `projects` (and no CRM relation) are PM tasks and do not appear in CRM.

## Usage

CRM `taskService` automatically applies scope — no page-level changes required. Restart Strapi after backend deploy so `scope=crm` filtering is active on `/api/tasks` and `/api/tasks/my-work`.