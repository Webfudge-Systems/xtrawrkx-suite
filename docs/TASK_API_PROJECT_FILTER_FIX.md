# Task list: respect `filters[projects]` (project detail)

## Summary

`GET /api/tasks` uses a custom controller `find` that merges org-scoped filters. It forwarded `deal`, `status`, `assignee`, etc., but **not** `projects`. Query params such as `filters[projects][id][$eq]=<projectId>` were ignored, so the PM project **Tasks** tab received **every task in the organization** (same count as My Tasks).

## Fix

- **`apps/backend/src/api/task/controllers/task.js`** — Apply `extra.projects` (and `extra.priority`) into the `entityService.findMany` filters so tasks can be restricted to a linked project.

## Scope

- Backend only for filtering behavior.
- **`apps/pm/lib/api/taskService.js`** — `getTasksByProject` now populates `projects` on each task for consistent clients (`transformTask`).

Restart Strapi after deploying the controller change.
