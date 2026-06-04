# Task progress field removal

## Summary

Removed the per-task `progress` integer (0–100%) from the platform. Task completion is represented by **status** only (e.g. `COMPLETED`). **Project** delivery progress (derived from completed vs total tasks) is unchanged.

## Scope

| Area | Change |
|------|--------|
| `apps/backend/src/api/task/content-types/task/schema.json` | Removed `progress` attribute |
| `apps/backend/src/api/task/controllers/task.js` | Dropped progress from recurrence spawn, subtask fields, member update whitelist |
| `apps/pm` | Task detail (slider, key info, sidebar), My Tasks optional column, transformers, `taskService` |
| `apps/crm/app/clients/tasks/page.js` | Optional Progress column removed |
| `docs/PM_ORG_ROLE_SCOPING.md` | Member updates = status only |

## Migration

After deploy, restart Strapi so the content-type change is applied. Existing DB rows may still have a `progress` column until you run a manual migration; Strapi will ignore unknown columns. To drop the column in Postgres: `ALTER TABLE tasks DROP COLUMN IF EXISTS progress;` (optional).

## Usage

- **Members** can still change task **status** on visible tasks.
- **Admins/managers** use full task edit flows as before.
- **Projects** continue to show % complete from task status counts on project overview and list views.
