# Task `startDate` field

## Summary

Tasks now have an optional **start date** (`startDate`) in addition to the existing **due date** (`scheduledDate` in Strapi, exposed as `dueDate` in PM transformers). This aligns planning with a clear window from start → due.

## Scope

- **Backend**: `api::task.task` — new `startDate` datetime attribute in `schema.json`; generated `contentTypes.d.ts` updated.
- **PM app**: `transformTask` / `transformSubtask` expose `startDate`; task detail KPIs and info; inline edit and `QuickCreateTaskModal`; **My Tasks** table (toggleable column) and **project tasks** table.

## Usage / migration

- Restart or rebuild Strapi after pulling so the DB picks up the new column (SQLite dev DB updates on boot).
- Existing tasks have `startDate` null until set in the UI or API.
- Activity log labels reuse `FIELD_LABELS.startDate` (“Start date”) in `crm-activity-log.js`.
